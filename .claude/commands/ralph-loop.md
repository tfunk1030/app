# Ralph Loop - Autonomous UI Pipeline

Start the Ralph Wiggum autonomous loop for UI review and polish.

## Initialization

First, initialize the loop state:

```powershell
# Create activation flag
New-Item -Path ".ralph-active" -ItemType File -Force | Out-Null

# Reset iteration counter
"0" | Set-Content ".ralph-iteration"

# Remove any stale completion flag
Remove-Item ".ralph-complete" -Force -ErrorAction SilentlyContinue
```

## Context

Read the current pipeline state:
- `scripts/ralph/ui-pipeline/prd.json` - Component status and phases
- `scripts/ralph/ui-pipeline/progress.txt` - Previous learnings
- `scripts/ralph/ui-pipeline/prompt.md` - Full phase instructions

## Your Task

$ARGUMENTS

If no specific task given, execute the UI Multi-Agent Review Pipeline:
1. Read prd.json to find the current component and phase
2. Execute ONE phase for the current component
3. Update prd.json with results
4. The Stop Hook will automatically restart you for the next phase

## Completion

When ALL components have `passes: true` in prd.json, output:

<promise>COMPLETE</promise>

This signals the Stop Hook to allow the session to end.

## Important

- Execute ONE phase per iteration (the hook handles continuity)
- Always update prd.json after each phase
- Log learnings to progress.txt
- The hook will restart you automatically until complete
