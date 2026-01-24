#!/usr/bin/env -S .venv/bin/python3
"""
Ragie RAG Query Script

Query indexed documents in Ragie partitions for skill upgrades.

Usage:
    uv run python scripts/ragie_query.py -q "MDP state space" -p decision-theory
    uv run python scripts/ragie_query.py -q "temporal logic" -p modal-logic --rerank
    uv run python scripts/ragie_query.py -q "policy gradient" -p decision-theory --top-k 10

Environment:
    RAGIE_API_KEY - Required Ragie API key

Partitions:
    decision-theory - LaValle Planning Algorithms, Sutton & Barto RL
    modal-logic     - Blackburn Modal Logic, Huth & Ryan Logic in CS
    math-textbooks  - Rudin analysis, other math texts
"""

import argparse
import json
import os
import sys
from typing import Optional


def get_ragie_client():
    """Initialize Ragie client with API key from environment."""
    api_key = os.environ.get("RAGIE_API_KEY")
    if not api_key:
        print("ERROR: RAGIE_API_KEY environment variable not set", file=sys.stderr)
        print("\nTo set up:", file=sys.stderr)
        print("  1. Get API key from https://app.ragie.ai/settings/api-keys", file=sys.stderr)
        print("  2. Export: export RAGIE_API_KEY='your_key_here'", file=sys.stderr)
        sys.exit(1)

    try:
        from ragie import Ragie
        return Ragie(auth=api_key)
    except ImportError:
        print("ERROR: ragie package not installed", file=sys.stderr)
        print("\nTo install:", file=sys.stderr)
        print("  uv pip install ragie", file=sys.stderr)
        print("  # or: pip install ragie", file=sys.stderr)
        sys.exit(1)


def query_ragie(
    query: str,
    partition: Optional[str] = None,
    top_k: int = 5,
    rerank: bool = False,
    output_format: str = "text"
) -> None:
    """
    Query Ragie for relevant document chunks.

    Args:
        query: The search query
        partition: Partition name to filter (decision-theory, modal-logic, etc.)
        top_k: Number of results to return
        rerank: Whether to rerank results for relevance
        output_format: Output format (text, json)
    """
    client = get_ragie_client()

    # Build filter for partition if specified
    filter_obj = None
    if partition:
        filter_obj = {"partition": partition}

    try:
        response = client.retrievals.retrieve(
            query=query,
            top_k=top_k,
            rerank=rerank,
            filter=filter_obj
        )

        if output_format == "json":
            results = []
            for chunk in response.scored_chunks:
                results.append({
                    "score": chunk.score,
                    "text": chunk.text,
                    "document": getattr(chunk, 'document_name', 'Unknown'),
                    "metadata": getattr(chunk, 'document_metadata', {})
                })
            print(json.dumps(results, indent=2))
        else:
            # Text format
            if not response.scored_chunks:
                print(f"No results found for query: '{query}'")
                if partition:
                    print(f"Partition filter: {partition}")
                return

            print(f"Query: {query}")
            if partition:
                print(f"Partition: {partition}")
            print(f"Results: {len(response.scored_chunks)}")
            print("-" * 60)

            for i, chunk in enumerate(response.scored_chunks, 1):
                doc_name = getattr(chunk, 'document_name', 'Unknown Document')
                print(f"\n[{i}] Score: {chunk.score:.4f}")
                print(f"    Document: {doc_name}")
                print(f"    Text: {chunk.text[:500]}...")

                # Show metadata if available
                metadata = getattr(chunk, 'document_metadata', {})
                if metadata:
                    chapter = metadata.get('chapter', '')
                    section = metadata.get('section', '')
                    if chapter or section:
                        print(f"    Reference: {chapter} {section}".strip())

    except Exception as e:
        print(f"ERROR: Ragie query failed: {e}", file=sys.stderr)
        sys.exit(1)


def list_partitions():
    """List available partitions (documents grouped by metadata)."""
    client = get_ragie_client()

    try:
        # List documents to see available partitions
        response = client.documents.list()
        partitions = set()

        for doc in response.result.documents:
            metadata = getattr(doc, 'metadata', {}) or {}
            partition = metadata.get('partition')
            if partition:
                partitions.add(partition)

        print("Available partitions:")
        for p in sorted(partitions):
            print(f"  - {p}")

        if not partitions:
            print("  (No partitions found - documents may not have partition metadata)")

    except Exception as e:
        print(f"ERROR: Failed to list partitions: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Query Ragie RAG for document retrieval",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "-q", "--query",
        help="Search query text"
    )
    parser.add_argument(
        "-p", "--partition",
        help="Partition to filter (e.g., decision-theory, modal-logic)"
    )
    parser.add_argument(
        "--top-k", "-k",
        type=int,
        default=5,
        help="Number of results to return (default: 5)"
    )
    parser.add_argument(
        "--rerank",
        action="store_true",
        help="Enable reranking for better relevance"
    )
    parser.add_argument(
        "--format", "-f",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)"
    )
    parser.add_argument(
        "--list-partitions",
        action="store_true",
        help="List available partitions"
    )

    args = parser.parse_args()

    if args.list_partitions:
        list_partitions()
        return

    if not args.query:
        parser.error("Query (-q/--query) is required unless using --list-partitions")

    query_ragie(
        query=args.query,
        partition=args.partition,
        top_k=args.top_k,
        rerank=args.rerank,
        output_format=args.format
    )


if __name__ == "__main__":
    main()
