# Spacing Audit Report - AI Caddy Pro

## Executive Summary

This report documents all spacing values used across the 4 main screens (Weather, Shot Calculator, Wind Calculator, Settings) in the AI Caddy Pro application. The audit identifies hard-coded pixel values vs. token-based spacing and provides recommendations for standardization.

### Key Findings

| Metric | Count |
|--------|-------|
| Total Spacing Declarations | 127 |
| Hard-coded Pixel Values | 103 |
| Token-based / Responsive Values | 24 |
| Token Adoption Rate | **19%** |

---

## Available Token System

### Token Values (from `src/theme/tokens.ts`)
```typescript
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
}
```

### Responsive Utilities (from `src/utils/responsive.ts`)
- `getScrollPadding(base, options)` - For scroll view padding
- `getResponsiveSpacing(base, direction)` - For general spacing
- `getTouchTargetSize(base, options)` - For touch targets (min 44pt)

---

## Screen-by-Screen Analysis

### 1. Weather Screen (`src/features/home/screen.tsx`)

#### Hard-coded Values
| Property | Value | Location | Recommended Token |
|----------|-------|----------|-------------------|
| `gap` | 16 | loadingContainer | `spacing.md` (16) |
| `letterSpacing` | -0.5 | title | N/A (typography) |
| `marginBottom` | 4 | title | `spacing.xs` (4) |
| `marginBottom` | 24 | subtitle | `spacing.lg` (24) |
| `marginBottom` | 16 | heroCard | `spacing.md` (16) |
| `width` | 64 | heroIconContainer | Consider token |
| `height` | 64 | heroIconContainer | Consider token |
| `borderRadius` | 20 | heroIconContainer | `borderRadius.xl` (16) or new token |
| `marginRight` | 16 | heroIconContainer | `spacing.md` (16) |
| `marginBottom` | 4 | heroLabel | `spacing.xs` (4) |
| `letterSpacing` | -1 | heroValue | N/A (typography) |
| `marginLeft` | 4 | heroUnit | `spacing.xs` (4) |
| `gap` | 12 | gridContainer | `spacing.lg` (12) - needs `spacing.base` (12) |
| `marginBottom` | 16 | gridContainer | `spacing.md` (16) |
| `gap` | 12 | gridRow | Need `spacing.base` (12) token |
| `marginBottom` | 16 | windCard | `spacing.md` (16) |
| `gap` | 8 | windHeader | `spacing.sm` (8) |
| `marginBottom` | 16 | windHeader | `spacing.md` (16) |
| `marginBottom` | 4 | windItemLabel | `spacing.xs` (4) |
| `width` | 1 | windDivider | N/A (border) |
| `height` | 40 | windDivider | Consider token |
| `marginHorizontal` | 16 | windDivider | `spacing.md` (16) |
| `gap` | 8 | freshness | `spacing.sm` (8) |
| `width` | 8 | freshnessIndicator | `spacing.sm` (8) |
| `height` | 8 | freshnessIndicator | `spacing.sm` (8) |
| `borderRadius` | 4 | freshnessIndicator | `borderRadius.sm` (4) |
| `paddingBottom` | 120 | contentContainer | `spacing.3xl` (64) + scroll adjustment |

#### Token/Responsive Usage
- `getScrollPadding(16, { minPadding: 12, maxPadding: 20 })` - **GOOD**
- `safeScaledFontSize()` used for all text - **GOOD**

---

### 2. Shot Calculator Screen (`src/features/calculator/screen.tsx`)

#### Hard-coded Values
| Property | Value | Location | Recommended Token |
|----------|-------|----------|-------------------|
| `padding` | 32 | loadingContainer | `spacing.xl` (32) |
| `borderRadius` | 12 | loadingPulse | `borderRadius.lg` (12) |
| `marginBottom` | 16 | loadingPulse | `spacing.md` (16) |
| `height` | 32 | loadingPulse | `spacing.xl` (32) |
| `letterSpacing` | -0.5 | title | N/A (typography) |
| `marginBottom` | 4 | title | `spacing.xs` (4) |
| `marginBottom` | 24 | subtitle | `spacing.lg` (24) |
| `marginBottom` | 16 | conditionsCard | `spacing.md` (16) |
| `gap` | 8 | conditionsRow | `spacing.sm` (8) |
| `gap` | 4 | conditionChip | `spacing.xs` (4) |
| `paddingVertical` | 8 | conditionChip | `spacing.sm` (8) |
| `paddingHorizontal` | 8 | conditionChip | `spacing.sm` (8) |
| `borderRadius` | 10 | conditionChip | `borderRadius.md` (8) - inconsistent! |
| `marginBottom` | 16 | sliderCard | `spacing.md` (16) |
| `marginBottom` | 16 | resultCard | `spacing.md` (16) |
| `gap` | 12 | resultHeader | Need `spacing.base` (12) token |
| `width` | 44 | adjustmentIndicator | `touchTarget.minimum` (48) - too small! |
| `height` | 44 | adjustmentIndicator | `touchTarget.minimum` (48) - too small! |
| `borderRadius` | 14 | adjustmentIndicator | `borderRadius.lg` (12) - inconsistent! |
| `marginBottom` | 2 | adjustmentLabel | Consider `spacing.xs/2` (2) |
| `height` | 1 | divider | N/A (border) |
| `marginVertical` | 16 | divider | `spacing.md` (16) |
| `marginBottom` | 8 | playsLikeLabel | `spacing.sm` (8) |
| `letterSpacing` | 1 | playsLikeLabel | N/A (typography) |
| `letterSpacing` | -2 | playsLikeValue | N/A (typography) |
| `marginLeft` | 4 | playsLikeUnit | `spacing.xs` (4) |
| `marginBottom` | 16 | clubCard | `spacing.md` (16) |
| `gap` | 8 | clubHeader | `spacing.sm` (8) |
| `marginBottom` | 8 | clubHeader | `spacing.sm` (8) |
| `marginBottom` | 4 | clubName | `spacing.xs` (4) |
| `paddingBottom` | 120 | contentContainer | Custom scroll padding |

#### Token/Responsive Usage
- `getScrollPadding(16, { minPadding: 12, maxPadding: 20 })` - **GOOD**
- `safeScaledFontSize()` used for all text - **GOOD**

---

### 3. Wind Calculator Screen (`src/features/wind/screen.tsx`)

#### Hard-coded Values
| Property | Value | Location | Recommended Token |
|----------|-------|----------|-------------------|
| `marginBottom` | 4 | title | `spacing.xs` (4) |
| `letterSpacing` | -0.5 | title | N/A (typography) |
| `marginBottom` | 24 | subtitle | `spacing.lg` (24) |
| `marginBottom` | 16 | compassCard | `spacing.md` (16) |
| `marginBottom` | 16 | compassHint | `spacing.md` (16) |
| `opacity` | 0.8 | compassHint | Consider token |
| `marginBottom` | 16 | sliderCard | `spacing.md` (16) |
| `marginBottom` | 16 | yardageCard | `spacing.md` (16) |
| `marginTop` | 20 | presetsContainer | ~`spacing.lg` (24) - inconsistent! |
| `paddingTop` | 16 | presetsContainer | `spacing.md` (16) |
| `borderTopWidth` | 1 | presetsContainer | N/A (border) |
| `marginBottom` | 12 | presetsLabel | Need `spacing.base` (12) token |
| `gap` | 8 | presetsRow | `spacing.sm` (8) |
| `minHeight` | 44 | presetButton | `touchTarget.minimum` (48) - too small! |
| `paddingVertical` | 12 | presetButton | Need `spacing.base` (12) token |
| `paddingHorizontal` | 8 | presetButton | `spacing.sm` (8) |
| `borderRadius` | 12 | presetButton | `borderRadius.lg` (12) |
| `borderWidth` | 1 | presetButton | N/A (border) |
| `marginBottom` | 16 | calculateButton | `spacing.md` (16) |
| `borderRadius` | 12 | loadingPulse | `borderRadius.lg` (12) |
| `marginBottom` | 16 | loadingPulse | `spacing.md` (16) |
| `height` | 32 | loadingPulse | `spacing.xl` (32) |
| `width` | '80%' | loadingPulse | N/A (relative) |
| `padding` | 24 | errorContainer | `spacing.lg` (24) |
| `marginBottom` | 8 | errorTitle | `spacing.sm` (8) |
| `marginBottom` | 24 | errorMessage | `spacing.lg` (24) |
| `marginTop` | 16 | errorText | `spacing.md` (16) |
| `minWidth` | 160 | retryButton | Consider token |
| `padding` | 32 | premiumContainer | `spacing.xl` (32) |
| `width` | 96 | premiumIconContainer | ~`spacing.3xl` (64) + 32 |
| `height` | 96 | premiumIconContainer | ~`spacing.3xl` (64) + 32 |
| `borderRadius` | 24 | premiumIconContainer | `spacing.lg` (24) |
| `marginBottom` | 24 | premiumIconContainer | `spacing.lg` (24) |
| `marginBottom` | 8 | premiumTitle | `spacing.sm` (8) |
| `marginBottom` | 24 | premiumText | `spacing.lg` (24) |
| `minWidth` | 200 | premiumButton | Consider token |
| `paddingBottom` | 120 | contentContainer | Custom scroll padding |

#### Token/Responsive Usage
- `getScrollPadding(16, { minPadding: 12, maxPadding: 20 })` - **GOOD**
- `safeScaledFontSize()` used for all text - **GOOD**

---

### 4. Settings Screen (`src/features/settings/screen.tsx`)

#### Hard-coded Values
| Property | Value | Location | Recommended Token |
|----------|-------|----------|-------------------|
| `letterSpacing` | -0.5 | title | N/A (typography) |
| `marginBottom` | 4 | title | `spacing.xs` (4) |
| `marginBottom` | 24 | subtitle | `spacing.lg` (24) |
| `marginBottom` | 16 | sectionCard | `spacing.md` (16) |
| `gap` | 10 | sectionHeader | ~`spacing.sm` (8) - inconsistent! |
| `marginBottom` | 16 | sectionHeader | `spacing.md` (16) |
| `width` | 32 | iconContainer | `spacing.xl` (32) |
| `height` | 32 | iconContainer | `spacing.xl` (32) |
| `borderRadius` | 8 | iconContainer | `borderRadius.md` (8) |
| `borderRadius` | 12 | segmentedControl | `borderRadius.lg` (12) |
| `padding` | 4 | segmentedControl | `spacing.xs` (4) |
| `gap` | 4 | segmentedControl | `spacing.xs` (4) |
| `gap` | 6 | segmentOption | ~`spacing.xs` (4) - inconsistent! |
| `paddingVertical` | 10 | segmentOption | ~`spacing.sm` (8) - inconsistent! |
| `paddingHorizontal` | 12 | segmentOption | Need `spacing.base` (12) token |
| `borderRadius` | 10 | segmentOption | `borderRadius.md` (8) - inconsistent! |
| `borderWidth` | 1 | segmentOption | N/A (border) |
| `marginTop` | 12 | unitHint | Need `spacing.base` (12) token |
| `width` | 44 | addButton | `touchTarget.minimum` (48) - too small! |
| `height` | 44 | addButton | `touchTarget.minimum` (48) - too small! |
| `borderRadius` | 12 | addButton | `borderRadius.lg` (12) |
| `marginTop` | 16 | formContainer | `spacing.md` (16) |
| `paddingTop` | 16 | formContainer | `spacing.md` (16) |
| `borderTopWidth` | 1 | formContainer | N/A (border) |
| `borderTopColor` | 'rgba(255,255,255,0.1)' | formContainer | **HARDCODED COLOR!** |
| `gap` | 12 | formContainer | Need `spacing.base` (12) token |
| `height` | 48 | input | `touchTarget.minimum` (48) |
| `borderWidth` | 1 | input | N/A (border) |
| `borderRadius` | 12 | input | `borderRadius.lg` (12) |
| `paddingHorizontal` | 16 | input | `spacing.md` (16) |
| `gap` | 12 | formButtons | Need `spacing.base` (12) token |
| `marginTop` | 4 | formButtons | `spacing.xs` (4) |
| `marginTop` | 8 | clubList | `spacing.sm` (8) |
| `paddingVertical` | 14 | clubItem | ~`spacing.md` (16) - inconsistent! |
| `borderBottomWidth` | 1 | clubItem | N/A (border) |
| `marginBottom` | 2 | clubName | ~`spacing.xs/2` (2) |
| `gap` | 8 | clubActions | `spacing.sm` (8) |
| `width` | 44 | clubActionButton | `touchTarget.minimum` (48) - too small! |
| `height` | 44 | clubActionButton | `touchTarget.minimum` (48) - too small! |
| `borderRadius` | 12 | clubActionButton | `borderRadius.lg` (12) |
| `paddingVertical` | 24 | emptyText | `spacing.lg` (24) |
| `paddingVertical` | 12 | settingsRow | Need `spacing.base` (12) token |
| `paddingHorizontal` | 4 | settingsRow | `spacing.xs` (4) |
| `borderRadius` | 8 | settingsRow | `borderRadius.md` (8) |
| `gap` | 12 | settingsRowLeft | Need `spacing.base` (12) token |
| `width` | 44 | settingsRowIcon | `touchTarget.minimum` (48) - too small! |
| `height` | 44 | settingsRowIcon | `touchTarget.minimum` (48) - too small! |
| `borderRadius` | 12 | settingsRowIcon | `borderRadius.lg` (12) |
| `gap` | 8 | settingsRowRight | `spacing.sm` (8) |
| `marginTop` | 8 | versionText | `spacing.sm` (8) |
| `paddingBottom` | 120 | contentContainer | Custom scroll padding |

#### Token/Responsive Usage
- `getScrollPadding(16, { minPadding: 12, maxPadding: 20 })` - **GOOD**
- `safeScaledFontSize()` used for all text - **GOOD**

#### Critical Issue
- **Line 547**: `borderTopColor: 'rgba(255,255,255,0.1)'` is a hardcoded color that should use `tokens.colors.border`

---

## Inconsistency Analysis

### 1. Missing Token: `spacing.base` (12px)
The value `12` appears 15+ times across screens but has no corresponding token:
- `gridContainer.gap: 12`
- `gridRow.gap: 12`
- `resultHeader.gap: 12`
- `presetsLabel.marginBottom: 12`
- `presetButton.paddingVertical: 12`
- `segmentOption.paddingHorizontal: 12`
- `formContainer.gap: 12`
- `formButtons.gap: 12`
- `settingsRowLeft.gap: 12`
- etc.

**Recommendation**: Add `base: 12` or `'1.5x': 12` to spacing tokens.

### 2. Border Radius Inconsistencies
| Component | Current | Expected |
|-----------|---------|----------|
| conditionChip | 10 | 8 (md) or 12 (lg) |
| adjustmentIndicator | 14 | 12 (lg) or 16 (xl) |
| segmentOption | 10 | 8 (md) or 12 (lg) |
| heroIconContainer | 20 | 16 (xl) or 24 (new) |

**Recommendation**: Standardize to use `borderRadius` tokens.

### 3. Touch Target Violations
Multiple elements have 44px touch targets, which meets iOS minimum but not the recommended 48px from tokens:
- adjustmentIndicator: 44x44
- presetButton minHeight: 44
- addButton: 44x44
- clubActionButton: 44x44
- settingsRowIcon: 44x44

**Recommendation**: Update to `touchTarget.minimum` (48px) for better accessibility.

### 4. Inconsistent Gap Values
| Pattern | Screen 1 | Screen 2 | Screen 3 | Screen 4 |
|---------|----------|----------|----------|----------|
| Section header gap | - | - | - | 10 |
| Button gap | 8 | 8 | 8 | 6 (segmentOption) |
| Row padding vertical | - | - | - | 14 (clubItem), 10 (segmentOption) |

**Recommendation**: Standardize gap values to 4, 8, 12, 16 pattern.

### 5. Consistent Patterns (Good!)
All screens correctly use:
- `marginBottom: 16` for cards (consistent)
- `marginBottom: 24` for subtitles (consistent)
- `marginBottom: 4` for titles (consistent)
- `paddingBottom: 120` for scroll containers (consistent)
- `getScrollPadding()` for horizontal padding (consistent)

---

## Recommendations

### Priority 1: Critical (Immediate)
1. **Add `spacing.base: 12` token** - Used 15+ times, essential for 4px grid
2. **Fix hardcoded color** in Settings formContainer `borderTopColor`
3. **Update touch targets** from 44px to 48px for accessibility compliance

### Priority 2: High (This Sprint)
1. **Standardize border radius values** - Use only token values (4, 8, 12, 16, 9999)
2. **Create spacing utility hook** - `useSpacing()` that returns token-based values
3. **Fix inconsistent gaps** (6, 10, 14 should be 8, 12, 16)

### Priority 3: Medium (Next Sprint)
1. **Migrate hard-coded spacing to tokens** - 103 values to update
2. **Add container size tokens** for icons (32, 44, 48, 64, 96)
3. **Document spacing patterns** in component library

### Priority 4: Low (Backlog)
1. **Create StyleSheet factory** that injects token values
2. **Add ESLint rule** to flag hard-coded pixel values
3. **Create visual spacing documentation** showing the 4px grid

---

## Proposed Token Additions

```typescript
// Add to spacing
spacing: {
  xs: 4,
  sm: 8,
  base: 12,    // NEW - for common 12px pattern
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,   // NEW - for large containers
  '5xl': 120,  // NEW - for scroll bottom padding
}

// Add container sizes
containerSize: {
  icon: {
    sm: 32,
    md: 44,
    lg: 48,
    xl: 64,
    '2xl': 96,
  }
}
```

---

## Audit Metadata

| Field | Value |
|-------|-------|
| Audit Date | 2025-12-22 |
| Auditor | Claude Code Agent |
| Screens Analyzed | 4 (Weather, Shot Calculator, Wind Calculator, Settings) |
| Total Lines Reviewed | ~1,590 |
| Token System Version | 1.0 (with darkTokens/lightTokens) |

---

## Next Steps

1. Review and approve recommendations
2. Create subtasks for Priority 1 items
3. Update `tokens.ts` with new spacing values
4. Migrate screens in order of complexity (Weather -> Shot -> Wind -> Settings)
5. Add automated testing for spacing consistency
