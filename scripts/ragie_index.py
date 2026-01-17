#!/usr/bin/env -S .venv/bin/python3
"""
Ragie Document Indexer

Upload and index PDF books into Ragie partitions for skill upgrades.

Usage:
    # Index a single book
    .venv/bin/python scripts/ragie_index.py \
        --file ~/books/LaValle-Planning-Algorithms.pdf \
        --partition decision-theory \
        --title "Planning Algorithms" \
        --author "Steven M. LaValle"

    # Index with chapter metadata
    .venv/bin/python scripts/ragie_index.py \
        --file ~/books/sutton-barto-rl.pdf \
        --partition decision-theory \
        --title "Reinforcement Learning: An Introduction" \
        --author "Sutton & Barto"

Environment:
    RAGIE_API_KEY - Required Ragie API key

Partitions for Skill Upgrader:
    decision-theory - LaValle Planning Algorithms, Sutton & Barto RL
    modal-logic     - Blackburn Modal Logic, Huth & Ryan Logic in CS
"""

import argparse
import os
import sys
import time
from pathlib import Path


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
        print("  .venv/bin/pip install ragie", file=sys.stderr)
        sys.exit(1)


def index_document(
    file_path: str,
    partition: str,
    title: str = None,
    author: str = None,
    wait: bool = True
) -> str:
    """
    Upload and index a document into Ragie.

    Args:
        file_path: Path to the document (PDF, TXT, etc.)
        partition: Partition name for organization
        title: Optional document title
        author: Optional author name
        wait: Whether to wait for indexing to complete

    Returns:
        Document ID
    """
    client = get_ragie_client()
    path = Path(file_path)

    if not path.exists():
        print(f"ERROR: File not found: {file_path}", file=sys.stderr)
        sys.exit(1)

    # Build metadata (title and author go here, partition is separate)
    metadata = {}
    if title:
        metadata["title"] = title
    if author:
        metadata["author"] = author

    print(f"Uploading: {path.name}")
    print(f"Partition: {partition}")
    print(f"Metadata: {metadata}")

    try:
        from ragie.models.createdocumentparams import CreateDocumentParams, File

        # Upload document using correct API structure
        with open(path, "rb") as f:
            response = client.documents.create(
                request=CreateDocumentParams(
                    file=File(
                        file_name=path.name,
                        content=f,
                        content_type="application/pdf"
                    ),
                    partition=partition,
                    metadata=metadata if metadata else None,
                    name=title or path.stem
                )
            )

        doc_id = response.id
        print(f"Document ID: {doc_id}")

        if wait:
            print("Waiting for indexing to complete...")
            status = response.status

            while status not in ["ready", "failed"]:
                time.sleep(5)
                doc = client.documents.get(document_id=doc_id)
                status = doc.status
                print(f"  Status: {status}")

            if status == "ready":
                print("SUCCESS: Document indexed and ready for retrieval")
            else:
                print(f"FAILED: Document indexing failed", file=sys.stderr)
                sys.exit(1)
        else:
            print(f"Document uploaded. Status: {response.status}")
            print("Use --list to check indexing progress")

        return doc_id

    except Exception as e:
        print(f"ERROR: Upload failed: {e}", file=sys.stderr)
        sys.exit(1)


def list_documents(partition: str = None):
    """List all documents, optionally filtered by partition."""
    client = get_ragie_client()

    try:
        response = client.documents.list()

        print("Documents in Ragie:")
        print("-" * 60)

        for doc in response.result.documents:
            doc_partition = doc.metadata.get("partition", "none") if doc.metadata else "none"

            if partition and doc_partition != partition:
                continue

            title = doc.metadata.get("title", doc.name) if doc.metadata else doc.name
            print(f"\nID: {doc.id}")
            print(f"  Title: {title}")
            print(f"  Partition: {doc_partition}")
            print(f"  Status: {doc.status}")

    except Exception as e:
        print(f"ERROR: Failed to list documents: {e}", file=sys.stderr)
        sys.exit(1)


def delete_document(doc_id: str):
    """Delete a document from Ragie."""
    client = get_ragie_client()

    try:
        client.documents.delete(document_id=doc_id)
        print(f"Deleted document: {doc_id}")
    except Exception as e:
        print(f"ERROR: Failed to delete: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Index documents into Ragie for RAG retrieval",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "--file", "-f",
        help="Path to document to index (PDF, TXT, DOCX, etc.)"
    )
    parser.add_argument(
        "--partition", "-p",
        help="Partition name (e.g., decision-theory, modal-logic)"
    )
    parser.add_argument(
        "--title", "-t",
        help="Document title"
    )
    parser.add_argument(
        "--author", "-a",
        help="Document author"
    )
    parser.add_argument(
        "--no-wait",
        action="store_true",
        help="Don't wait for indexing to complete"
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List all indexed documents"
    )
    parser.add_argument(
        "--delete", "-d",
        metavar="DOC_ID",
        help="Delete a document by ID"
    )

    args = parser.parse_args()

    if args.list:
        list_documents(partition=args.partition)
        return

    if args.delete:
        delete_document(args.delete)
        return

    if not args.file:
        parser.error("--file is required for indexing")

    if not args.partition:
        parser.error("--partition is required for indexing")

    index_document(
        file_path=args.file,
        partition=args.partition,
        title=args.title,
        author=args.author,
        wait=not args.no_wait
    )


if __name__ == "__main__":
    main()
