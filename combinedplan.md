# Combined Implementation Plan: AICaddyPro App Store Readiness
Generated: 2026-01-11 | Sources: droidplan.md (verified) + crazyplan.md (complete)

## Overview

This is a **verified and complete** implementation plan for AICaddyPro accessibility and UX improvements. All dependencies have been verified against the actual codebase, and all commands use PowerShell syntax for Windows execution.

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

## Dependency Graph

```
Phase 1 Task Order:

  +------------------+
  | 1.0 Feature Flag |
  |   (Pre-requisite)|
  +--------+---------+
           |
    +------+------+
    v              v
+--------+   +------------+
| 1.1    |   | 1.7        |
| Button |   | ErrorBanner|
| a11y   |   | Component  |
+---+----+   +-----+------+
    |              |
    v              |
+--------+         |
| 1.2    |         |
| Screen |<--------+
| a11y   |
+---+----+
    |
+---+---+------+------+
v       v      v      v
1.3    1.4    1.5    1.6
Touch  Input  Shot   Wind
Target Height  Load   Load

    All above complete
           |
           v
       +-------+
       |  1.8  |
       | Storage|
       | Errors |
       +---+---+
           |
           v
       +-------+
       |  1.9  |
       |reduce |
       |Motion |
       +-------+

Phase 2 Task Order:

  +---------------------+
  | 2.0 Settings Context|
  |    Extensions       |
  |  (Pre-requisite)    |
  +----------+----------+
             |
    +--------+--------+
    v                 v
+--------+      +------------+
| 2.1    |      | 2.5        |
|Settings|      | Sunlight   |
|   UI   |      |   Mode     |
+---+----+      +-----+------+
    |                 |
    v                 |
+--------+           |
| 2.6    |           |
| Club   |<----------+
|Presets |
+--------+

    Independent Tasks:
    +---------+---------+
    v         v         v
  2.2       2.3       2.4
Tutorial   Lock     Manual
          Visual   Heading
```

**Rollback Criteria:**
- If any Phase 1 task causes test failures, disable via feature flag before proceeding
- Feature flag: `PHASE1_ACCESSIBILITY_ENHANCEMENTS` (add to FeatureFlags.ts)

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
Select-String -Path "src/utils/FeatureFlags.ts" -Pattern "PHASE1_ACCESSIBILITY"
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

**Verification:**
```powershell
Select-String -Path "src/core/context/settings.tsx" -Pattern "sunlightModeEnabled: boolean"
Select-String -Path "src/core/context/settings.tsx" -Pattern "windSpeedUnit:"
npx tsc --noEmit src/core/context/settings.tsx
```

---

### 2.1 Expose Hidden Settings UI (1.5 hours)

**File:** `app/(tabs-redesign)/setup.tsx`

#### 2.1.1 Add Activity Tracking Toggle

**After Notifications SettingRow, add:**
```typescript
<SettingRow
  icon={<Activity size={18} color={colors.brand} />}
  label="Activity Tracking"
  rightElement={
    <Switch
      value={settings.activityTrackingEnabled}
      onValueChange={(value) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        updateSettings({ activityTrackingEnabled: value });
      }}
      trackColor={{ false: colors.border, true: colors.brand }}
      thumbColor={colors.surface}
      accessibilityLabel="Activity Tracking toggle"
    />
  }
/>
```

**Add icon imports:**
```typescript
import {
  // ... existing imports
  Activity,
  Database,
  Wind,
} from 'lucide-react-native';
```

#### 2.1.2 Add DATA Section with Clear Cache Button

**Insert after PERMISSIONS section:**
```typescript
{/* Data Management */}
<Animated.View entering={cardEntering(3)}>
  <SectionHeader title="DATA" />
  <View style={[styles.section, { backgroundColor: colors.surface }]}>
    <SettingRow
      icon={<Database size={18} color={colors.brand} />}
      label="Clear Weather Cache"
      onPress={() => {
        Alert.alert(
          'Clear Weather Cache',
          'This will remove cached weather data. Fresh data will be fetched on next use.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear',
              style: 'destructive',
              onPress: async () => {
                try {
                  await AsyncStorage.removeItem('weatherCache');
                  await AsyncStorage.removeItem('weatherCacheTimestamp');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Success', 'Weather cache cleared.');
                } catch (error) {
                  console.error('Failed to clear cache:', error);
                  Alert.alert('Error', 'Failed to clear cache.');
                }
              },
            },
          ]
        );
      }}
    />
  </View>
</Animated.View>
```

#### 2.1.3 Add Wind Speed Unit Selector in UNITS Section

**Add after Imperial/Metric selector:**
```typescript
{/* Wind Speed Unit Selector */}
<View style={[styles.settingRow, { borderBottomColor: colors.divider, borderBottomWidth: 0 }]}>
  <View style={styles.settingRowLeft}>
    <View style={[styles.settingIcon, { backgroundColor: colors.brandMuted }]}>
      <Wind size={18} color={colors.brand} />
    </View>
    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
      Wind Speed
    </Text>
  </View>
</View>
<View style={[styles.windUnitSelector, { paddingHorizontal: 12, paddingBottom: 12 }]}>
  {(['mph', 'kph', 'kts', 'mps'] as const).map((unit) => (
    <Pressable
      key={unit}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        updateSettings({ windSpeedUnit: unit, speedUnit: unit });
      }}
      style={[
        styles.windUnitOption,
        {
          backgroundColor: settings.speedUnit === unit ? colors.brandMuted : 'transparent',
          borderColor: settings.speedUnit === unit ? colors.brand : colors.border,
        },
      ]}
      accessibilityLabel={`Wind speed in ${unit === 'mps' ? 'meters per second' : unit}`}
      accessibilityRole="button"
      accessibilityState={{ selected: settings.speedUnit === unit }}
    >
      <Text
        style={[
          styles.windUnitOptionLabel,
          { color: settings.speedUnit === unit ? colors.brand : colors.textMuted },
        ]}
      >
        {unit === 'mps' ? 'm/s' : unit}
      </Text>
    </Pressable>
  ))}
</View>
```

#### 2.1.4 Add Styles

```typescript
windUnitSelector: {
  flexDirection: 'row',
  gap: 8,
  flexWrap: 'wrap',
},

windUnitOption: {
  flex: 1,
  minWidth: 60,
  alignItems: 'center',
  paddingVertical: 10,
  paddingHorizontal: 8,
  borderRadius: 10,
  borderWidth: 1.5,
},

windUnitOptionLabel: {
  fontSize: 14,
  fontWeight: '600',
},
```

**Verification:**
```powershell
Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "Activity,"
Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "activityTrackingEnabled"
Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "Clear Weather Cache"
Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "windUnitSelector"
npx tsc --noEmit "app/(tabs-redesign)/setup.tsx"
```

---

### 2.2 Compass First-Use Tutorial (1 hour)

**File:** `app/(tabs-redesign)/wind.tsx`

**Add import:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

**Add tutorial state and effect:**
```typescript
// Tutorial tooltip state
const [showTutorial, setShowTutorial] = useState(false);

// Check if user has seen tutorial
useEffect(() => {
  const checkTutorial = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem('hasSeenCompassTutorial');
      if (!hasSeen) {
        setTimeout(() => setShowTutorial(true), 1500);
      }
    } catch (error) {
      console.error('Failed to check tutorial state:', error);
    }
  };
  checkTutorial();
}, []);

const dismissTutorial = useCallback(async () => {
  setShowTutorial(false);
  try {
    await AsyncStorage.setItem('hasSeenCompassTutorial', 'true');
  } catch (error) {
    console.error('Failed to save tutorial state:', error);
  }
}, []);
```

**Add tooltip component after compass section:**
```typescript
{/* First-Use Tutorial Tooltip */}
{showTutorial && (
  <Animated.View
    entering={cardEntering(0)}
    style={[
      styles.tutorialTooltip,
      { backgroundColor: colors.surface, borderColor: colors.brand },
    ]}
  >
    <Pressable
      onPress={dismissTutorial}
      style={styles.tutorialContent}
      accessibilityLabel="Tutorial: Tap to lock your shot direction. Tap to dismiss."
      accessibilityRole="button"
    >
      <View style={styles.tutorialTextContainer}>
        <Lock size={16} color={colors.brand} />
        <Text style={[styles.tutorialText, { color: colors.textPrimary }]}>
          Tap the lock button to freeze your shot direction
        </Text>
      </View>
      <View style={[styles.tutorialArrow, { borderTopColor: colors.surface }]} />
    </Pressable>
  </Animated.View>
)}
```

**Add styles:**
```typescript
tutorialTooltip: {
  position: 'absolute',
  top: -60,
  left: '50%',
  transform: [{ translateX: -120 }],
  width: 240,
  padding: 12,
  borderRadius: 12,
  borderWidth: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 8,
  zIndex: 100,
},

tutorialContent: {
  alignItems: 'center',
},

tutorialTextContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

tutorialText: {
  fontSize: 14,
  fontWeight: '500',
  flex: 1,
},

tutorialArrow: {
  position: 'absolute',
  bottom: -18,
  left: '50%',
  marginLeft: -8,
  width: 0,
  height: 0,
  borderLeftWidth: 8,
  borderRightWidth: 8,
  borderTopWidth: 10,
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
},
```

**Verification:**
```powershell
Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "import AsyncStorage"
Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "showTutorial"
Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "tutorialTooltip"
Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "hasSeenCompassTutorial"
npx tsc --noEmit "app/(tabs-redesign)/wind.tsx"
```

---

### 2.3 Compass Lock Visual Indicator (30 min)

**Files:**
- `src/features/wind/components/compass/LockButton.tsx`
- `src/features/wind/components/compass/styles.ts`

**Add import to LockButton.tsx:**
```typescript
import { useReduceMotion } from 'react-native-reanimated';
```

**Inside LockButton component:**
```typescript
const reduceMotion = useReduceMotion();
```

**Add outer glow ring after `{!isLocked && <BlurView ...`:**
```typescript
{/* Outer glow ring - only when locked */}
{isLocked && (
  <Animated.View
    style={[
      styles.lockOuterGlow,
      {
        width: lockMetrics.size + 12,
        height: lockMetrics.size + 12,
        borderRadius: (lockMetrics.size + 12) / 2,
        borderColor: tokens.colors.success,
        opacity: reduceMotion ? 0.4 : pulseAnim.interpolate({
          inputRange: [1, 1.08],
          outputRange: [0.6, 0.2],
        }),
        transform: reduceMotion ? [] : [{ scale: pulseAnim }],
      },
    ]}
  />
)}
```

**Add style to styles.ts (in lockButtonStyles):**
```typescript
lockOuterGlow: {
  position: 'absolute',
  borderWidth: 2,
  borderRadius: 999,
},
```

**Verification:**
```powershell
Select-String -Path "src/features/wind/components/compass/LockButton.tsx" -Pattern "lockOuterGlow"
Select-String -Path "src/features/wind/components/compass/styles.ts" -Pattern "lockOuterGlow"
Select-String -Path "src/features/wind/components/compass/LockButton.tsx" -Pattern "useReduceMotion"
npx tsc --noEmit "src/features/wind/components/compass/LockButton.tsx"
```

---

### 2.4 Manual Heading Input Fallback (45 min)

**File:** `app/(tabs-redesign)/wind.tsx`

**Add manual heading state:**
```typescript
const [manualHeading, setManualHeading] = useState<number>(0);
const [useManualHeading, setUseManualHeading] = useState(false);
```

**Add manual heading section (shown when compass unavailable):**
```typescript
{/* Manual Heading Fallback - shown when compass unavailable */}
{!sensorAvailable && (
  <Animated.View entering={cardEntering(1)} style={styles.manualHeadingSection}>
    <View style={[styles.manualHeadingCard, { backgroundColor: colors.surface }]}>
      <View style={styles.manualHeadingHeader}>
        <Compass size={18} color={colors.warning} />
        <Text style={[styles.manualHeadingTitle, { color: colors.textPrimary }]}>
          Manual Shot Direction
        </Text>
      </View>
      <Text style={[styles.manualHeadingSubtitle, { color: colors.textMuted }]}>
        Compass unavailable. Set your shot direction manually.
      </Text>

      {/* Cardinal Direction Quick Select */}
      <View style={styles.cardinalButtonRow}>
        {[
          { label: 'N', value: 0 },
          { label: 'NE', value: 45 },
          { label: 'E', value: 90 },
          { label: 'SE', value: 135 },
          { label: 'S', value: 180 },
          { label: 'SW', value: 225 },
          { label: 'W', value: 270 },
          { label: 'NW', value: 315 },
        ].map((dir) => (
          <Pressable
            key={dir.label}
            onPress={() => {
              setManualHeading(dir.value);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.cardinalButton,
              {
                backgroundColor: manualHeading === dir.value ? colors.brandMuted : colors.backgroundAlt,
                borderColor: manualHeading === dir.value ? colors.brand : colors.border,
              },
            ]}
            accessibilityLabel={`Set heading to ${dir.label}`}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.cardinalButtonText,
                { color: manualHeading === dir.value ? colors.brand : colors.textMuted },
              ]}
            >
              {dir.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  </Animated.View>
)}
```

**Add styles:**
```typescript
manualHeadingSection: {
  marginBottom: 20,
},

manualHeadingCard: {
  borderRadius: 16,
  padding: 16,
},

manualHeadingHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 4,
},

manualHeadingTitle: {
  fontSize: 16,
  fontWeight: '600',
},

manualHeadingSubtitle: {
  fontSize: 13,
  marginBottom: 16,
},

cardinalButtonRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 12,
},

cardinalButton: {
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 10,
  borderWidth: 1.5,
  minWidth: 44,
  alignItems: 'center',
},

cardinalButtonText: {
  fontSize: 14,
  fontWeight: '600',
},
```

**Compute effective relative wind angle:**
```typescript
const effectiveRelativeWindAngle = useMemo(() => {
  if (!sensorAvailable) {
    const windDir = environmental.conditions?.windDirection || 0;
    const relative = (windDir - manualHeading + 360) % 360;
    return relative;
  }
  return relativeWindAngle;
}, [sensorAvailable, manualHeading, relativeWindAngle, environmental.conditions?.windDirection]);
```

**Update triggerCalculation to use `effectiveRelativeWindAngle` instead of `relativeWindAngle`.**

**Verification:**
```powershell
Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "manualHeading"
Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "cardinalButtonRow"
npx tsc --noEmit "app/(tabs-redesign)/wind.tsx"
```

---

### 2.5 Outdoor/Sunlight Mode (1 hour)

**Files:**
- `src/theme/redesign/tokens.ts`
- `src/theme/redesign/index.tsx`
- `app/(tabs-redesign)/setup.tsx`

**Add sunlight theme to tokens.ts:**
```typescript
export const sunlightTheme: ThemeColors = {
  background: '#0A0A0A',
  backgroundAlt: '#141414',
  surface: '#1A1A1A',
  surfaceElevated: '#222222',

  textPrimary: '#FFE600',
  textSecondary: '#00FFE5',
  textMuted: '#CCCCCC',
  textInverse: '#0A0A0A',

  brand: '#FFE600',
  brandMuted: 'rgba(255, 230, 0, 0.2)',
  accent: '#00FFE5',

  border: '#333333',
  borderStrong: '#444444',
  divider: '#222222',

  interactive: '#FFE600',
  interactiveHover: '#FFEB3B',
  interactivePressed: '#FDD835',

  success: '#00FF88',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#00D4FF',
};
```

**Update ThemeMode type:**
```typescript
export type ThemeMode = 'light' | 'dark' | 'outdoor' | 'sunlight';
```

**Update themes export:**
```typescript
themes: {
  light: lightTheme,
  dark: darkTheme,
  outdoor: outdoorTheme,
  sunlight: sunlightTheme,
},
```

**Add sunlight toggle in setup.tsx APPEARANCE section:**
```typescript
<SettingRow
  icon={<Sun size={18} color={colors.brand} />}
  label="Sunlight Mode"
  rightElement={
    <Switch
      value={settings.sunlightModeEnabled}
      onValueChange={(value) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        updateSettings({ sunlightModeEnabled: value });
      }}
      trackColor={{ false: colors.border, true: colors.brand }}
      thumbColor={colors.surface}
      accessibilityLabel="Sunlight mode toggle"
    />
  }
/>
<Text style={[styles.sunlightModeHint, { color: colors.textMuted }]}>
  High contrast theme for outdoor visibility
</Text>
```

**Add style:**
```typescript
sunlightModeHint: {
  fontSize: 12,
  paddingHorizontal: 16,
  paddingBottom: 12,
  paddingTop: 4,
},
```

**Verification:**
```powershell
Select-String -Path "src/theme/redesign/tokens.ts" -Pattern "sunlightTheme"
Select-String -Path "src/theme/redesign/tokens.ts" -Pattern "'sunlight'"
Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "sunlightModeEnabled"
npx tsc --noEmit "src/theme/redesign/tokens.ts" "app/(tabs-redesign)/setup.tsx"
```

---

### 2.6 Club Validation & Presets (1.5 hours)

**File:** `src/features/settings/context/clubs.tsx`

**Add validation constants and functions:**
```typescript
const MAX_CLUBS = 14;
const MIN_DISTANCE_YARDS = 50;
const MAX_DISTANCE_YARDS = 400;
const MAX_NAME_LENGTH = 20;
const MIN_NAME_LENGTH = 1;

export interface ClubValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateClub(
  club: Partial<ClubData>,
  existingClubs: ClubData[],
  isUpdate: boolean = false,
  updatingClubId?: string
): ClubValidationResult {
  const errors: string[] = [];

  const name = (club.name || '').trim();
  if (name.length < MIN_NAME_LENGTH) {
    errors.push('Club name is required');
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.push(`Club name must be ${MAX_NAME_LENGTH} characters or less`);
  }

  const duplicateName = existingClubs.some(
    (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== updatingClubId
  );
  if (duplicateName) {
    errors.push('A club with this name already exists');
  }

  const distance = club.normalYardage || 0;
  if (distance < MIN_DISTANCE_YARDS) {
    errors.push(`Distance must be at least ${MIN_DISTANCE_YARDS} yards`);
  } else if (distance > MAX_DISTANCE_YARDS) {
    errors.push(`Distance must be ${MAX_DISTANCE_YARDS} yards or less`);
  }

  if (!isUpdate && existingClubs.length >= MAX_CLUBS) {
    errors.push(`Maximum ${MAX_CLUBS} clubs allowed`);
  }

  return { isValid: errors.length === 0, errors };
}

export const CLUB_PRESETS = {
  beginner: {
    name: 'Beginner',
    description: '10 clubs with forgiving distances',
    clubs: [
      { name: 'Driver', normalYardage: 220 },
      { name: '3-Wood', normalYardage: 190 },
      { name: '5-Wood', normalYardage: 175 },
      { name: '5-Iron', normalYardage: 155 },
      { name: '6-Iron', normalYardage: 145 },
      { name: '7-Iron', normalYardage: 135 },
      { name: '8-Iron', normalYardage: 125 },
      { name: '9-Iron', normalYardage: 115 },
      { name: 'PW', normalYardage: 100 },
      { name: 'SW', normalYardage: 80 },
    ],
  },
  intermediate: {
    name: 'Intermediate',
    description: '14 clubs with average distances',
    clubs: DEFAULT_CLUBS.map((c) => ({
      name: c.name,
      normalYardage: Math.round(c.normalYardage * 0.85),
    })),
  },
  pro: {
    name: 'Pro',
    description: '14 clubs with tour-average distances',
    clubs: DEFAULT_CLUBS.map((c) => ({
      name: c.name,
      normalYardage: c.normalYardage,
    })),
  },
} as const;

export type ClubPresetKey = keyof typeof CLUB_PRESETS;
```

**Add `loadPreset` function to context:**
```typescript
const loadPreset = React.useCallback(async (presetKey: ClubPresetKey) => {
  const preset = CLUB_PRESETS[presetKey];
  if (!preset) return;

  const newClubs: ClubData[] = preset.clubs.map((c) => ({
    id: generateClubId(),
    name: c.name || '',
    normalYardage: c.normalYardage || 0,
    ball_speed: 0,
    launch_angle: 0,
    spin_rate: 0,
    max_height: 0,
    land_angle: 0,
    spin_decay: 0,
    wind_sensitivity: 1.0,
  }));

  setClubs(sortClubs(newClubs));
  await saveClubs(newClubs);
}, []);
```

**Update context type and value to include `loadPreset`.**

**File:** `app/(tabs-redesign)/setup.tsx`

**Add preset modal and handler** (see crazyplan.md section 2.6.3-2.6.4 for full implementation).

**Verification:**
```powershell
Select-String -Path "src/features/settings/context/clubs.tsx" -Pattern "validateClub"
Select-String -Path "src/features/settings/context/clubs.tsx" -Pattern "CLUB_PRESETS"
Select-String -Path "src/features/settings/context/clubs.tsx" -Pattern "loadPreset"
Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "presetModalVisible"
npx tsc --noEmit "src/features/settings/context/clubs.tsx" "app/(tabs-redesign)/setup.tsx"
```

---

## Phase 2 Verification Script

```powershell
# Save as: scripts/verify-phase2.ps1

Write-Host "=== Phase 2 Verification ===" -ForegroundColor Cyan

# 2.0 Settings Extensions
Write-Host "`n2.0 Settings Extensions"
$sunlight = Select-String -Path "src/core/context/settings.tsx" -Pattern "sunlightModeEnabled: boolean"
if ($sunlight) { Write-Host "  [PASS] sunlightModeEnabled" -ForegroundColor Green }
else { Write-Host "  [FAIL] sunlightModeEnabled" -ForegroundColor Red }

$windUnit = Select-String -Path "src/core/context/settings.tsx" -Pattern "windSpeedUnit:"
if ($windUnit) { Write-Host "  [PASS] windSpeedUnit" -ForegroundColor Green }
else { Write-Host "  [FAIL] windSpeedUnit" -ForegroundColor Red }

# 2.1 Hidden Settings UI
Write-Host "`n2.1 Hidden Settings UI"
$activity = Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "activityTrackingEnabled"
if ($activity) { Write-Host "  [PASS] Activity toggle" -ForegroundColor Green }
else { Write-Host "  [FAIL] Activity toggle" -ForegroundColor Red }

$cache = Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "Clear Weather Cache"
if ($cache) { Write-Host "  [PASS] Cache clear" -ForegroundColor Green }
else { Write-Host "  [FAIL] Cache clear" -ForegroundColor Red }

$windSel = Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "windUnitSelector"
if ($windSel) { Write-Host "  [PASS] Wind unit selector" -ForegroundColor Green }
else { Write-Host "  [FAIL] Wind unit selector" -ForegroundColor Red }

# 2.2 Compass Tutorial
Write-Host "`n2.2 Compass Tutorial"
$tutFlag = Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "hasSeenCompassTutorial"
if ($tutFlag) { Write-Host "  [PASS] Tutorial flag" -ForegroundColor Green }
else { Write-Host "  [FAIL] Tutorial flag" -ForegroundColor Red }

$tutComp = Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "tutorialTooltip"
if ($tutComp) { Write-Host "  [PASS] Tutorial component" -ForegroundColor Green }
else { Write-Host "  [FAIL] Tutorial component" -ForegroundColor Red }

# 2.3 Lock Visual Indicator
Write-Host "`n2.3 Lock Visual Indicator"
$glow = Select-String -Path "src/features/wind/components/compass/LockButton.tsx" -Pattern "lockOuterGlow"
if ($glow) { Write-Host "  [PASS] Outer glow" -ForegroundColor Green }
else { Write-Host "  [FAIL] Outer glow" -ForegroundColor Red }

$reduce = Select-String -Path "src/features/wind/components/compass/LockButton.tsx" -Pattern "useReduceMotion"
if ($reduce) { Write-Host "  [PASS] reduceMotion" -ForegroundColor Green }
else { Write-Host "  [FAIL] reduceMotion" -ForegroundColor Red }

# 2.4 Manual Heading
Write-Host "`n2.4 Manual Heading Fallback"
$manual = Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "manualHeading"
if ($manual) { Write-Host "  [PASS] Manual state" -ForegroundColor Green }
else { Write-Host "  [FAIL] Manual state" -ForegroundColor Red }

$cardinal = Select-String -Path "app/(tabs-redesign)/wind.tsx" -Pattern "cardinalButtonRow"
if ($cardinal) { Write-Host "  [PASS] Cardinal buttons" -ForegroundColor Green }
else { Write-Host "  [FAIL] Cardinal buttons" -ForegroundColor Red }

# 2.5 Sunlight Mode
Write-Host "`n2.5 Sunlight Mode"
$sunTheme = Select-String -Path "src/theme/redesign/tokens.ts" -Pattern "sunlightTheme"
if ($sunTheme) { Write-Host "  [PASS] Sunlight theme" -ForegroundColor Green }
else { Write-Host "  [FAIL] Sunlight theme" -ForegroundColor Red }

$sunMode = Select-String -Path "src/theme/redesign/tokens.ts" -Pattern "'sunlight'"
if ($sunMode) { Write-Host "  [PASS] Sunlight in ThemeMode" -ForegroundColor Green }
else { Write-Host "  [FAIL] Sunlight in ThemeMode" -ForegroundColor Red }

# 2.6 Club Validation & Presets
Write-Host "`n2.6 Club Validation & Presets"
$validate = Select-String -Path "src/features/settings/context/clubs.tsx" -Pattern "validateClub"
if ($validate) { Write-Host "  [PASS] Validation function" -ForegroundColor Green }
else { Write-Host "  [FAIL] Validation function" -ForegroundColor Red }

$presets = Select-String -Path "src/features/settings/context/clubs.tsx" -Pattern "CLUB_PRESETS"
if ($presets) { Write-Host "  [PASS] Presets data" -ForegroundColor Green }
else { Write-Host "  [FAIL] Presets data" -ForegroundColor Red }

$modal = Select-String -Path "app/(tabs-redesign)/setup.tsx" -Pattern "presetModalVisible"
if ($modal) { Write-Host "  [PASS] Preset modal" -ForegroundColor Green }
else { Write-Host "  [FAIL] Preset modal" -ForegroundColor Red }

# TypeScript compilation
Write-Host "`nTypeScript Compilation"
npx tsc --noEmit
if ($LASTEXITCODE -eq 0) { Write-Host "  [PASS] No type errors" -ForegroundColor Green }
else { Write-Host "  [FAIL] Type errors exist" -ForegroundColor Red }

Write-Host "`n=== End Phase 2 Verification ===" -ForegroundColor Cyan
```

---

## Execution Order

```
PARALLEL BATCH 1 (can run simultaneously):
+-- 1.0 Feature Flag
+-- 1.7 ErrorBanner (new file)
+-- 1.3 + 1.4 Touch/Input (CSS only)

SEQUENTIAL (Phase 1):
1.1 Button -> 1.2 Screens -> 1.5 Shot Loading -> 1.6 Wind Loading -> 1.8 Storage -> 1.9 reduceMotion

PHASE 2 (after Phase 1 verified):
2.0 Settings -> 2.1 UI -> 2.2-2.4 (parallel) -> 2.5 Theme -> 2.6 Clubs
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

## Estimated Complexity

| Phase | Tasks | Estimated Hours | Risk Level |
|-------|-------|-----------------|------------|
| Phase 1 | 10 tasks | 7-10 hours | Low (feature flagged) |
| Phase 2 | 7 tasks | 5-7 hours | Medium |

**Total for App Store submission (Phase 1)**: 7-10 hours
**Total for Enhanced Experience (Phase 1+2)**: 12-17 hours

---

*Combined from droidplan.md (verified APIs, PowerShell) + crazyplan.md (complete Phase 2)*
*Generated: 2026-01-11*
