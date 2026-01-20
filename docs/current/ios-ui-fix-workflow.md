# iOS UI Fix Workflow

**Created:** January 17, 2026
**Purpose:** Binary verification workflow for AI-assisted UI fixes on iOS

---

## The Problem

AI recognizes UI issues but fixes them incorrectly because:
1. Screenshots lack structured data - AI interprets pixels, not intent
2. No verification loop - AI can't see what it produced
3. Vague criteria - "make it professional" isn't verifiable

## The Solution

**Binary tests + Ralph Loop + Visual verification**

---

## Step 1: Define Binary Criteria

Before asking AI to fix anything, convert requirements to testable code.

### Example: Wind Arrow Colors

❌ **Vague:** "Wind arrow should be green for tailwind"

✅ **Binary:**
```typescript
test('TAILWIND returns green (#16A34A)', () => {
  expect(getWindArrowColor('TAILWIND')).toBe('#16A34A');
});
```

### Existing Tests

Tests are already created at:
```
src/features/wind/utils/__tests__/wind-colors.test.ts
```

Run them:
```bash
npm test wind-colors
```

---

## Step 2: Ralph Loop with Test Verification

Use Ralph Loop to iterate until tests pass:

```bash
/ralph-loop "Fix the wind arrow color implementation.

Requirements are defined in tests:
src/features/wind/utils/__tests__/wind-colors.test.ts

Implementation is in:
src/features/wind/utils/wind-colors.ts
src/features/wind/components/compass/WindArrow.tsx

Run: npm test wind-colors

Keep iterating until ALL tests pass." --completion-promise "TESTS_PASSING" --max-iterations 10
```

### Key Parameters

- `--completion-promise "TESTS_PASSING"` - Loop continues until you output this
- `--max-iterations 10` - Safety net to prevent infinite loops

---

## Step 3: Visual Verification with Playwright MCP

After tests pass, visually verify on the actual iOS app:

### 3a. Start the App

```bash
# In terminal 1: Start Expo
npx expo start --dev-client

# The app runs on iOS Simulator or device
```

### 3b. Capture Accessibility Snapshot

Use Playwright MCP (in Claude Code):

```
Use browser_navigate to go to the Wind screen URL
Then use browser_snapshot to get the accessibility tree
```

The snapshot shows semantic structure, not pixels - AI can understand "button A1" not "something in the middle".

### 3c. Capture Screenshot

```
Use browser_take_screenshot with filename "wind-screen-baseline.png"
```

### 3d. Visual Diff After Changes

After making changes:
1. Capture new screenshot
2. Compare visually
3. If different from expected, describe what's wrong specifically

---

## Step 4: Structured Fix Prompts

When asking AI to fix something, use this template:

### Context Lock Template

```
## Current State
File: src/features/wind/components/compass/WindArrow.tsx
Lines 45-60 contain getWindArrowColor()

## Tests (source of truth)
File: src/features/wind/utils/__tests__/wind-colors.test.ts
All tests in this file must pass.

## Specific Issue
[Describe exactly what's wrong, not "it looks bad"]
Example: "TAILWIND case returns '#DAA520' instead of '#16A34A'"

## Expected Behavior
[Binary criteria]
Example: "getWindArrowColor('TAILWIND') must return '#16A34A'"

## Constraints
- Do NOT modify tests (they are the spec)
- Do NOT add new dependencies
- Do NOT refactor unrelated code

## Verification
Run: npm test wind-colors
Success: All tests pass
```

---

## Remaining UI Tasks

### Task 1: Verify Wind Arrow Colors

**Status:** Implemented but possibly broken

**Test:** `npm test wind-colors`

**If failing:** Use the structured fix prompt above.

**If passing but visual doesn't match:**
1. WindArrow.tsx might not be using the utility functions
2. Props might not be passed correctly through the component tree

### Task 2: Wind Strength Intensity

**Existing tests:**
```typescript
test('5 mph = 0.5 opacity', () => {
  expect(getWindOpacity(5)).toBeCloseTo(0.5, 2);
});
```

**Verify in WindArrow.tsx that:**
- `magnitude` prop is being passed
- `getMagnitudeOpacity(magnitude)` is called
- Result is applied to arrow color

### Task 3: Gust Pulse Animation

**Existing tests:**
```typescript
test('gust > sustained = true', () => {
  expect(shouldShowGustPulse(20, 15)).toBe(true);
});
```

**Verify in WindArrow.tsx:**
- `gustSpeed` prop is passed from WindDirectionCompass
- Animation triggers when `gustActive` is true (line 152)
- `scaleAnim` pulses 1.0 → 1.15 → 1.0 (lines 157-171)

---

## Quick Verification Checklist

- [ ] `npm test wind-colors` passes
- [ ] WindArrow receives `windRelationship` prop
- [ ] WindArrow receives `magnitude` prop
- [ ] WindArrow receives `gustSpeed` prop
- [ ] Visual: Tailwind shows green arrow
- [ ] Visual: Headwind shows red arrow
- [ ] Visual: Crosswind shows yellow arrow
- [ ] Visual: Weak wind (5mph) shows pale color
- [ ] Visual: Strong wind (25mph) shows vivid color
- [ ] Visual: Gusts cause pulse animation

---

## Files Reference

| Purpose | Path |
|---------|------|
| Utility functions | `src/features/wind/utils/wind-colors.ts` |
| Tests | `src/features/wind/utils/__tests__/wind-colors.test.ts` |
| WindArrow component | `src/features/wind/components/compass/WindArrow.tsx` |
| Compass (parent) | `src/features/wind/components/compass/WindDirectionCompass.tsx` |
| Type definitions | `src/features/wind/components/compass/types.ts` |
| Design tokens | `src/theme/tokens.ts` |

---

---

## Visual Verification Tools (Installed)

### Playwright Visual Testing
Automated pixel-diff testing for Expo web:

```bash
# Run visual tests (requires app running)
yarn test:visual

# Update baseline screenshots
yarn test:visual:update

# Interactive test UI
yarn test:visual:ui
```

**Test file:** `e2e/visual.spec.ts`

**What it tests:**
- Wind screen baseline screenshot
- Compass component screenshot
- Accessibility tree structure
- Button label verification
- Touch target size verification (48x48dp minimum)

### Storybook for React Native
Component isolation and visual testing:

```bash
# Generate story index
yarn storybook-generate

# Start Storybook
yarn start
# Then access Storybook through the dev menu
```

**Story file:** `src/features/wind/components/compass/WindArrow.stories.tsx`

**Available stories:**
- Tailwind (Green) - `windRelationship: 'TAILWIND'`
- Headwind (Red) - `windRelationship: 'HEADWIND'`
- Crosswind (Yellow) - `windRelationship: 'CROSSWIND'`
- Quartering (Gold) - `windRelationship: 'QUARTERING'`
- Weak/Moderate/Strong/Max Wind (opacity testing)
- Gust Active (pulse animation)
- Reduced Motion (accessibility)
- All Directions comparison

### Playwright MCP (Real-time)
Use in Claude Code for real-time verification:

```
# Get structured accessibility tree
browser_snapshot

# Capture screenshot
browser_take_screenshot filename="wind-verify.png"

# Navigate to screen
browser_navigate to http://localhost:8081/(tabs-redesign)/(wind)
```

---

## When Tests Pass But Visual Doesn't

If `npm test wind-colors` passes but the visual is wrong:

1. **Check prop drilling:**
   - WindDirectionCompass → WindArrow
   - Is `windRelationship` being passed?
   - Is `magnitude` being passed?

2. **Check component import:**
   - WindArrow might be importing old local functions instead of utilities

3. **Check render path:**
   - Is the correct WindArrow component being rendered?

4. **Use Playwright MCP:**
   - Get accessibility snapshot
   - Look for the arrow element's color/style
