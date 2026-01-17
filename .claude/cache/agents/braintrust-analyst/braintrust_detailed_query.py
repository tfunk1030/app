#!/usr/bin/env python3
"""
Braintrust API Deep Query - Try multiple endpoints to find session data.
"""

import os
import json
import requests
from datetime import datetime, timedelta

# Configuration
API_KEY = "sk-40jAOt0HJWGq05pDdFFyh5DnUGExqhcdfxlvUhTRGdt6XcsA"
PROJECT_ID = "afc1499d-38a7-468d-94ff-b1af944f35b2"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}


def try_endpoint(method, url, payload=None, params=None):
    """Try an endpoint and return results."""
    print(f"\n>> {method} {url}")
    if params:
        print(f"   Params: {params}")
    if payload:
        print(f"   Payload: {json.dumps(payload)[:200]}...")

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params)
        else:
            response = requests.post(url, headers=headers, json=payload)

        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict):
                print(f"   Keys: {list(data.keys())}")
                for key, value in data.items():
                    if isinstance(value, list):
                        print(f"   {key}: {len(value)} items")
                    elif isinstance(value, dict):
                        print(f"   {key}: dict with keys {list(value.keys())[:5]}")
                    else:
                        print(f"   {key}: {str(value)[:100]}")
            return data
        else:
            print(f"   Error: {response.text[:500]}")
            return None
    except Exception as e:
        print(f"   Exception: {e}")
        return None


def main():
    print("=" * 70)
    print("BRAINTRUST API ENDPOINT EXPLORATION")
    print(f"Project ID: {PROJECT_ID}")
    print("=" * 70)

    base_urls = [
        "https://api.braintrust.dev/v1",
        "https://www.braintrust.dev/api/v1",
    ]

    all_results = {}

    for base in base_urls:
        print(f"\n{'='*60}")
        print(f"TRYING BASE: {base}")
        print("=" * 60)

        # 1. Project details
        result = try_endpoint("GET", f"{base}/project/{PROJECT_ID}")
        if result:
            all_results["project"] = result

        # 2. List experiments
        result = try_endpoint("GET", f"{base}/experiment", params={"project_id": PROJECT_ID, "limit": 20})
        if result:
            all_results["experiments"] = result

        # 3. List datasets
        result = try_endpoint("GET", f"{base}/dataset", params={"project_id": PROJECT_ID})
        if result:
            all_results["datasets"] = result

        # 4. Project logs - try different endpoints
        result = try_endpoint("POST", f"{base}/project_logs/{PROJECT_ID}/fetch", payload={"limit": 100})
        if result:
            all_results["logs_fetch"] = result

        result = try_endpoint("POST", f"{base}/project_logs/{PROJECT_ID}/fetch", payload={
            "limit": 100,
            "filters": []
        })
        if result:
            all_results["logs_fetch_filtered"] = result

        # 5. Try spans endpoint
        result = try_endpoint("GET", f"{base}/spans", params={"project_id": PROJECT_ID, "limit": 50})
        if result:
            all_results["spans"] = result

        # 6. Try project scores
        result = try_endpoint("GET", f"{base}/project_score", params={"project_id": PROJECT_ID})
        if result:
            all_results["scores"] = result

        # 7. Try views
        result = try_endpoint("GET", f"{base}/view", params={"project_id": PROJECT_ID, "object_type": "project_logs"})
        if result:
            all_results["views"] = result

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY OF FINDINGS")
    print("=" * 70)

    for key, value in all_results.items():
        print(f"\n{key}:")
        if isinstance(value, dict):
            if "objects" in value:
                print(f"  Found {len(value['objects'])} objects")
                for obj in value["objects"][:3]:
                    print(f"    - {obj.get('name', obj.get('id', 'Unknown'))}")
            elif "events" in value:
                print(f"  Found {len(value['events'])} events")
            else:
                print(f"  Keys: {list(value.keys())}")
        else:
            print(f"  Type: {type(value)}")

    # Check experiments for actual data
    if "experiments" in all_results and all_results["experiments"].get("objects"):
        print("\n" + "=" * 70)
        print("EXPERIMENT DETAILS")
        print("=" * 70)

        for exp in all_results["experiments"]["objects"][:5]:
            print(f"\nExperiment: {exp.get('name', 'Unknown')}")
            print(f"  ID: {exp.get('id')}")
            print(f"  Created: {exp.get('created')}")

            # Try to fetch experiment data
            exp_id = exp.get("id")
            if exp_id:
                for base in base_urls:
                    result = try_endpoint("POST", f"{base}/experiment/{exp_id}/fetch", payload={"limit": 20})
                    if result and result.get("events"):
                        print(f"  Events: {len(result['events'])}")
                        for event in result["events"][:2]:
                            print(f"    - Span: {event.get('span_id', 'N/A')[:12]}...")
                            print(f"      Input: {str(event.get('input', ''))[:100]}")
                        break


if __name__ == "__main__":
    main()
