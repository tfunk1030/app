#!/usr/bin/env python3
"""
Check all Braintrust projects for data.
"""

import json
import requests
from datetime import datetime

API_KEY = "sk-40jAOt0HJWGq05pDdFFyh5DnUGExqhcdfxlvUhTRGdt6XcsA"
BASE_URL = "https://api.braintrust.dev/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}


def get_all_projects():
    """Get all projects."""
    url = f"{BASE_URL}/project"
    response = requests.get(url, headers=headers, params={"limit": 100})
    if response.status_code == 200:
        return response.json().get("objects", [])
    return []


def get_project_logs(project_id, limit=50):
    """Get logs for a project."""
    url = f"{BASE_URL}/project_logs/{project_id}/fetch"
    response = requests.post(url, headers=headers, json={"limit": limit})
    if response.status_code == 200:
        return response.json().get("events", [])
    return []


def get_experiments(project_id):
    """Get experiments for a project."""
    url = f"{BASE_URL}/experiment"
    response = requests.get(url, headers=headers, params={"project_id": project_id, "limit": 50})
    if response.status_code == 200:
        return response.json().get("objects", [])
    return []


def get_experiment_logs(exp_id, limit=50):
    """Get logs for an experiment."""
    url = f"{BASE_URL}/experiment/{exp_id}/fetch"
    response = requests.post(url, headers=headers, json={"limit": limit})
    if response.status_code == 200:
        return response.json().get("events", [])
    return []


def main():
    print("=" * 70)
    print("BRAINTRUST - ALL PROJECTS DATA CHECK")
    print(f"Time: {datetime.now().isoformat()}")
    print("=" * 70)

    projects = get_all_projects()
    print(f"\nFound {len(projects)} projects:\n")

    total_events = 0

    for proj in projects:
        name = proj.get("name", "Unknown")
        pid = proj.get("id")
        created = proj.get("created", "Unknown")

        print(f"\n{'='*60}")
        print(f"PROJECT: {name}")
        print(f"  ID: {pid}")
        print(f"  Created: {created}")

        # Check project logs
        logs = get_project_logs(pid, limit=100)
        print(f"  Project Logs: {len(logs)} events")
        total_events += len(logs)

        if logs:
            print("\n  Sample Events:")
            for event in logs[:5]:
                span_id = event.get("span_id", "N/A")[:12]
                created = event.get("created", "N/A")
                span_attrs = event.get("span_attributes", {})
                name = span_attrs.get("name", event.get("input", {}).get("tool", "Unknown") if isinstance(event.get("input"), dict) else "Unknown")
                print(f"    - {span_id}... | {created} | {name}")

        # Check experiments
        experiments = get_experiments(pid)
        print(f"\n  Experiments: {len(experiments)}")

        for exp in experiments[:5]:
            exp_name = exp.get("name", "Unknown")
            exp_id = exp.get("id")
            print(f"\n    Experiment: {exp_name}")
            print(f"      ID: {exp_id}")

            exp_logs = get_experiment_logs(exp_id, limit=50)
            print(f"      Events: {len(exp_logs)}")
            total_events += len(exp_logs)

            if exp_logs:
                for event in exp_logs[:3]:
                    span_id = event.get("span_id", "N/A")[:12]
                    input_data = event.get("input", {})
                    if isinstance(input_data, dict):
                        input_preview = str(input_data)[:100]
                    else:
                        input_preview = str(input_data)[:100]
                    print(f"        - {span_id}... | {input_preview}")

    print("\n" + "=" * 70)
    print(f"TOTAL EVENTS FOUND: {total_events}")
    print("=" * 70)

    # Check organization info
    print("\n\nORGANIZATION INFO:")
    org_url = f"{BASE_URL}/organization"
    org_response = requests.get(org_url, headers=headers)
    if org_response.status_code == 200:
        orgs = org_response.json().get("objects", [])
        for org in orgs:
            print(f"  - {org.get('name', 'Unknown')} (ID: {org.get('id')})")
    else:
        print(f"  Error: {org_response.status_code}")


if __name__ == "__main__":
    main()
