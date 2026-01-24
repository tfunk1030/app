# UI Fix Prompt Template

Copy this template when asking AI to fix UI issues. Fill in the brackets.

---

## Context Lock (Required First Step)

```
Before making any changes, acknowledge the following context:

## Current Implementation
File: [PATH_TO_FILE]
Relevant lines: [LINE_NUMBERS]

## Test File (Source of Truth)
File: [PATH_TO_TEST_FILE]
These tests define correct behavior. Do NOT modify tests.

## Specific Issue
[DESCRIBE EXACTLY WHAT'S WRONG]
Example: "The function returns 'X' but should return 'Y'"

## Expected Behavior
[BINARY CRITERIA - can be verified with test]
Example: "getWindArrowColor('TAILWIND') === '#16A34A'"

Tell me:
1. What do you see in the current implementation?
2. What specific change will fix the issue?
3. What side effects should we check?

DO NOT write code yet.
```

---

## Implementation Request (After Context Lock)

```
Now implement the fix you described.

Constraints:
- Only modify [SPECIFIC_FILE]
- Do not modify test files
- Do not refactor unrelated code
- Do not add new dependencies

Verification:
After implementing, run: [TEST_COMMAND]
Show me the test output.
```

---

## Visual Verification (After Tests Pass)

```
Tests pass. Now let's verify visually.

Use Playwright MCP to:
1. Navigate to the relevant screen
2. Capture accessibility snapshot
3. Take screenshot

Compare to expected visual:
- [DESCRIBE EXPECTED VISUAL]

If the visual doesn't match expectations despite passing tests,
investigate the component tree (prop drilling, imports, render path).
```

---

## Example: Wind Arrow Colors

### Context Lock
```
Before making changes, acknowledge:

## Current Implementation
File: src/features/wind/components/compass/WindArrow.tsx
Lines 45-60: getWindArrowColor function

## Tests
File: src/features/wind/utils/__tests__/wind-colors.test.ts

## Issue
TAILWIND case in WindArrow returns '#DAA520' instead of '#16A34A'

## Expected
getWindArrowColor('TAILWIND') === '#16A34A'

What do you see and how will you fix it?
```

### Implementation
```
Implement the fix. Only modify WindArrow.tsx or wind-colors.ts.
Run: npm test wind-colors
Show me the output.
```

### Visual
```
Tests pass. Use Playwright MCP to:
1. browser_navigate to Wind screen
2. browser_snapshot
3. browser_take_screenshot filename="wind-arrow-verify.png"

Expected: Wind arrow should be GREEN when wind is from behind (tailwind)
```
