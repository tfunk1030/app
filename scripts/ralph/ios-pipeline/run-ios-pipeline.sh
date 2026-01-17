#!/bin/bash

# Ralph iOS App Store Readiness Pipeline
# Runs the full iOS readiness audit and implementation pipeline

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "=========================================="
echo "  Ralph iOS App Store Readiness Pipeline"
echo "=========================================="
echo ""
echo "Project: $PROJECT_ROOT"
echo "Pipeline: $SCRIPT_DIR/prd.json"
echo ""

# Check if Claude CLI is available
if ! command -v claude &> /dev/null; then
    echo "Error: Claude CLI not found. Please install Claude Code."
    exit 1
fi

# Create branch for iOS readiness work
cd "$PROJECT_ROOT"
BRANCH_NAME="ios/app-store-readiness"

# Check if branch exists
if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
    echo "Switching to existing branch: $BRANCH_NAME"
    git checkout $BRANCH_NAME
else
    echo "Creating new branch: $BRANCH_NAME"
    git checkout -b $BRANCH_NAME
fi

echo ""
echo "Starting iOS App Store Readiness Pipeline..."
echo ""
echo "Components to audit:"
echo "  - IOS-001: App Store Metadata & Assets"
echo "  - IOS-002: App Icons & Launch Screen"
echo "  - IOS-003: Privacy & Permissions"
echo "  - IOS-004: In-App Purchases & Subscriptions"
echo "  - IOS-005: Performance & Stability"
echo "  - IOS-006: Security & Compliance"
echo "  - IOS-007: Build & Distribution Configuration"
echo "  - IOS-008: Accessibility Compliance"
echo "  - IOS-GLOBAL: App Store Review Guidelines Check"
echo ""

# Run Claude with the iOS pipeline prompt
claude --print "
Read the iOS App Store readiness pipeline configuration at scripts/ralph/ios-pipeline/prd.json and the prompt at scripts/ralph/ios-pipeline/prompt.md.

Execute the full iOS App Store readiness pipeline:

1. For each component (IOS-001 through IOS-008):
   - Phase 1: Audit - Read files, check requirements, document findings
   - Phase 2: Implementation - Fix P0 and P1 issues
   - Phase 3: Verification - Re-audit and confirm pass/fail

2. After all components pass, run IOS-GLOBAL:
   - Verify App Store Review Guidelines compliance
   - Create final submission checklist
   - Document any remaining concerns

3. Update prd.json status as you complete each phase

4. Commit changes with descriptive messages

Continue until ALL phases are complete and the app is ready for App Store submission.
"

echo ""
echo "=========================================="
echo "  iOS Pipeline Complete"
echo "=========================================="
