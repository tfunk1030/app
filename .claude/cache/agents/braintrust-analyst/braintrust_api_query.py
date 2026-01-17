#!/usr/bin/env python3
"""
Braintrust API Analysis Script
Queries the Braintrust API for session data, agent usage, and patterns.
"""

import os
import json
import requests
from datetime import datetime, timedelta
from collections import defaultdict

# Configuration
API_KEY = "sk-40jAOt0HJWGq05pDdFFyh5DnUGExqhcdfxlvUhTRGdt6XcsA"
PROJECT_NAME = "claude-code"
BASE_URL = "https://api.braintrust.dev/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}


def get_projects():
    """List all projects."""
    url = f"{BASE_URL}/project"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching projects: {response.status_code}")
        print(response.text)
        return None


def get_experiments(project_id: str, limit: int = 10):
    """List experiments for a project."""
    url = f"{BASE_URL}/experiment"
    params = {"project_id": project_id, "limit": limit}
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching experiments: {response.status_code}")
        print(response.text)
        return None


def get_logs(project_id: str, limit: int = 100):
    """Fetch logs/spans for a project."""
    url = f"{BASE_URL}/project_logs/{project_id}/fetch"
    payload = {"limit": limit}
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching logs: {response.status_code}")
        print(response.text)
        return None


def analyze_sessions(logs_data):
    """Analyze session data from logs."""
    if not logs_data or "events" not in logs_data:
        return {}

    sessions = defaultdict(lambda: {
        "spans": [],
        "tools": defaultdict(int),
        "start_time": None,
        "end_time": None,
        "total_tokens": 0,
        "errors": []
    })

    for event in logs_data.get("events", []):
        # Extract session info
        root_span_id = event.get("root_span_id") or event.get("span_id", "unknown")

        session = sessions[root_span_id]
        session["spans"].append(event)

        # Track timestamps
        created = event.get("created")
        if created:
            if session["start_time"] is None or created < session["start_time"]:
                session["start_time"] = created
            if session["end_time"] is None or created > session["end_time"]:
                session["end_time"] = created

        # Track tool usage
        span_attributes = event.get("span_attributes", {})
        tool_name = span_attributes.get("name") or event.get("input", {}).get("tool") if isinstance(event.get("input"), dict) else None
        if tool_name:
            session["tools"][tool_name] += 1

        # Track tokens
        metrics = event.get("metrics", {})
        if metrics:
            session["total_tokens"] += metrics.get("tokens", 0) or 0
            session["total_tokens"] += metrics.get("prompt_tokens", 0) or 0
            session["total_tokens"] += metrics.get("completion_tokens", 0) or 0

        # Track errors
        if event.get("error"):
            session["errors"].append(event.get("error"))

    return sessions


def detect_loops(sessions):
    """Detect repeated tool patterns that might indicate loops."""
    loops = []

    for session_id, session in sessions.items():
        tool_sequence = []
        for span in sorted(session["spans"], key=lambda x: x.get("created", "")):
            span_attrs = span.get("span_attributes", {})
            tool = span_attrs.get("name")
            if tool:
                tool_sequence.append(tool)

        # Look for repeated patterns
        if len(tool_sequence) >= 6:
            for pattern_len in range(2, 5):
                for i in range(len(tool_sequence) - pattern_len * 2):
                    pattern = tuple(tool_sequence[i:i + pattern_len])
                    count = 0
                    j = i
                    while j + pattern_len <= len(tool_sequence):
                        if tuple(tool_sequence[j:j + pattern_len]) == pattern:
                            count += 1
                            j += pattern_len
                        else:
                            break
                    if count >= 3:
                        loops.append({
                            "session_id": session_id,
                            "pattern": list(pattern),
                            "repetitions": count
                        })

    return loops


def print_report(projects, logs_data, sessions, loops):
    """Print the analysis report."""
    print("=" * 70)
    print("BRAINTRUST ANALYSIS REPORT")
    print(f"Generated: {datetime.now().isoformat()}")
    print("=" * 70)

    # Projects
    print("\n## PROJECTS")
    print("-" * 40)
    if projects and "objects" in projects:
        for proj in projects["objects"]:
            print(f"  - {proj.get('name', 'Unknown')} (ID: {proj.get('id', 'N/A')})")
    else:
        print("  No projects found or error fetching projects")

    # Sessions Summary
    print("\n## RECENT SESSIONS")
    print("-" * 40)

    if sessions:
        sorted_sessions = sorted(
            sessions.items(),
            key=lambda x: x[1].get("start_time", "") or "",
            reverse=True
        )[:10]

        for session_id, session in sorted_sessions:
            start = session.get("start_time", "Unknown")
            span_count = len(session["spans"])
            tool_count = sum(session["tools"].values())
            token_count = session["total_tokens"]
            error_count = len(session["errors"])

            print(f"\n  Session: {session_id[:12]}...")
            print(f"    Started: {start}")
            print(f"    Spans: {span_count}")
            print(f"    Tool Calls: {tool_count}")
            print(f"    Tokens: {token_count}")
            print(f"    Errors: {error_count}")

            if session["tools"]:
                print(f"    Top Tools: {dict(sorted(session['tools'].items(), key=lambda x: -x[1])[:5])}")
    else:
        print("  No sessions found in logs")

    # Agent Usage Statistics
    print("\n## TOOL/AGENT USAGE STATISTICS")
    print("-" * 40)

    all_tools = defaultdict(int)
    for session in sessions.values():
        for tool, count in session["tools"].items():
            all_tools[tool] += count

    if all_tools:
        sorted_tools = sorted(all_tools.items(), key=lambda x: -x[1])
        for tool, count in sorted_tools[:15]:
            print(f"  {tool}: {count} calls")
    else:
        print("  No tool usage data found")

    # Loop Detection
    print("\n## LOOP DETECTION")
    print("-" * 40)

    if loops:
        for loop in loops[:5]:
            print(f"  Session: {loop['session_id'][:12]}...")
            print(f"    Pattern: {' -> '.join(loop['pattern'])}")
            print(f"    Repetitions: {loop['repetitions']}")
    else:
        print("  No loops detected")

    # Raw Data Summary
    print("\n## RAW DATA SUMMARY")
    print("-" * 40)
    if logs_data:
        print(f"  Total events: {len(logs_data.get('events', []))}")
        print(f"  Cursor: {logs_data.get('cursor', 'N/A')}")

    print("\n" + "=" * 70)
    print("END OF REPORT")
    print("=" * 70)


def main():
    print("Fetching Braintrust data...")

    # Get projects
    projects = get_projects()

    project_id = None
    if projects and "objects" in projects:
        for proj in projects["objects"]:
            if proj.get("name") == PROJECT_NAME:
                project_id = proj.get("id")
                break
        if not project_id and projects["objects"]:
            project_id = projects["objects"][0].get("id")

    logs_data = None
    sessions = {}
    loops = []

    if project_id:
        print(f"Using project ID: {project_id}")
        logs_data = get_logs(project_id, limit=200)

        if logs_data:
            sessions = analyze_sessions(logs_data)
            loops = detect_loops(sessions)
    else:
        print("No project found!")

    print_report(projects, logs_data, sessions, loops)

    return {
        "projects": projects,
        "logs": logs_data,
        "sessions": sessions,
        "loops": loops
    }


if __name__ == "__main__":
    main()
