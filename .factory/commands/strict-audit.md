---
name: strict-audit
description: Run strict audits with PYYW validation for spacing, dead-code, workflow, or appstore
---

# Strict Audit Command

Run comprehensive audits with mandatory PYYW (Prove Yourself Wrong) validation on every finding.

## Usage

```
/strict-audit spacing     # Spacing token violations with PYYW
/strict-audit dead-code   # Unused code with PYYW
/strict-audit workflow    # User flow validation with PYYW
/strict-audit appstore    # App Store readiness with PYYW
/strict-audit all         # Run all audits
```

## Workflow

### 1. Get Current Context (ALWAYS FIRST)
```bash
echo "Strict Audit: $(date -Iseconds)"
echo "Type: $AUDIT_TYPE"
```

### 2. Select Appropriate Droid

| Type | Droid | Focus |
|------|-------|-------|
| spacing | spacing-auditor | 4/8px grid violations |
| dead-code | dead-code-hunter | Unused exports/files |
| workflow | workflow-auditor | User flow documentation |
| appstore | appstore-validator | P0 submission blockers |

### 3. Execute Audit with PYYW

Each finding MUST go through PYYW:
1. Generate 3+ attack vectors
2. Run verification for each
3. Only report if ALL attacks fail

### 4. Output Report

Save to `.factory/reviews/STRICT-[type]-[date].md`

## Audit Details

### spacing
```bash
# Delegate to spacing-auditor
# Checks: padding, margin, gap values
# Valid: 4, 8, 12, 16, 24, 32, 48, 64, 96
# PYYW attacks: intent, platform, responsive, animation, a11y
```

### dead-code
```bash
# Delegate to dead-code-hunter
# Uses: knip for detection
# PYYW attacks: dynamic import, tests, barrel, WIP, config, types
```

### workflow
```bash
# Delegate to workflow-auditor
# Documents: entry/exit points, conditionals, platform differences
# PYYW attacks: code read, conditionals, state, guards, platforms
```

### appstore
```bash
# Delegate to appstore-validator
# Checks: icon, URLs, metadata, bundle ID
# PYYW attacks: live URL, guidelines, asset specs, consistency, privacy
```

## Output Format

```markdown
# Strict Audit Report: [Type]

**Timestamp:** $(date -Iseconds)
**Droid:** [droid-name]

## Summary
- Findings scanned: [X]
- PYYW validated: [X]
- Confirmed issues: [X]
- Rejected by PYYW: [X]

## Confirmed Issues

### Issue 1: [Description]
**Location:** [file:line]
**PYYW Status:** APPROVED ✅
**Attacks:** 3/3 failed

[Details...]

## Rejected Findings (PYYW Saved Us)

### Finding 1: [Description]
**Attack succeeded:** [which attack]
**Reason:** [why it's not an issue]

## Recommendations
1. [Action item]
2. [Action item]
```

## Quick Mode

For faster audits (minimum PYYW):
```
/strict-audit spacing --quick
```

Runs only 3 most critical attacks instead of all 5-6.

## Full Mode (Default)

Runs ALL attacks for thorough validation:
```
/strict-audit spacing --full
```

## Integration

Results are:
1. Saved to `.factory/reviews/`
2. Logged to `.factory/progress.txt`
3. Tasks created for confirmed issues

## Rules

1. **EVERY finding gets PYYW** - No exceptions
2. **REJECTED findings are logged** - Shows PYYW value
3. **TIMESTAMPS are dynamic** - `$(date -Iseconds)`
4. **RESOURCES are version-checked** - `git log -1`
