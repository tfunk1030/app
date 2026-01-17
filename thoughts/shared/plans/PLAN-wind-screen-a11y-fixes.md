# Plan: Wind Screen Accessibility & Token Fixes

## Goal
Fix accessibility issues and magic numbers identified in the RAMS design review of `src/features/wind/screen.tsx` to achieve App Store readiness (target: 95+/100 score).

## Technical Choices
- **Accessibility patterns**: Follow existing error state pattern (lines 154-195) which has excellent a11y
- **Token additions**: Add semantic tokens for minWidth values instead of arithmetic calculations
- **Line height**: Use token-based lineHeight value

## Current State Analysis

The RAMS review identified:
- **1 Critical**: Decorative icon missing accessibilityElementsHidden
- **3 Serious**: Missing accessibilityRole, accessibilityLabel on premium section
- **4 Moderate**: Magic numbers in fontSize, marginTop, minWidth, lineHeight

### Reference Pattern (Error State - lines 154-195):
```tsx
// GOOD: This pattern has all required a11y attributes
<Animated.View
  accessibilityRole="alert"
  accessibilityLabel="Unable to load weather conditions"
>
  <Wind accessibilityElementsHidden={true} />
  <Text style={styles.errorTitle}>...</Text>
  <Button
    accessibilityLabel="Retry loading weather conditions"
    accessibilityHint="Attempts to reload weather data"
  >...</Button>
</Animated.View>
```

### Key Files:
- `src/features/wind/screen.tsx` - Main file to fix
- `src/theme/tokens.ts` - Add semantic tokens for minWidth

## Tasks

### Task 1: Fix Critical - Crown Icon Accessibility
Add `accessibilityElementsHidden={true}` to decorative Crown icon.

- [ ] Add accessibilityElementsHidden to Crown icon (line 115)

**Files to modify:**
- `src/features/wind/screen.tsx`

**Code change:**
```tsx
// Line 115: Add accessibility attribute
<Crown
  size={t.containerSize.icon.lg}
  color={t.colors.brand}
  accessibilityElementsHidden={true}  // ADD THIS
/>
```

### Task 2: Fix Serious - Premium Section Accessibility
Match premium section accessibility to the error section pattern.

- [ ] Add accessibilityRole="header" to premium title (line 117)
- [ ] Add accessibilityLabel to premium button (line 123)
- [ ] Add accessibilityHint to premium button

**Files to modify:**
- `src/features/wind/screen.tsx`

**Code changes:**
```tsx
// Line 117-119: Add header role
<Text
  style={[styles.premiumTitle, { color: t.colors.textPrimary }]}
  accessibilityRole="header"  // ADD THIS
>
  Premium Feature
</Text>

// Lines 123-130: Add label and hint
<Button
  onPress={() => Alert.alert('Premium', ...)}
  variant="neon"
  size="lg"
  style={styles.premiumButton}
  accessibilityLabel="Upgrade to premium subscription"  // ADD THIS
  accessibilityHint="Opens premium subscription options"  // ADD THIS
>
  Upgrade to Premium
</Button>
```

### Task 3: Fix Moderate - Add Semantic Tokens
Add semantic tokens for button/container minimum widths to eliminate arithmetic.

- [ ] Add `containerSize.buttonMinWidth.default` token (~160px)
- [ ] Add `containerSize.buttonMinWidth.wide` token (~200px)
- [ ] Add `containerSize.errorContainer.maxWidth` token (~180px)
- [ ] Add `lineHeight.relaxed` token (22)

**Files to modify:**
- `src/theme/tokens.ts`

**Token additions:**
```typescript
export const containerSize = {
  // ... existing
  buttonMinWidth: {
    default: 160,  // Replaces spacing['4xl'] + spacing['3xl'] + spacing.xs
    wide: 200,     // Replaces spacing['4xl'] + spacing['3xl'] + spacing['2xl'] - spacing.sm
  },
  errorMaxWidth: 280,  // Replaces spacing['5xl'] * 1.5
};

export const lineHeight = {
  tight: 18,
  normal: 20,
  relaxed: 22,
  loose: 26,
};
```

### Task 4: Update Screen to Use New Tokens
Replace magic number calculations with semantic tokens.

- [ ] Replace retryButton minWidth calculation with token
- [ ] Replace premiumButton minWidth calculation with token
- [ ] Replace errorContainer maxWidth calculation with token
- [ ] Replace lineHeight: 22 with token

**Files to modify:**
- `src/features/wind/screen.tsx`

**Code changes:**
```tsx
// Line 555: Replace magic lineHeight
lineHeight: t.lineHeight.relaxed,  // was: 22

// Line 535: Replace maxWidth calculation
maxWidth: t.containerSize.errorMaxWidth,  // was: t.spacing['5xl'] * 1.5

// Line 562-563: Replace retryButton minWidth
minWidth: t.containerSize.buttonMinWidth.default,  // was: complex calculation

// Line 587: Replace premiumButton minWidth
minWidth: t.containerSize.buttonMinWidth.wide,  // was: complex calculation
```

### Task 5: Document Token Convention (Optional)
Add comment explaining the minWidth token naming.

- [ ] Add JSDoc to containerSize.buttonMinWidth explaining usage

## Success Criteria

### Automated Verification:
- [ ] Type check: `npx tsc --noEmit`
- [ ] Lint: `npx expo lint`
- [ ] Build: `npx expo export --platform ios --dev`

### Manual Verification:
- [ ] Enable VoiceOver on iOS Simulator, navigate Wind Screen
- [ ] Premium section announced with "Premium Feature, heading"
- [ ] Premium button reads "Upgrade to premium subscription, button"
- [ ] Crown icon NOT announced (hidden from a11y tree)
- [ ] Re-run RAMS review - target score 95+/100

## Out of Scope
- Refactoring title fontSize (t.fontSize['4xl'] - 4) - acceptable with comment
- Adding t.spacing['2.5xl'] = 20 - not needed often enough
- Compass fixed size (260px) - requires responsive design investigation

## Risks (Pre-Mortem)

### Tigers:
- **Token type compatibility** (MEDIUM)
  - Adding lineHeight to Tokens interface may require updates to useTokens
  - Mitigation: Check Tokens interface structure before adding

### Elephants:
- **Premium screen rarely used** (LOW)
  - Most users are premium, so this screen gets little real-world testing
  - Note: Still important for a11y compliance and App Store review
