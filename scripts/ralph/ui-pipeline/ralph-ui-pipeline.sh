#!/bin/bash
# Ralph UI Pipeline for Claude Code (Bash)
#
# Multi-agent UI review pipeline:
# 1. RAMS reviews UI
# 2. GPT cross-reviews via moderator
# 3. ui-ux-pro-max skill synthesizes
# 4. RAMS creates final plan
# 5. Claude implements
# 6. Both review changes
# 7. Fix issues & commit
#
# Usage: ./ralph-ui-pipeline.sh [max_iterations]

set -e

MAX_ITERATIONS=${1:-50}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         AICaddyPro UI Multi-Agent Review Pipeline              ║"
echo "║                                                                ║"
echo "║  Reviewers: RAMS → GPT → ui-ux-pro-max → RAMS                 ║"
echo "║  Strategy: Per-component, then global consistency              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
echo -e "${CYAN}🔄 Checking prerequisites...${NC}"

if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ Claude Code CLI not found. Install with: npm install -g @anthropic-ai/claude-code${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not found. Some status output may be limited.${NC}"
fi

# Check files exist
PRD_PATH="$SCRIPT_DIR/prd.json"
PROMPT_PATH="$SCRIPT_DIR/prompt.md"

if [ ! -f "$PRD_PATH" ]; then
    echo -e "${RED}❌ prd.json not found at $PRD_PATH${NC}"
    exit 1
fi

if [ ! -f "$PROMPT_PATH" ]; then
    echo -e "${RED}❌ prompt.md not found at $PROMPT_PATH${NC}"
    exit 1
fi

# Show status
if command -v jq &> /dev/null; then
    BRANCH=$(jq -r '.branchName' "$PRD_PATH")
    TOTAL=$(jq '.userStories | length' "$PRD_PATH")
    COMPLETED=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_PATH")
    
    echo -e "ℹ️  Branch: ${BRANCH}"
    echo -e "ℹ️  Progress: ${COMPLETED} / ${TOTAL} components"
fi

# Change to project root
cd "$PROJECT_ROOT"

# Check/create branch
if command -v jq &> /dev/null; then
    BRANCH=$(jq -r '.branchName' "$PRD_PATH")
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    
    if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
        echo -e "${CYAN}🔄 Switching to branch: ${BRANCH}${NC}"
        if git show-ref --verify --quiet "refs/heads/$BRANCH" 2>/dev/null; then
            git checkout "$BRANCH"
        else
            echo -e "ℹ️  Creating new branch: ${BRANCH}"
            git checkout -b "$BRANCH"
        fi
    fi
fi

echo ""
echo -e "${CYAN}🔄 Starting Ralph iterations (max: $MAX_ITERATIONS)${NC}"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
    echo -e "${GRAY}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  Iteration $i / $MAX_ITERATIONS${NC}"
    echo -e "${GRAY}═══════════════════════════════════════════════════════════${NC}"
    
    # Show current component
    if command -v jq &> /dev/null; then
        CURRENT=$(jq -r '[.userStories[] | select(.passes == false)] | .[0] | "\(.id): \(.title) (Phase: \(.currentPhase))"' "$PRD_PATH")
        echo -e "ℹ️  Current: ${CURRENT}"
    fi
    
    # Run Claude with prompt
    OUTPUT=$(cat "$PROMPT_PATH" | claude --dangerously-skip-permissions 2>&1 | tee /dev/stderr) || true
    
    # Check for completion
    if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✅ PIPELINE COMPLETE!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "ℹ️  All components reviewed and polished."
        echo -e "ℹ️  Reviews saved to: scripts/ralph/ui-pipeline/reviews/"
        exit 0
    fi
    
    echo ""
    echo -e "ℹ️  Iteration complete. Starting next in 3 seconds..."
    sleep 3
done

echo -e "${YELLOW}⚠️  Maximum iterations ($MAX_ITERATIONS) reached.${NC}"
echo -e "ℹ️  Pipeline may not be complete. Check prd.json for state."
echo -e "ℹ️  Run again to continue."

exit 1
