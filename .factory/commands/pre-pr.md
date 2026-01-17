---
name: pre-pr
description: Run all checks before creating a pull request
---

Comprehensive pre-PR validation to ensure code is ready for review.

## Checklist

### 1. Lint Check
```bash
npx expo lint
```
- Must pass with zero errors
- Warnings should be reviewed

### 2. Type Check
```bash
npx tsc --noEmit
```
- Must pass with zero errors

### 3. Test Suite
```bash
npm test
```
- All tests must pass
- Note any skipped tests

### 4. Code Review
- Delegate changed files to `code-reviewer` droid
- Focus on: security, performance, best practices

### 5. UI Review (if applicable)
- Delegate to `ui-reviewer` droid for UI changes
- Check for design system compliance

### 6. Physics Validation (if applicable)
- Delegate to `physics-validator` droid for calculation changes
- Verify accuracy against reference values

## Output Format

```markdown
# Pre-PR Check Report

## Quick Summary
| Check | Status | Notes |
|-------|--------|-------|
| Lint | ✅/❌ | |
| Types | ✅/❌ | |
| Tests | ✅/❌ | X passed, Y failed |
| Code Review | ✅/⚠️/❌ | |
| UI Review | ✅/⚠️/❌ | |

## Detailed Findings

### Lint Issues
[List or "None"]

### Type Errors
[List or "None"]

### Test Failures
[List or "All passed"]

### Code Review
[Summary from code-reviewer droid]

### UI Review
[Summary from ui-reviewer droid]

## Recommended PR Title
[Generated title based on changes]

## Recommended PR Description
[Generated description including:
- What changed
- Why it changed
- How to test
- Screenshots needed (Y/N)
]

## Ready to Merge?
[YES / NO - with reasons if no]
```

## Usage
```
/pre-pr              # Full check
/pre-pr --quick      # Lint + types only
```
