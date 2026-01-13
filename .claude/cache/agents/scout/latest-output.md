# Codebase Report: AICaddyPro Design System Exploration
Generated: 2026-01-11

## Summary
AICaddyPro uses a **dual design system architecture** with a bold, colorful dark mode theme and outdoor-optimized redesign tokens. The codebase contains extensive UI components with accessibility features, gradient-based styling, and NativeWind integration. Two parallel theme systems exist: the main "Bold & Colorful" system and a newer "Redesign" system optimized for outdoor readability.

## Project Structure

```
aicaddypro/
├── app/                          # Expo Router screens
│   ├── (tabs-redesign)/          # New redesign navigation
│   │   ├── index.tsx             # Play screen
│   │   ├── setup.tsx             # Setup screen
│   │   ├── wind.tsx              # Wind calculator (Premium)
│   │   └── _layout.tsx           # Tab bar layout
│   ├── index.tsx                 # App entry
│   └── _layout.tsx               # Root layout
│
├── src/
│   ├── theme/                    # MAIN DESIGN SYSTEM
│   │   ├── tokens.ts             # Primary token system (Bold & Colorful)
│   │   ├── gradients.ts          # Gradient palette & presets
│   │   └── redesign/             # ALTERNATIVE DESIGN SYSTEM
│   │       └── tokens.ts         # Redesign tokens (Augusta/Caddy)
│   │
│   ├── core/components/ui/       # Core UI primitives (15 files)
│   ├── components/redesign/      # Redesign components (3 files)
│   └── features/                 # Feature modules
```

## Design System: Bold & Colorful (Main)

**Location:** `C:\Users\tfunk\aicaddypro\src\theme\tokens.ts`

### Color Palette

| Purpose | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Brand | #059669 (emerald-dark) | #10B981 (emerald) |
| Accent | #14B8A6 (teal) | #06B6D4 (cyan) |
| Background | #FAFAFA | #0F172A (slate-900) |
| Surface | #FFFFFF | #1E293B (slate-800) |
| Text Primary | #0F172A | #F8FAFC |

### Gradients (from gradients.ts)

**Button Gradients:**
- primary: Emerald → Teal
- premium: Violet → Purple  
- danger: Red gradient

**Hero Gradients:**
- hero.primary: Slate-900 → Slate-800 → Emerald-dark
- hero.wind: Slate-900 → Slate-800 → Cyan

**Glow Effects (Dark Mode):**
- glowEmerald: rgba(16, 185, 129, 0.6)
- glowCyan: rgba(6, 182, 212, 0.6)

### Spacing (8pt Grid)

xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px

### Typography

- xs: 12px | sm: 14px | base: 16px | lg: 18px | xl: 20px | 2xl: 24px | 3xl: 30px | 4xl: 36px
- Weights: normal(400), medium(500), semibold(600), bold(700), extrabold(800)

### Touch Targets

- minimum: 48px
- recommended: 56px (for glove use)

### Animation

- fast: 150ms | normal: 250ms | slow: 350ms
- spring: { damping: 15, stiffness: 150, mass: 1 }

---

## Design System: Redesign (Augusta Theme)

**Location:** `C:\Users\tfunk\aicaddypro\src\theme\redesign\tokens.ts`

**Philosophy:** Outdoor-optimized, Masters-inspired, minimalist for on-course use.

### Core Principles

1. Outdoor readability - High contrast, no subtle gradients
2. Glove-friendly - 56dp minimum touch targets
3. One-glance answers - Clear visual hierarchy
4. Progressive disclosure - Simple default, data available

### Color Palette

**Brand Colors:**
- primary: #006747 (Augusta Green)
- accent: #C4A962 (Championship Gold)
- tech: #06B6D4 (Cyan for data viz)

**Neutrals:**
- cream: #FDFBF7 (warmer than white)
- ink: #0A0A0A (dark mode)

### Theme Modes

1. light - Clean, warm, readable
2. dark - OLED-friendly
3. outdoor - Maximum contrast for sunlight

### Touch Targets (Larger for Outdoor)

- minimum: 44px
- standard: 56px
- large: 64px
- xlarge: 72px
- hero: 88px

---

## Component Catalog

### Core UI Components (`src/core/components/ui/`)

| Component | Variants | File |
|-----------|----------|------|
| Button | default, destructive, outline, secondary, ghost, link, primary, premium, neon | button.tsx |
| Card | gradient, non-gradient | card.tsx |
| BoldCard | default, highlighted, muted | BoldCard.tsx |
| Slider | dense, normal | slider.tsx |
| BoldTabBar | - | BoldTabBar.tsx |

**Button Features:**
- 9 variants with gradient support
- Haptic feedback
- Spring animations
- Glow effects (dark mode)
- Accessibility labels required

**Example:**
```typescript
<Button 
  variant="primary"
  glow
  accessibilityLabel="Calculate shot"
>
  Calculate
</Button>
```

### Redesign Components (`src/components/redesign/`)

| Component | Purpose |
|-----------|---------|
| ResultCard | Display calculation results with 3 variants |
| QuickAction | Quick action buttons with selected state |
| MetricPill | Compact metric display with status colors |

---

## Accessibility Patterns (Found Throughout)

### 1. Required Attributes

```typescript
accessibilityLabel="Button label"
accessibilityRole="button"
```

### 2. Touch Target Enforcement

```typescript
minHeight: getTouchTargetSize(48)
// Redesign uses 56dp minimum
```

### 3. Text Scaling

```typescript
adjustsFontSizeToFit
minimumFontScale={0.85}
numberOfLines={getOptimalNumberOfLines(1, { maxLines: 2 })}
```

### 4. Reduce Motion

```typescript
const reduceMotion = useReduceMotionValue();
scale.value = reduceMotion ? 0.97 : withSpring(0.97, springConfigs.stiff);
```

---

## Screen Files

### Redesign Tabs (`app/(tabs-redesign)/`)

| Screen | Route | Purpose |
|--------|-------|---------|
| index.tsx | /(tabs-redesign) | Play screen - Shot calculator |
| setup.tsx | /(tabs-redesign)/setup | Setup - Club library |
| wind.tsx | /(tabs-redesign)/wind | Wind calculator (Premium) |

**Wind Screen Features:**
- Compass heading lock
- Real-time wind data
- Target distance slider
- Quick presets (100, 125, 150, 175, 200 yds/m)
- Wind speed override
- Result breakdown (headwind, crosswind, total)

---

## Styling Approaches

### 1. Token-Based (Recommended)

```typescript
import { useTokens } from '@/src/theme/useTokens';

const t = useTokens();

<View style={{
  backgroundColor: t.colors.surface,
  padding: t.spacing.md,
  borderRadius: t.borderRadius.lg
}} />
```

### 2. Gradient-Based

```typescript
import { gradients } from '@/src/theme/gradients';

<LinearGradient
  colors={gradients.button.primary}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
/>
```

### 3. Responsive Utilities

```typescript
import { safeScaledFontSize, getTouchTargetSize } from '@/src/utils/responsive';

fontSize: safeScaledFontSize(16, { maxScale: 1.2 })
minHeight: getTouchTargetSize(48)
```

---

## Animation Patterns

### 1. Spring Animations (Button Press)

```typescript
const scale = useSharedValue(1);

const handlePressIn = () => {
  scale.value = withSpring(0.97, springConfigs.stiff);
};

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }]
}));
```

### 2. Entrance Animations

```typescript
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';

const { headerEntering, cardEntering } = useAccessibleAnimations();

<Animated.View entering={headerEntering}>
  <Text>Title</Text>
</Animated.View>
```

### 3. Haptic Feedback

```typescript
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

---

## Key Findings

### Strengths

1. **Dual Theme Architecture** - Main for bold aesthetics, redesign for outdoor
2. **Comprehensive Accessibility** - Touch targets, labels, reduce motion
3. **Token-First Design** - Centralized tokens prevent magic numbers
4. **Gradient System** - Organized semantic gradient presets
5. **Responsive Utilities** - Built-in scaling for devices
6. **Animation Standards** - Spring configs, haptics, reduce motion support

### Areas of Note

1. **Two Parallel Systems** - Both "Bold & Colorful" and "Redesign" exist
2. **NativeWind Underutilized** - Tailwind config exists but most use token hooks
3. **File Organization** - Components split across multiple directories

---

## File Reference

### Design Tokens
- Main: `src/theme/tokens.ts`
- Gradients: `src/theme/gradients.ts`
- Redesign: `src/theme/redesign/tokens.ts`

### Theme Providers
- Main: `src/theme/ThemeProvider.tsx`
- Redesign: `src/theme/redesign/RedesignThemeProvider.tsx`

### UI Components
- Core: `src/core/components/ui/` (15 files)
- Redesign: `src/components/redesign/` (3 files)

### Screens
- Tabs: `app/(tabs-redesign)/` (play, setup, wind)
- Features: `src/features/` (home, settings, calculator, wind)

### Utilities
- Responsive: `src/utils/responsive.ts`
- Accessibility: `src/hooks/useAccessibility.ts`

---

## Design System Comparison

| Aspect | Bold & Colorful | Redesign (Augusta) |
|--------|-----------------|-------------------|
| Primary Use | Indoor, app UI | Outdoor, on-course |
| Color Palette | Vibrant, saturated | High contrast, muted |
| Touch Targets | 48dp min | 56dp min (up to 88dp) |
| Typography | 16px body | 18px body (larger) |
| Gradients | Extensive (9 categories) | Minimal |
| Glow Effects | Yes (dark mode) | No |
| Theme Modes | light, dark | light, dark, outdoor |
| Philosophy | Linear-inspired, bold | Masters-inspired, minimalist |

---

**End of Report**
