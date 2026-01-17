# Droid Implementation Plan: AICaddyPro App Store Readiness
Generated: 2026-01-11 | Based on: crazyplan.md (refined)

## Overview

This is a **corrected and verified** implementation plan for AICaddyPro accessibility and UX improvements. All dependencies have been verified against the actual codebase.

---

## Verified Dependencies

| Component | File | Verified API |
|-----------|------|--------------|
| `FeatureFlags` | `src/utils/FeatureFlags.ts` | `isEnabled()`, static getters pattern |
| `errorNotificationService` | `src/services/notification/error-notification.ts` | `showToast({ message, type, duration })` |
| `useAccessibleAnimations` | `src/hooks/useAccessibility.ts` | `{ headerEntering, cardEntering(index), prefersReducedMotion }` |
| `useSensorData` | `src/features/wind/context/sensor-data.tsx` | `{ heading, accuracy, isAvailable }` |
| `SkeletonScreen` | `src/core/components/ui/Skeleton.tsx` | `<SkeletonScreen showHero={bool} cardCount={num} />` |
| `useReduceMotionValue` | `src/hooks/useReduceMotion.ts` | Already in Button.tsx |

---

## Phase 1: App Store Ready (7-10 hours)

### 1.0 Feature Flag Setup (15 min)

**File:** `src/utils/FeatureFlags.ts`

**Pre-flight:**
```powershell
# Verify file exists
Test-Path src/utils/FeatureFlags.ts
```

**Changes:**

1. Add to `featureConfigurations` object:
```typescript
PHASE1_ACCESSIBILITY_ENHANCEMENTS: {
  development: true,
  production: false,
  description: 'Phase 1 accessibility and loading state improvements',
  remoteOverrideEnabled: true,
},
```

2. Add static getter:
```typescript
static get PHASE1_ACCESSIBILITY_ENHANCEMENTS(): boolean {
  return FeatureFlags.isEnabled('PHASE1_ACCESSIBILITY_ENHANCEMENTS');
}
```

**Verification:**
```powershell
npx tsc --noEmit src/utils/FeatureFlags.ts
```

---

### 1.1 Button Accessibility Props (20 min)

**File:** `src/core/components/ui/button.tsx`

**Pre-flight:**
```powershell
# Check current state - should NOT have accessibilityLabel in interface
Select-String -Path "src/core/components/ui/button.tsx" -Pattern "accessibilityLabel\?"
```

**Changes:**

1. **Update ButtonProps interface** (find `export interface ButtonProps`):
```typescript
export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  title?: string;
  glow?: boolean;
  /** Accessibility label for screen readers - defaults to title if not provided */
  accessibilityLabel?: string;
  /** Accessibility role - defaults to 'button' */
  accessibilityRole?: 'button' | 'link' | 'none';
}
```

2. **Destructure new props** in Button function:
```typescript
const Button = ({
  variant = 'default',
  size = 'default',
  children,
  title,
  style,
  textStyle,
  glow = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  ...props
}: ButtonProps) => {
```

3. **Compute effective label** (after `const buttonText = title || children;`):
```typescript
const effectiveAccessibilityLabel = accessibilityLabel ?? 
  (typeof buttonText === 'string' ? buttonText : undefined);
```

4. **Add to all AnimatedPressable instances** (3 total - neon, gradient, non-gradient):
```typescript
accessibilityLabel={effectiveAccessibilityLabel}
accessibilityRole={accessibilityRole}
```

**Verification:**
```powershell
npx tsc --noEmit src/core/components/ui/button.tsx
# Count AnimatedPressable with a11y props (should be 3)
Select-String -Path "src/core/components/ui/button.tsx" -Pattern "accessibilityLabel=\{effective" | Measure-Object
```

---

### 1.2 Screen-Level Accessibility (1 hour)

**Files:**
- `app/(tabs-redesign)/setup.tsx`
- `src/components/PresetSelector.tsx`

#### 1.2.1 setup.tsx - Unit Selector

**Find pattern:** `<Pressable` followed by `handleUnitChange('imperial')`

**Add these props to Imperial Pressable:**
```typescript
accessibilityLabel="Imperial units: Yards, Fahrenheit, mph"
accessibilityRole="button"
accessibilityState={{ selected: !isMetric }}
```

**Add these props to Metric Pressable:**
```typescript
accessibilityLabel="Metric units: Meters, Celsius, km/h"
accessibilityRole="button"
accessibilityState={{ selected: isMetric }}
```

#### 1.2.2 PresetSelector.tsx - All Pressables

**Pattern 1:** `<Pressable` with `onLoad(preset)`
```typescript
accessibilityLabel={`Load preset: ${preset.name}`}
accessibilityRole="button"
accessibilityState={{ selected: isSelected }}
```

**Pattern 2:** Delete button (`onDelete(preset)`)
```typescript
accessibilityLabel={`Delete preset: ${preset.name}`}
accessibilityRole="button"
```

**Pattern 3:** Modal close (`handleClose`)
```typescript
accessibilityLabel="Close save preset dialog"
accessibilityRole="button"
```

**Pattern 4:** Expand button (`toggleExpanded`)
```typescript
accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} saved presets`}
accessibilityRole="button"
accessibilityState={{ expanded: isExpanded }}
```

**Verification:**
```powershell
# Count Pressables vs accessibilityLabel in each file
Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "<Pressable" | Measure-Object
Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "accessibilityLabel=" | Measure-Object
npx tsc --noEmit "app/(tabs-redesign)/setup.tsx" "src/components/PresetSelector.tsx"
```

---

### 1.3 Touch Target Compliance (10 min)

**File:** `app/(tabs-redesign)/setup.tsx`

**Find pattern:** `clubAction:` in StyleSheet.create

**Change:**
```typescript
clubAction: {
  width: 48,  // was 36
  height: 48, // was 36
  borderRadius: 12, // was 8
  alignItems: 'center',
  justifyContent: 'center',
},
```

**Verification:**
```powershell
Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "width: 48" -Context 0,1
```

---

### 1.4 Input Height Compliance (10 min)

**File:** `src/core/components/ui/Input.tsx`

**Find pattern:** `height: 48` in styles

**Change to:** `height: 56`

**Verification:**
```powershell
Select-String -Path "src/core/components/ui/Input.tsx" -Pattern "height: 56"
npx tsc --noEmit src/core/components/ui/Input.tsx
```

---

### 1.5 Loading States - Shot Tab (30 min)

**File:** `app/(tabs-redesign)/index.tsx`

**Step 1: Add imports** (after existing imports):
```typescript
import { SkeletonScreen } from '@/src/core/components/ui/Skeleton';
import { FeatureFlags } from '@/src/utils/FeatureFlags';
```

**Step 2: Add loading detection** (inside ShotScreen, after hooks):
```typescript
const isInitialLoading = FeatureFlags.PHASE1_ACCESSIBILITY_ENHANCEMENTS &&
  !environmental.conditions &&
  !environmental.error;
```

**Step 3: Add early return** (before main return):
```typescript
if (isInitialLoading) {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.scrollContent}>
        <SkeletonScreen showHero={false} cardCount={1} />
      </View>
    </SafeAreaView>
  );
}
```

**Verification:**
```powershell
Select-String -Path "app/(tabs-redesign)/index.tsx" -Pattern "SkeletonScreen"
Select-String -Path "app/(tabs-redesign)/index.tsx" -Pattern "isInitialLoading"
npx tsc --noEmit "app/(tabs-redesign)/index.tsx"
```

---

### 1.6 Loading States - Wind Tab (30 min)

**File:** `app/(tabs-redesign)/wind.tsx`

**Step 1: Add imports:**
```typescript
import { ActivityIndicator } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { FeatureFlags } from '@/src/utils/FeatureFlags';
```

**Step 2: Get sensor availability** (update WindCalculatorWithCompass):
```typescript
function WindCalculatorWithCompass() {
  const environmental = useEnhancedEnvironmental();
  const { heading, isAvailable: sensorAvailable } = useSensorData();

  return (
    <CompassLockProvider
      currentHeading={heading || 0}
      windDirection={environmental.conditions?.windDirection || 0}
    >
      <WindCalculatorRedesign sensorAvailable={sensorAvailable} />
    </CompassLockProvider>
  );
}
```

**Step 3: Update WindCalculatorRedesign signature:**
```typescript
function WindCalculatorRedesign({ sensorAvailable = true }: { sensorAvailable?: boolean }) {
```

**Step 4: Add sensor warning UI** (after compass section):
```typescript
{FeatureFlags.PHASE1_ACCESSIBILITY_ENHANCEMENTS && !sensorAvailable && (
  <View style={styles.sensorWarning}>
    <AlertTriangle size={16} color={colors.warning} />
    <Text style={[styles.warningText, { color: colors.warning }]}>
      Compass unavailable
    </Text>
  </View>
)}
```

**Step 5: Add styles:**
```typescript
sensorWarning: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 8,
  paddingHorizontal: 12,
  backgroundColor: 'rgba(245, 158, 11, 0.1)',
  borderRadius: 8,
  gap: 6,
  marginBottom: 8,
},
warningText: {
  fontSize: 13,
  fontWeight: '500',
},
```

**Verification:**
```powershell
Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "sensorAvailable"
npx tsc --noEmit "app/(tabs-redesign)/wind.tsx"
```

---

### 1.7 ErrorBanner Component (45 min)

**New File:** `src/core/components/ui/ErrorBanner.tsx`

```typescript
/**
 * ErrorBanner - Dismissible error/warning banner
 */

import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useTokens } from '@/src/theme/useTokens';
import { AlertCircle, AlertTriangle, Info, X, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOutUp } from 'react-native-reanimated';

export type ErrorBannerVariant = 'error' | 'warning' | 'info';

export interface ErrorBannerProps {
  message: string;
  variant?: ErrorBannerVariant;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoDismissMs?: number;
  visible?: boolean;
}

const variantConfig = {
  error: { icon: AlertCircle, bgOpacity: 0.12 },
  warning: { icon: AlertTriangle, bgOpacity: 0.1 },
  info: { icon: Info, bgOpacity: 0.08 },
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  variant = 'error',
  onRetry,
  onDismiss,
  autoDismissMs = 0,
  visible = true,
}) => {
  const tokens = useTokens();
  const { cardEntering } = useAccessibleAnimations();
  const [isVisible, setIsVisible] = useState(visible);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const color = variant === 'error'
    ? tokens.colors.danger
    : variant === 'warning'
      ? tokens.colors.warning
      : tokens.colors.brand;

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (autoDismissMs > 0 && isVisible) {
      const timer = setTimeout(() => handleDismiss(), autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      entering={cardEntering(0)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: `${color}${Math.round(config.bgOpacity * 255).toString(16).padStart(2, '0')}`,
          borderColor: color,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon size={18} color={color} />
      <Text style={[styles.message, { color: tokens.colors.textPrimary }]} numberOfLines={2}>
        {message}
      </Text>
      <View style={styles.actions}>
        {onRetry && (
          <Pressable
            onPress={onRetry}
            style={[styles.actionButton, { backgroundColor: `${color}20` }]}
            accessibilityLabel="Retry"
            accessibilityRole="button"
          >
            <RefreshCw size={14} color={color} />
          </Pressable>
        )}
        {onDismiss && (
          <Pressable
            onPress={handleDismiss}
            style={styles.dismissButton}
            accessibilityLabel="Dismiss"
            accessibilityRole="button"
          >
            <X size={16} color={tokens.colors.textMuted} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 10,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  dismissButton: {
    padding: 4,
  },
});

export default ErrorBanner;
```

**Verification:**
```powershell
npx tsc --noEmit src/core/components/ui/ErrorBanner.tsx
```

---

### 1.8 AsyncStorage Error Handling (30 min)

**File:** `src/core/context/settings.tsx`

**Step 1: Add import:**
```typescript
import { errorNotificationService } from '@/src/services/notification/error-notification';
```

**Step 2: Find pattern** `catch (error)` with `AsyncStorage`

**Step 3: Add notification after console.error:**
```typescript
} catch (error) {
  console.error('Failed to save settings to AsyncStorage:', error);
  errorNotificationService.showToast({
    message: 'Could not save settings. Changes may not persist.',
    type: 'warning',
    duration: 4000,
  });
}
```

**Verification:**
```powershell
Select-String -Path "src/core/context/settings.tsx" -Pattern "errorNotificationService"
npx tsc --noEmit src/core/context/settings.tsx
```

---

### 1.9 reduceMotion Audit (2 hours)

**Files:**
- `app/(tabs-redesign)/index.tsx`
- `app/(tabs-redesign)/wind.tsx`
- `app/(tabs-redesign)/setup.tsx`

**Pattern to find:** `entering={FadeIn` or `entering={FadeInDown`

**Step 1: Add import to each file:**
```typescript
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
```

**Step 2: Add hook inside main component:**
```typescript
const { headerEntering, cardEntering } = useAccessibleAnimations();
```

**Step 3: Replace animations:**

| Find | Replace With |
|------|--------------|
| `entering={FadeIn}` | `entering={headerEntering}` |
| `entering={FadeIn.delay(N)}` | `entering={headerEntering}` |
| `entering={FadeInDown}` | `entering={cardEntering(0)}` |
| `entering={FadeInDown.delay(100)}` | `entering={cardEntering(1)}` |
| `entering={FadeInDown.delay(200)}` | `entering={cardEntering(2)}` |
| `entering={FadeInDown.delay(N)}` | `entering={cardEntering(N/100)}` |

**Verification:**
```powershell
# Should return 0 matches after fix
Select-String -Path "app/(tabs-redesign)/*.tsx" -Pattern "entering=\{FadeIn" | Measure-Object
Select-String -Path "app/(tabs-redesign)/*.tsx" -Pattern "entering=\{FadeInDown" | Measure-Object

# Should find useAccessibleAnimations in all 3 files
Select-String -Path "app/(tabs-redesign)/*.tsx" -Pattern "useAccessibleAnimations"

npx tsc --noEmit "app/(tabs-redesign)/index.tsx" "app/(tabs-redesign)/wind.tsx" "app/(tabs-redesign)/setup.tsx"
```

---

## Phase 1 Verification Script

```powershell
# Save as: scripts/verify-phase1.ps1

Write-Host "=== Phase 1 Verification ===" -ForegroundColor Cyan

# 1. Feature Flag
$flag = Select-String -Path "src/utils/FeatureFlags.ts" -Pattern "PHASE1_ACCESSIBILITY"
if ($flag) { Write-Host "[PASS] Feature flag exists" -ForegroundColor Green }
else { Write-Host "[FAIL] Feature flag missing" -ForegroundColor Red }

# 2. Button a11y
$btnA11y = Select-String -Path "src/core/components/ui/button.tsx" -Pattern "accessibilityLabel=\{effective"
if ($btnA11y.Count -ge 3) { Write-Host "[PASS] Button a11y ($($btnA11y.Count) instances)" -ForegroundColor Green }
else { Write-Host "[FAIL] Button a11y incomplete" -ForegroundColor Red }

# 3. Touch targets
$touch = Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "width: 48"
if ($touch) { Write-Host "[PASS] Touch targets 48dp" -ForegroundColor Green }
else { Write-Host "[FAIL] Touch targets not updated" -ForegroundColor Red }

# 4. Input height
$input = Select-String -Path "src/core/components/ui/Input.tsx" -Pattern "height: 56"
if ($input) { Write-Host "[PASS] Input height 56dp" -ForegroundColor Green }
else { Write-Host "[FAIL] Input height not updated" -ForegroundColor Red }

# 5. Skeleton loading
$skeleton = Select-String -Path "app/(tabs-redesign)/index.tsx" -Pattern "SkeletonScreen"
if ($skeleton) { Write-Host "[PASS] Skeleton loading added" -ForegroundColor Green }
else { Write-Host "[FAIL] Skeleton loading missing" -ForegroundColor Red }

# 6. ErrorBanner
if (Test-Path "src/core/components/ui/ErrorBanner.tsx") { Write-Host "[PASS] ErrorBanner exists" -ForegroundColor Green }
else { Write-Host "[FAIL] ErrorBanner missing" -ForegroundColor Red }

# 7. AsyncStorage errors
$storageErr = Select-String -Path "src/core/context/settings.tsx" -Pattern "errorNotificationService"
if ($storageErr) { Write-Host "[PASS] Storage error handling" -ForegroundColor Green }
else { Write-Host "[FAIL] Storage error handling missing" -ForegroundColor Red }

# 8. reduceMotion
$rawFade = Select-String -Path "app/(tabs-redesign)/*.tsx" -Pattern "entering=\{FadeInDown\.delay"
if ($rawFade.Count -eq 0) { Write-Host "[PASS] reduceMotion compliant" -ForegroundColor Green }
else { Write-Host "[WARN] $($rawFade.Count) raw FadeInDown usages remain" -ForegroundColor Yellow }

# TypeScript check
Write-Host "`nRunning TypeScript check..." -ForegroundColor Cyan
npx tsc --noEmit
if ($LASTEXITCODE -eq 0) { Write-Host "[PASS] TypeScript compilation" -ForegroundColor Green }
else { Write-Host "[FAIL] TypeScript errors" -ForegroundColor Red }

Write-Host "`n=== End Verification ===" -ForegroundColor Cyan
```

---

## Phase 2: Enhanced Experience (5-7 hours)

### 2.0 Settings Context Extensions (15 min)

**File:** `src/core/context/settings.tsx`

**Add to Settings interface:**
```typescript
sunlightModeEnabled: boolean;
windSpeedUnit: 'mph' | 'kph' | 'kts' | 'mps';
```

**Add to defaultSettings:**
```typescript
sunlightModeEnabled: false,
windSpeedUnit: 'mph',
```

---

### 2.1 Hidden Settings UI (1 hour)

**File:** `app/(tabs-redesign)/setup.tsx`

Add Activity Tracking toggle, Clear Cache button, Wind Speed unit selector.

*(Detailed implementation same as original plan, with pattern-based edits)*

---

### 2.2 Compass Tutorial (1 hour)

**File:** `app/(tabs-redesign)/wind.tsx`

Add first-use tooltip with AsyncStorage persistence.

*(Detailed implementation same as original plan)*

---

### 2.3 Compass Lock Visual (30 min)

**Files:**
- `src/features/wind/components/compass/LockButton.tsx`
- `src/features/wind/components/compass/styles.ts`

Add outer glow ring and reduceMotion support.

---

### 2.4 Manual Heading Fallback (45 min)

**File:** `app/(tabs-redesign)/wind.tsx`

Add manual heading input when compass unavailable.

---

### 2.5 Sunlight Mode (1.5 hours)

**REQUIRES ADDITIONAL RESEARCH**

Need to examine `src/theme/redesign/index.tsx` for theme provider integration.

---

### 2.6 Club Validation & Presets (1.5 hours)

**File:** `src/features/settings/context/clubs.tsx`

Add validation function and preset data.

---

## Execution Order

```
PARALLEL BATCH 1:
├── 1.0 Feature Flag
├── 1.7 ErrorBanner (new file)
└── 1.3 + 1.4 Touch/Input (CSS only)

SEQUENTIAL:
1.1 Button → 1.2 Screens → 1.5 Shot Loading → 1.6 Wind Loading → 1.8 Storage → 1.9 reduceMotion

PHASE 2 (after Phase 1 verified):
2.0 Settings → 2.1 UI → 2.2-2.4 (parallel) → 2.5 Theme → 2.6 Clubs
```

---

## Risk Matrix

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Animation breaks | Medium | Low | Feature flag rollback |
| TypeScript errors | Medium | Medium | tsc check after each task |
| Layout shifts | Low | Low | Visual QA on device |
| Test failures | Medium | Low | Run yarn test at phase end |

---

## Rollback Procedure

1. Set `PHASE1_ACCESSIBILITY_ENHANCEMENTS` production value to `false`
2. Deploy/rebuild app
3. All Phase 1 UI changes will be disabled
4. Debug specific failing component
5. Re-enable after fix

---

*Generated by Droid - 2026-01-11*
*Based on codebase analysis of crazyplan.md*
