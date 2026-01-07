# Plan: Fix Dependencies and TypeScript Errors (January 7, 2026)

## Goal
Fix all TypeScript compilation errors with NO breaking changes. Make the build compile cleanly.

## Current State
- **~45 TypeScript errors** across the codebase
- Expo SDK 54, React 19.1.0, React Native 0.81.5
- Dependency duplication warning (non-blocking, Yarn resolves it)

---

## Phase 1: Add Missing Theme Tokens (HIGH PRIORITY)

### File: `src/theme/tokens.ts`

**1.1 Update `Tokens` interface colors (after line 87):**
```typescript
// Add these color properties:
onDanger: string;
onBrand: string;
offlineBackground: string;
offlineBorder: string;
offlineText: string;
ripple: string;
brandBackgroundAlpha: string;
dangerBackgroundAlpha: string;
successBackgroundAlpha: string;
successGlow: string;
```

**1.2 Update `Tokens` interface shadow (line 101-106):**
```typescript
shadow: {
  subtle: ShadowConfig;
  card: ShadowConfig;
  elevated: ShadowConfig;
  glow: ShadowConfig;
  glowSecondary: ShadowConfig;  // ADD
  dangerGlow: ShadowConfig;     // ADD
};
```

**1.3 Add to `darkTokens.colors` (after line 389):**
```typescript
onDanger: '#FFFFFF',
onBrand: '#FFFFFF',
offlineBackground: 'rgba(239, 68, 68, 0.15)',
offlineBorder: 'rgba(239, 68, 68, 0.3)',
offlineText: '#F87171',
ripple: 'rgba(255, 255, 255, 0.12)',
brandBackgroundAlpha: 'rgba(16, 185, 129, 0.15)',
dangerBackgroundAlpha: 'rgba(239, 68, 68, 0.15)',
successBackgroundAlpha: 'rgba(34, 197, 94, 0.15)',
successGlow: 'rgba(34, 197, 94, 0.5)',
```

**1.4 Add to `darkTokens.shadow` (after glow ~line 443):**
```typescript
glowSecondary: {
  shadowColor: boldColors.glowCyan,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 16,
  elevation: 8,
},
dangerGlow: {
  shadowColor: 'rgba(239, 68, 68, 0.5)',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 16,
  elevation: 8,
},
```

**1.5 Add to `lightTokens.colors` (after line 498):**
```typescript
onDanger: '#FFFFFF',
onBrand: '#FFFFFF',
offlineBackground: 'rgba(220, 38, 38, 0.1)',
offlineBorder: 'rgba(220, 38, 38, 0.2)',
offlineText: '#DC2626',
ripple: 'rgba(0, 0, 0, 0.08)',
brandBackgroundAlpha: 'rgba(5, 150, 105, 0.1)',
dangerBackgroundAlpha: 'rgba(220, 38, 38, 0.1)',
successBackgroundAlpha: 'rgba(22, 163, 74, 0.1)',
successGlow: 'rgba(22, 163, 74, 0.3)',
```

**1.6 Add to `lightTokens.shadow` (after glow ~line 552):**
```typescript
glowSecondary: {
  shadowColor: 'rgba(13, 148, 136, 0.4)',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 6,
},
dangerGlow: {
  shadowColor: 'rgba(220, 38, 38, 0.3)',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 6,
},
```

**1.7 Add convenience export at end of file:**
```typescript
export const tokens = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
};
```

---

## Phase 2: Fix PlayScreen Context Property

### File: `src/features/redesign/screens/PlayScreen.tsx`

**Find and replace ALL instances:**
- `environmental.current` -> `environmental.conditions`

Affected lines: 244, 245, 246, 269, 270, 277, 340, 341, 342, 343, 344, 398, 399

---

## Phase 3: Fix LogData Type

### File: `src/utils/LogManager.ts`

**Line 20 - Change:**
```typescript
// FROM:
type LogData = Record<string, unknown> | undefined;

// TO:
type LogData = Record<string, unknown> | Error | undefined;
```

This fixes 16+ locations passing Error objects to logger.

---

## Phase 4: Fix RevenueCat Issues

### File: `src/core/components/ui/CustomerCenter.tsx`

**Line 21 - Remove unused import:**
```typescript
// FROM:
import RevenueCatUI, { CUSTOMER_CENTER_MANAGEMENT_OPTION } from 'react-native-purchases-ui';

// TO:
import RevenueCatUI from 'react-native-purchases-ui';
```

### File: `src/core/components/ui/RevenueCatPaywall.tsx`

**Lines 65-67, 156-158, 197-200 - Remove offering param (uses default from dashboard):**

```typescript
// Line 65-67 change:
const paywallResult = await RevenueCatUI.presentPaywall();

// Line 156-158 change:
const paywallResult = await RevenueCatUI.presentPaywall();

// Line 197-200 change:
const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
  requiredEntitlementIdentifier: entitlementIdentifier,
});
```

---

## Phase 5: Fix ResultCard Shadow Style

### File: `src/components/redesign/ResultCard.tsx`

**Lines 104-117 - Fix conditional style returning false:**

```typescript
// FROM:
const cardStyles: ViewStyle[] = [
  styles.card,
  {
    backgroundColor: colors.surface,
    borderColor: isHighlighted ? colors.brand : colors.border,
    borderWidth: isHighlighted ? 2 : 1,
    padding: isCompact ? tokens.spacing.base : tokens.spacing.lg,
  },
  isHighlighted && {
    ...tokens.shadows.lg,
    shadowColor: colors.brand,
  },
  style,
];

// TO (spread into main style object):
const cardStyles: ViewStyle[] = [
  styles.card,
  {
    backgroundColor: colors.surface,
    borderColor: isHighlighted ? colors.brand : colors.border,
    borderWidth: isHighlighted ? 2 : 1,
    padding: isCompact ? tokens.spacing.base : tokens.spacing.lg,
    ...(isHighlighted && {
      ...tokens.shadows.lg,
      shadowColor: colors.brand,
    }),
  },
  style,
].filter(Boolean) as ViewStyle[];
```

---

## Verification

After all changes:
```bash
npx tsc --noEmit          # Should pass with 0 errors
npx expo lint             # Warnings OK, no errors
npx expo start            # Should start without issues
```

---

## Files to Modify (7 total)

1. `src/theme/tokens.ts` - Add missing tokens to interface + both token objects + convenience export
2. `src/features/redesign/screens/PlayScreen.tsx` - Replace `.current` with `.conditions`
3. `src/utils/LogManager.ts` - Expand LogData type
4. `src/core/components/ui/CustomerCenter.tsx` - Remove unused import
5. `src/core/components/ui/RevenueCatPaywall.tsx` - Remove offering param
6. `src/components/redesign/ResultCard.tsx` - Fix shadow conditional

---

## Risk Assessment

| Change | Risk | Breaking Change |
|--------|------|-----------------|
| Token additions | Low | None - additive |
| PlayScreen fix | Low | None - internal |
| LogData type | Low | None - more permissive |
| RevenueCat fixes | Low | None - unused import |
| ResultCard fix | Low | None - style only |

**All changes are non-breaking and backwards compatible.**
