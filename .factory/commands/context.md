---
name: context
description: Get current context - dynamic date, resource versions, and file freshness checks
---

# Context - Dynamic Environment Information

Display current date/time and resource versions. NEVER hardcode dates - this command proves currency.

## Usage

```
/context                    # Full context dump
/context date               # Just current date/time
/context check [file]       # Check specific file freshness
/context resources          # All key resource versions
```

## Workflow

### Basic Context
```bash
echo "================================"
echo "CONTEXT - $(date +%Y-%m-%d)"
echo "================================"
echo ""
echo "Current timestamp: $(date -Iseconds)"
echo "Timezone: $(date +%Z)"
echo "Unix epoch: $(date +%s)"
```

### Resource Versions
```bash
echo ""
echo "=== Key Resource Versions ==="
for file in \
  src/theme/tokens.ts \
  src/theme/redesign/tokens.ts \
  app.json \
  eas.json \
  package.json \
  .factory/prd.json; do
  if [ -f "$file" ]; then
    echo "$file: $(git log -1 --format='%ci | %s' -- $file 2>/dev/null || echo 'untracked')"
  fi
done
```

### File Freshness Check
```bash
# For /context check [file]
FILE="$1"
echo "=== File Freshness: $FILE ==="
echo "Last modified: $(git log -1 --format='%ci' -- $FILE)"
echo "Last author: $(git log -1 --format='%an' -- $FILE)"
echo "Last commit: $(git log -1 --format='%s' -- $FILE)"
echo "Days since change: $(( ($(date +%s) - $(git log -1 --format='%ct' -- $FILE)) / 86400 ))"
```

## Output Format

```markdown
# Context Report

**Generated:** [$(date -Iseconds)]

## Current Time
- **Date:** [YYYY-MM-DD]
- **Time:** [HH:MM:SS]
- **Timezone:** [TZ]
- **Unix Epoch:** [timestamp]

## Resource Versions
| File | Last Modified | Author | Commit |
|------|---------------|--------|--------|
| tokens.ts | YYYY-MM-DD | name | message |
| app.json | YYYY-MM-DD | name | message |
| ... | ... | ... | ... |

## Working State
- **Branch:** [current branch]
- **Clean:** [yes/no]
- **Uncommitted files:** [count]
```

## Integration with PYYW

Every PYYW validation MUST start with:
```bash
/context date
```

And include in logs:
```markdown
**Validation Context:**
- Timestamp: [/context date output]
- Resources checked: [list with versions]
```

## Examples

### Full Context
```
/context

Output:
================================
CONTEXT - 2026-01-14
================================

Current timestamp: 2026-01-14T10:30:00-06:00
Timezone: CST
Unix epoch: 1768425000

=== Key Resource Versions ===
src/theme/tokens.ts: 2026-01-13 17:03:00 -0600 | refactor: update spacing tokens
app.json: 2026-01-14 09:00:00 -0600 | bump version to 1.2.0
...
```

### Check Specific File
```
/context check src/features/home/screen.tsx

Output:
=== File Freshness: src/features/home/screen.tsx ===
Last modified: 2026-01-10 14:30:00 -0600
Last author: developer
Last commit: fix: resolve accessibility issues
Days since change: 4
```

## Rules

1. **NEVER return hardcoded dates** - Always execute `date` command
2. **ALWAYS use git for file dates** - Not filesystem mtime
3. **INCLUDE timezone** - Ambiguous timestamps are useless
4. **SHOW days since change** - Helps identify stale resources

## Why This Matters

1. **Proves currency** - Logs show when validation actually happened
2. **Detects stale data** - Old resources may have outdated info
3. **Audit trail** - Can verify when decisions were made
4. **Reproducibility** - Context helps debug false conclusions
