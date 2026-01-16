#!/usr/bin/env python3
"""Braintrust session analyzer for Claude Code using REST API."""

import os
import sys
import json
import requests
from datetime import datetime, timedelta
from collections import Counter
from dotenv import load_dotenv

# Load env from ~/.claude/.env
load_dotenv(os.path.expanduser("~/.claude/.env"))

# Configuration
API_KEY = os.getenv("BRAINTRUST_API_KEY")
PROJECT_NAME = os.getenv("BRAINTRUST_CC_PROJECT", "claude-code")
BASE_URL = "https://api.braintrust.dev/v1"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}


def api_get(endpoint, params=None):
    """Make a GET request to Braintrust API."""
    url = f"{BASE_URL}{endpoint}"
    response = requests.get(url, headers=HEADERS, params=params)
    if response.status_code != 200:
        print(f"API Error: {response.status_code} - {response.text}")
        return None
    data = response.json()
    # Braintrust wraps list responses in {"objects": [...]}
    if isinstance(data, dict) and "objects" in data:
        return data["objects"]
    return data


def api_post(endpoint, data=None):
    """Make a POST request to Braintrust API."""
    url = f"{BASE_URL}{endpoint}"
    response = requests.post(url, headers=HEADERS, json=data or {})
    if response.status_code not in [200, 201]:
        print(f"API Error: {response.status_code} - {response.text}")
        return None
    return response.json()


def get_project_id():
    """Get the project ID for PROJECT_NAME."""
    projects = api_get("/project")
    if not projects:
        return None
    for p in projects:
        if p.get("name") == PROJECT_NAME:
            return p.get("id")
    return None


def list_projects():
    """List all available projects."""
    projects = api_get("/project")
    print("\n## Available Braintrust Projects\n")
    if not projects:
        print("No projects found or API error")
        return
    for p in projects:
        name = p.get("name", "unnamed")
        pid = p.get("id", "")[:8]
        created = p.get("created", "unknown")
        print(f"- **{name}** (ID: {pid}...)")


def fetch_project_logs(project_id, limit=100):
    """Fetch logs from a project."""
    # Try the project logs fetch endpoint
    data = api_post(f"/project_logs/{project_id}/fetch", {"limit": limit})
    if data and "events" in data:
        return data["events"]
    return []


def analyze_sessions(limit=200):
    """Analyze recent sessions."""
    print(f"## Braintrust Analysis for Project: {PROJECT_NAME}\n")

    project_id = get_project_id()
    if not project_id:
        print(f"Project '{PROJECT_NAME}' not found")
        list_projects()
        return

    print(f"Project ID: `{project_id[:12]}...`\n")

    # Fetch recent logs
    events = fetch_project_logs(project_id, limit)

    if not events:
        print("No events found in recent logs")
        print("\nNote: Make sure BRAINTRUST_API_KEY is valid and the project has data")
        return

    # Group by root_span_id (session)
    sessions = {}
    for event in events:
        root_id = event.get("root_span_id") or event.get("span_id", "unknown")
        if root_id not in sessions:
            sessions[root_id] = {
                "spans": [],
                "start_time": None,
                "end_time": None
            }
        sessions[root_id]["spans"].append(event)

        # Track timing
        created = event.get("created")
        if created:
            if not sessions[root_id]["start_time"] or created < sessions[root_id]["start_time"]:
                sessions[root_id]["start_time"] = created
            if not sessions[root_id]["end_time"] or created > sessions[root_id]["end_time"]:
                sessions[root_id]["end_time"] = created

    print(f"Found **{len(sessions)}** unique sessions\n")

    # Sort by most recent
    sorted_sessions = sorted(
        sessions.items(),
        key=lambda x: x[1].get("end_time") or "",
        reverse=True
    )

    # Analyze top 5 sessions
    for i, (session_id, session_data) in enumerate(sorted_sessions[:5]):
        spans = session_data["spans"]
        print(f"\n### Session {i+1}: `{session_id[:16]}...`")
        print(f"**Spans:** {len(spans)}")

        if session_data["start_time"]:
            print(f"**Started:** {session_data['start_time']}")

        # Analyze tool usage
        tool_counts = Counter()
        agent_counts = Counter()
        skill_counts = Counter()
        errors = []

        for span in spans:
            name = span.get("name", "")
            metadata = span.get("metadata", {}) or {}
            error = span.get("error")

            # Track errors
            if error:
                errors.append({"name": name, "error": str(error)[:100]})

            # Get span attributes
            span_attrs = span.get("span_attributes", {}) or {}
            span_type = span_attrs.get("type", "")
            span_name = span_attrs.get("name", name)

            # Detect tools (type=tool in span_attributes OR tool_name in metadata)
            if span_type == "tool" or metadata.get("tool_name"):
                tool_name = metadata.get("tool_name") or span_name
                tool_counts[tool_name] += 1
            elif name.startswith("tool/") or "Tool" in name:
                tool_name = name.replace("tool/", "")
                tool_counts[tool_name] += 1

            # Detect LLM calls (type=llm in span_attributes)
            if span_type == "llm":
                model = metadata.get("model", span_name)
                agent_counts[f"LLM: {model}"] += 1

            # Detect agents (Task spans)
            if "agent" in name.lower() or "Task" in name:
                agent_type = metadata.get("subagent_type") or metadata.get("agent_type") or name
                agent_counts[agent_type] += 1

            # Detect skills
            if "skill" in name.lower() or name.startswith("/"):
                skill_name = metadata.get("skill") or name
                skill_counts[skill_name] += 1

            # Detect turns
            if span_type == "task" and span_name.startswith("Turn"):
                agent_counts[span_name] += 1

        # Output analysis
        if tool_counts:
            print("\n**Tool Usage:**")
            for tool, count in tool_counts.most_common(10):
                print(f"  - {tool}: {count}")

        if agent_counts:
            print("\n**Agent Spawns:**")
            for agent, count in agent_counts.most_common(5):
                print(f"  - {agent}: {count}")

        if skill_counts:
            print("\n**Skills:**")
            for skill, count in skill_counts.most_common(5):
                print(f"  - {skill}: {count}")

        if errors:
            print(f"\n**Errors:** {len(errors)}")
            for err in errors[:3]:
                print(f"  - {err['name']}: {err['error'][:50]}...")


def detect_loops(limit=500):
    """Detect potential loops in sessions."""
    print(f"## Loop Detection for Project: {PROJECT_NAME}\n")

    project_id = get_project_id()
    if not project_id:
        print(f"Project '{PROJECT_NAME}' not found")
        return

    events = fetch_project_logs(project_id, limit)

    if not events:
        print("No events found")
        return

    # Group by session
    sessions = {}
    for event in events:
        root_id = event.get("root_span_id") or event.get("span_id", "unknown")
        if root_id not in sessions:
            sessions[root_id] = []
        sessions[root_id].append(event)

    print(f"Analyzing {len(sessions)} sessions for loops...\n")

    loops_found = []
    for session_id, spans in sessions.items():
        # Sort spans by time
        sorted_spans = sorted(spans, key=lambda x: x.get("created", ""))
        names = [s.get("name", "") for s in sorted_spans]

        # Detect repeated consecutive patterns
        i = 0
        while i < len(names) - 4:
            pattern = names[i]
            if pattern:
                count = 1
                for j in range(i + 1, len(names)):
                    if names[j] == pattern:
                        count += 1
                    else:
                        break
                if count >= 5:
                    loops_found.append({
                        "session": session_id[:16],
                        "pattern": pattern,
                        "count": count
                    })
                    break
            i += 1

    if loops_found:
        print(f"**Found {len(loops_found)} potential loops:**\n")
        for loop in loops_found:
            print(f"- Session `{loop['session']}...`: **{loop['pattern']}** repeated {loop['count']} times")
    else:
        print("No obvious loops detected (>5 consecutive same tool calls)")


def weekly_summary():
    """Show weekly activity summary."""
    print(f"## Weekly Summary for Project: {PROJECT_NAME}\n")

    project_id = get_project_id()
    if not project_id:
        print(f"Project '{PROJECT_NAME}' not found")
        return

    events = fetch_project_logs(project_id, limit=1000)

    if not events:
        print("No events found")
        return

    # Group by day
    daily_counts = Counter()
    daily_tools = {}

    for event in events:
        created = event.get("created", "")
        if created:
            day = created[:10]  # YYYY-MM-DD
            daily_counts[day] += 1

            if day not in daily_tools:
                daily_tools[day] = Counter()

            name = event.get("name", "")
            if name.startswith("tool/"):
                daily_tools[day][name.replace("tool/", "")] += 1

    # Output by day
    for day in sorted(daily_counts.keys(), reverse=True)[:7]:
        print(f"\n### {day}")
        print(f"**Total Events:** {daily_counts[day]}")
        if daily_tools.get(day):
            top_tools = daily_tools[day].most_common(5)
            print("**Top Tools:** " + ", ".join([f"{t}: {c}" for t, c in top_tools]))


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python braintrust_analyze.py <command>")
        print("\nCommands:")
        print("  --last-session    Analyze recent sessions")
        print("  --list-projects   List available projects")
        print("  --detect-loops    Find repeated tool patterns")
        print("  --weekly-summary  Daily activity breakdown")
        return

    cmd = sys.argv[1]

    if cmd == "--last-session":
        analyze_sessions()
    elif cmd == "--list-projects":
        list_projects()
    elif cmd == "--detect-loops":
        detect_loops()
    elif cmd == "--weekly-summary":
        weekly_summary()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
