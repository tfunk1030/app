---
name: droid-factory
description: Run the autonomous droid quality pipeline
---

Start the Droid Factory autonomous loop for quality audits and fixes.

## Initialization

First, check/create activation state:

```bash
# Ensure reviews directory exists
mkdir -p .factory/reviews

# Check current task queue
cat .factory/prd.json | jq '.taskQueue | length' 2>/dev/null || echo "0"
```

## Context

Read the current factory state:
- `.factory/prd.json` - Task queue, droid registry, global checks
- `.factory/progress.txt` - Previous learnings
- `.factory/prompt.md` - Full orchestration instructions

## Your Task

$ARGUMENTS

### If no arguments given:

1. Read `.factory/prd.json` to check task queue
2. If queue is empty, prompt user for tasks to add:
   - `/appstore-blockers` - iOS submission check
   - `/security-audit` - Security and privacy audit
   - `/perf-audit` - Performance profiling
   - `/weather-check` - Weather API health
   - `/pre-pr` - Pre-PR code review
   - `/ui-audit` - UI/UX review
3. Execute ONE task using appropriate droid
4. Update prd.json with results
5. Log to progress.txt

### If arguments specify a task:

Add task to queue and execute:

```
/droid-factory security    → Queue security-audit task
/droid-factory ios         → Queue appstore-blockers task
/droid-factory perf        → Queue perf-audit task
/droid-factory weather     → Queue weather-check task
/droid-factory all         → Queue all major audits
```

## Task Shortcuts

| Shortcut | Task Type | Droid |
|----------|-----------|-------|
| `ios` | appstore-blockers | release-ops |
| `security` | security-audit | security-privacy |
| `perf` | perf-audit | performance |
| `weather` | weather-check | weather-integrator |
| `ui` | ui-audit | ui-reviewer |
| `code` | pre-pr | code-reviewer |
| `physics` | physics-test | physics-validator |
| `all` | All of the above | Multiple |

## Adding Tasks to Queue

```json
// Add to .factory/prd.json taskQueue array
{
  "id": "TASK-001",
  "type": "security-audit",
  "description": "Full security and privacy audit",
  "priority": 1,
  "createdAt": "2024-01-13T10:00:00Z",
  "status": "pending"
}
```

## Running the Full Loop

For autonomous multi-iteration execution:

```bash
# Linux/Mac
./.factory/droid-factory.sh 20

# Windows PowerShell
.\.factory\droid-factory.ps1 -MaxIterations 20
```

This runs Claude in a loop until all tasks complete or max iterations reached.

## Completion

When task queue is empty and global checks pass, output:

<promise>COMPLETE</promise>

## Output Locations

- Task outputs: `.factory/reviews/TASK-XXX-[droid]-[date].md`
- Progress log: `.factory/progress.txt`
- State: `.factory/prd.json`

## Usage Examples

```
/droid-factory              # Interactive - show queue, prompt for tasks
/droid-factory ios          # Queue iOS submission check
/droid-factory security     # Queue security audit
/droid-factory all          # Queue all major audits
/droid-factory --status     # Show current queue status
```
