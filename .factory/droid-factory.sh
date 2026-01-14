#!/bin/bash
# Droid Factory - Autonomous Quality Pipeline
# Loops Claude Code to process task queue until complete

set -e

MAX_ITERATIONS=${1:-20}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  DROID FACTORY - Autonomous Quality Pipeline"
echo "=============================================="
echo ""
echo "Max iterations: $MAX_ITERATIONS"
echo "Project: $PROJECT_DIR"
echo ""

# Ensure reviews directory exists
mkdir -p "$SCRIPT_DIR/reviews"

# Initialize progress file if needed
if [ ! -f "$SCRIPT_DIR/progress.txt" ]; then
  echo "# Droid Factory Progress Log" > "$SCRIPT_DIR/progress.txt"
  echo "" >> "$SCRIPT_DIR/progress.txt"
  echo "## Codebase Patterns" >> "$SCRIPT_DIR/progress.txt"
  echo "(Add reusable patterns here)" >> "$SCRIPT_DIR/progress.txt"
  echo "" >> "$SCRIPT_DIR/progress.txt"
  echo "---" >> "$SCRIPT_DIR/progress.txt"
  echo "" >> "$SCRIPT_DIR/progress.txt"
fi

cd "$PROJECT_DIR"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══════════════════════════════════════════"
  echo "  Iteration $i of $MAX_ITERATIONS"
  echo "═══════════════════════════════════════════"
  echo ""

  # Run Claude with the droid factory prompt
  OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" \
    | claude --dangerously-skip-permissions 2>&1 \
    | tee /dev/stderr) || true

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "=============================================="
    echo "  DROID FACTORY COMPLETE"
    echo "=============================================="
    echo ""
    echo "All tasks processed successfully!"
    echo "See .factory/reviews/ for outputs"
    echo "See .factory/progress.txt for learnings"
    exit 0
  fi

  # Brief pause between iterations
  sleep 2
done

echo ""
echo "=============================================="
echo "  MAX ITERATIONS REACHED"
echo "=============================================="
echo ""
echo "Completed $MAX_ITERATIONS iterations without finishing."
echo "Check .factory/prd.json for remaining tasks."
exit 1
