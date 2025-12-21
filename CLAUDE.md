# AICaddy Pro - Claude Code Context

## Project Overview
AICaddy Pro is a React Native/Expo golf application that provides environmental shot adjustments, wind calculations, and club recommendations based on real-time weather data.

## Tech Stack
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State**: React Context (Settings, Theme, Premium, Clubs, ShotCalc)
- **Animations**: react-native-reanimated
- **Styling**: StyleSheet with design tokens
- **Navigation**: expo-router with tabs

## Architecture

### Directory Structure
```
src/
├── core/               # Shared core components and context
│   ├── components/ui/  # Design system components (GlassCard, MetricTile, Button, Slider)
│   ├── context/        # App-wide contexts (settings, theme, shotcalc)
│   └── models/         # Business logic (YardageModel)
├── features/           # Feature modules
│   ├── home/           # Weather conditions screen
│   ├── calculator/     # Shot calculator screen
│   ├── wind/           # Wind calculator screen (premium)
│   └── settings/       # Settings screen
├── hooks/              # Custom hooks (useAccessibility, useConnectivity)
├── providers/          # Provider components (EnhancedEnvironmentalProvider)
├── services/           # API and business services
├── theme/              # Design tokens and theme system
└── utils/              # Utilities (responsive, LogManager, caching)
```

### Key Patterns

#### Screen Template
All screens follow this pattern:
```tsx
const { headerEntering, cardEntering } = useAccessibleAnimations();
const tokens = useTokens();
const insets = useSafeAreaInsets();
const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

<ScrollView
  style={{ backgroundColor: tokens.colors.background }}
  contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: padding, paddingBottom: 120 }}
>
  <Animated.View entering={headerEntering}>...</Animated.View>
  <Animated.View entering={cardEntering(0)}>...</Animated.View>
</ScrollView>
```

#### Animation Accessibility
ALWAYS use `useAccessibleAnimations()` hook - NEVER raw Reanimated imports:
```tsx
// CORRECT
const { headerEntering, cardEntering } = useAccessibleAnimations();

// WRONG - bypasses reduced motion preferences
<Animated.View entering={FadeIn.duration(300)}>
```

#### Touch Targets
All interactive elements must be 44pt minimum:
```tsx
const buttonSize = getTouchTargetSize(44);
```

## Design System

### Theme Tokens (`src/theme/tokens.ts`)
- **Colors**: background, surface, surfaceAlt, textPrimary, textMuted, brand, brandAlt, success, danger
- **Spacing**: `tokens.spacing(n)` returns `n * 4`
- **Radius**: xs(4), sm(8), md(12), lg(16), xl(24)
- **Shadows**: card, subtle, glow, neon
- **Gradients**: primary, accent, surface

### Typography
Always use `safeScaledFontSize()` for responsive text:
```tsx
fontSize: safeScaledFontSize(32)  // Respects system font scale with clamping
```

### Consistent Spacing
- Header title: 32px, marginBottom: 4
- Subtitle: 15px, marginBottom: 24
- Card margins: 16px
- Grid gaps: 12px
- Bottom padding: 120px (for floating tab bar)

## Code Review Findings (2025-12-21)

### Overall Grade: B+ (7.8/10)

### Strengths
- Clean feature-based architecture
- Excellent design token system with light/dark mode
- Good accessibility foundations (useAccessibleAnimations, 44pt touch targets)
- Proper memoization (120 useMemo/useCallback occurrences)
- Comprehensive error handling with boundaries

### Issues to Address

#### Critical
1. **Replace `any` types** (30+ occurrences) - especially:
   - `throttlingStatus: any` in EnhancedEnvironmentalProvider
   - `data?: any` in LogManager
   - `any[]` in ThrottleManager

2. **Consolidate env files** - merge `src/env.ts` and `src/lib/env.ts`

#### High Priority
1. **Replace console.logs** (136 occurrences) with LogManager
2. **Add compass screen reader support** - critical for visually impaired golfers
3. **Add `accessibilityRole`** to all Pressable components

#### Medium Priority
1. Standardize spacing to use `tokens.spacing(n)`
2. Add focus management for modals
3. Complete NWS hourly forecast (TODO in hourly-forecast.ts)

### Recent Fixes Applied
- Touch targets increased to 44pt (settings, wind, slider)
- Condition chip font: 11px → 13px
- Theme-aware borders (removed hardcoded rgba)
- "Plays Like" visual hierarchy improved (56px, 800 weight)
- Accessibility labels added to condition chips

## File-Specific Notes

### `src/lib/api-keys.ts`
Remove `'use server'` directive - not applicable to React Native.

### `src/core/components/ui/slider.tsx`
Contains edge-clamping for tooltip positioning to prevent clipping.

### `src/services/enhanced-environmental-service.ts`
Singleton service with throttling. Uses Open-Meteo primary, NWS fallback.

### `src/core/models/YardageModel.ts`
Physics-based golf calculations with O1 model refinements. Constants include:
- WIND_POWER_SCALE: 0.230
- TAILWIND_AMPLIFIER: 1.235
- AIR_DENSITY_SEA_LEVEL: 1.193 kg/m³

## Commands
```bash
# Development
npx expo start

# Type check
npx tsc --noEmit

# Build
eas build --platform ios
eas build --platform android
```

## Testing Checklist
- [ ] All touch targets ≥ 44pt
- [ ] Animations respect reduced motion
- [ ] Dark/light mode switching
- [ ] Offline fallback with cached data
- [ ] Screen reader navigation
