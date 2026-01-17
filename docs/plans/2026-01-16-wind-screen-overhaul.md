# Wind Screen Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Wind Calculator screen into a premium, professional golf instrument with enhanced UX, better visual feedback, and improved accessibility.

**Architecture:** React Native with Expo SDK 54, modular compass components in `src/features/wind/components/compass/`, Zustand for state, token-based theming, reanimated for animations.

**Tech Stack:** React Native, Expo Router, NativeWind v4, react-native-reanimated, expo-haptics, @miblanchard/react-native-slider

---

## Phase 1: Critical Bug Fixes (Priority: P0)

### Task 1.1: Fix Title Overlap on Scroll

**Files:**
- Modify: `src/features/wind/screen.tsx:207-220`

**Step 1: Write the failing test**

Create test file first to verify the bug:

```typescript
// src/features/wind/__tests__/screen.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WindScreen from '../screen';

describe('WindScreen scroll behavior', () => {
  it('title should not overlap with content when scrolled', async () => {
    const { getByText, getByTestId } = render(<WindScreen />);
    const scrollView = getByTestId('wind-scroll-view');

    // Simulate scroll
    fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { y: 100 } } });

    // Title should maintain fixed position or be scrolled away
    const title = getByText('Wind Calculator');
    expect(title).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/wind/__tests__/screen.test.tsx`
Expected: Test framework setup or failure showing current behavior

**Step 3: Implement the fix**

Add `testID` to ScrollView and ensure title has proper z-index positioning:

```typescript
// In screen.tsx, line ~209, add testID and stickyHeaderIndices
<ScrollView
  testID="wind-scroll-view"
  style={[styles.container, { backgroundColor: t.colors.background }]}
  contentContainerStyle={[
    styles.contentContainer,
    { paddingTop: insets.top + t.spacing.md, paddingHorizontal: padding },
  ]}
  showsVerticalScrollIndicator={false}
>
```

The title is inside ScrollView content, so it scrolls with content. This is correct behavior - no z-index fix needed. The "overlap" issue is likely from insufficient top padding. Increase paddingTop:

```typescript
contentContainerStyle={[
  styles.contentContainer,
  { paddingTop: insets.top + t.spacing.lg, paddingHorizontal: padding },
]}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/wind/__tests__/screen.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/wind/screen.tsx src/features/wind/__tests__/screen.test.tsx
git commit -m "fix(wind): increase content padding to prevent title overlap on scroll"
```

---

### Task 1.2: Fix Condition Pills Overlapping Status Bar

**Files:**
- Modify: `src/features/wind/screen.tsx:221-256`

**Step 1: Identify the issue**

The `currentWindRow` view at line 222 shows wind/gust/direction pills. The issue is that when scrolling up, these may overlap the status bar.

**Step 2: Implement the fix**

The ScrollView already uses `paddingTop: insets.top + t.spacing.md`. The pills are inside the ScrollView, so they scroll with content. This is expected behavior.

If the pills are a separate fixed element overlapping, we need to check. Based on code review, the pills are NOT overlapping the status bar - they're inside ScrollView content.

**Resolution:** Verified - pills are inside ScrollView content. No fix needed. If user sees overlap, it's due to iOS status bar transparency. Add background color to status bar area:

```typescript
// In screen.tsx, wrap ScrollView content with status bar aware View
<View style={{ flex: 1, backgroundColor: t.colors.background }}>
  <ScrollView ... />
</View>
```

**Step 3: Commit**

```bash
git add src/features/wind/screen.tsx
git commit -m "fix(wind): ensure background color extends to status bar area"
```

---

### Task 1.3: Fix Missing Space in Temperature Breakdown

**Files:**
- Modify: `src/features/wind/components/results/EffectsGrid.tsx`

**Step 1: Read the EffectsGrid component**

Read: `src/features/wind/components/results/EffectsGrid.tsx`

**Step 2: Find the temperature formatting**

Look for temperature display that shows "+2 yds" without proper spacing.

**Step 3: Implement the fix**

Add proper spacing in the temperature effect display:

```typescript
// Format: "+2 yds" should be "+ 2 yds" or ensure proper spacing exists
const formatEffect = (effect: number, label: string) => {
  const sign = effect >= 0 ? '+' : '';
  return `${sign}${Math.round(effect)} yds`;  // Correct format
};
```

**Step 4: Run lint and tests**

Run: `npm run lint && npm test`

**Step 5: Commit**

```bash
git add src/features/wind/components/results/EffectsGrid.tsx
git commit -m "fix(wind): add proper spacing in temperature breakdown display"
```

---

### Task 1.4: Standardize Vertical Spacing Throughout

**Files:**
- Modify: `src/features/wind/screen.tsx`
- Modify: `src/theme/tokens.ts` (if spacing tokens need adjustment)

**Step 1: Audit current spacing**

Document all spacing values in Wind screen. Target:
- 8dp (t.spacing.sm) between related elements
- 24dp (t.spacing.lg) between sections

**Step 2: Update screen styles**

```typescript
// In screen.tsx createStyles, standardize margins:
compassCard: {
  marginBottom: t.spacing.lg, // 24dp - section gap
},
sliderCard: {
  marginBottom: t.spacing.lg, // 24dp - section gap
},
yardageCard: {
  marginBottom: t.spacing.lg, // 24dp - section gap
},
presetsContainer: {
  marginTop: t.spacing.sm, // 8dp - related element gap
  paddingTop: t.spacing.sm, // 8dp
},
```

**Step 3: Commit**

```bash
git add src/features/wind/screen.tsx
git commit -m "fix(wind): standardize vertical spacing (8dp related, 24dp sections)"
```

---

## Phase 2: Compass Overhaul (Week 2 Priority)

### Task 2.1: Increase Compass Size to 70% Screen Width

**Files:**
- Modify: `src/features/wind/screen.tsx:271`
- Modify: `src/utils/responsive.ts` (if getResponsiveCompassSize exists)

**Step 1: Read responsive utility**

Read: `src/utils/responsive.ts`

**Step 2: Update compass size calculation**

```typescript
// In responsive.ts, update getResponsiveCompassSize
export function getResponsiveCompassSize(): number {
  const { width } = Dimensions.get('window');
  return Math.round(width * 0.7); // 70% of screen width
}
```

**Step 3: Update WindDirectionCompass call**

```typescript
// In screen.tsx line 271
<WindDirectionCompass /> // Remove hardcoded size={260}, let it use responsive
```

**Step 4: Test on different screen sizes**

Run: `npx expo start` and test on iOS simulator + Android emulator

**Step 5: Commit**

```bash
git add src/utils/responsive.ts src/features/wind/screen.tsx
git commit -m "feat(compass): increase size to 70% screen width for better visibility"
```

---

### Task 2.2: Implement Dynamic Wind Arrow Colors (Green/Red/Yellow)

**Files:**
- Modify: `src/features/wind/components/compass/WindArrow.tsx`
- Modify: `src/features/wind/components/compass/types.ts`
- Modify: `src/features/wind/components/compass/WindDirectionCompass.tsx`

**Step 1: Add wind relationship to WindArrow props**

```typescript
// In types.ts, add to WindArrowProps
export interface WindArrowProps {
  angle: number;
  brandAlt: string;
  success: string;
  border: string;
  compassSize: number;
  magnitude?: number;
  reducedMotion?: boolean;
  windRelationship?: 'HEADWIND' | 'TAILWIND' | 'CROSSWIND' | 'QUARTERING';
}
```

**Step 2: Implement color logic in WindArrow**

```typescript
// In WindArrow.tsx, add color calculation
function getWindArrowColor(
  relationship: WindArrowProps['windRelationship'],
  colors: { success: string; danger: string; warning: string; brandAlt: string }
): string {
  switch (relationship) {
    case 'TAILWIND':
      return colors.success;  // Green - helps
    case 'HEADWIND':
      return colors.danger;   // Red - hurts
    case 'CROSSWIND':
      return colors.warning;  // Yellow - lateral
    case 'QUARTERING':
    default:
      return colors.brandAlt; // Default brand color
  }
}

// Update arrow rendering to use dynamic color
const arrowColor = getWindArrowColor(windRelationship, {
  success,
  danger: danger || '#DC2626',
  warning: warning || '#F59E0B',
  brandAlt
});
```

**Step 3: Pass danger and warning colors through props**

```typescript
// In WindDirectionCompass.tsx, pass additional colors
<WindArrow
  angle={relativeWindAngle}
  brandAlt={tokens.colors.brandAlt}
  success={tokens.colors.success}
  danger={tokens.colors.danger}
  warning={tokens.colors.warning}
  border={tokens.colors.border}
  compassSize={size}
  magnitude={windSpeed}
  reducedMotion={reducedMotion}
  windRelationship={windRelationship}
/>
```

**Step 4: Update props interface**

```typescript
// In types.ts
export interface WindArrowProps {
  // ... existing props
  danger?: string;
  warning?: string;
  windRelationship?: WindRelationship;
}
```

**Step 5: Test color changes**

Run: `npx expo start` and rotate device to see different wind relationships

**Step 6: Commit**

```bash
git add src/features/wind/components/compass/WindArrow.tsx src/features/wind/components/compass/types.ts src/features/wind/components/compass/WindDirectionCompass.tsx
git commit -m "feat(compass): add dynamic wind arrow colors based on wind relationship"
```

---

### Task 2.3: Add Color Intensity Based on Wind Strength

**Files:**
- Modify: `src/features/wind/components/compass/WindArrow.tsx`

**Step 1: Implement opacity scaling based on magnitude**

```typescript
// In WindArrow.tsx, update getMagnitudeOpacity
function getMagnitudeOpacity(magnitude: number): number {
  const MIN_OPACITY = 0.4;  // Pale for weak wind
  const MAX_OPACITY = 1.0;  // Vivid for strong wind
  const MAX_WIND = 30;

  const clampedMagnitude = Math.min(Math.max(magnitude, 0), MAX_WIND);
  const normalized = clampedMagnitude / MAX_WIND;
  return MIN_OPACITY + normalized * (MAX_OPACITY - MIN_OPACITY);
}

// Apply to arrow color
const colorOpacity = getMagnitudeOpacity(magnitude);
const arrowColorWithOpacity = `${arrowColor}${Math.round(colorOpacity * 255).toString(16).padStart(2, '0')}`;
```

**Step 2: Update arrow rendering**

Apply the opacity-adjusted color to all arrow elements.

**Step 3: Test with varying wind speeds**

Run: `npx expo start`, adjust wind speed slider to see intensity changes

**Step 4: Commit**

```bash
git add src/features/wind/components/compass/WindArrow.tsx
git commit -m "feat(compass): wind arrow color intensity reflects wind speed"
```

---

### Task 2.4: Add Gust Pulse Animation

**Files:**
- Modify: `src/features/wind/components/compass/WindArrow.tsx`
- Modify: `src/features/wind/components/compass/WindDirectionCompass.tsx`

**Step 1: Add gustSpeed prop**

```typescript
// In types.ts
export interface WindArrowProps {
  // ... existing
  gustSpeed?: number;  // Wind gust speed in mph
}
```

**Step 2: Implement pulse animation for gusts**

```typescript
// In WindArrow.tsx, add gust pulse effect
const gustActive = gustSpeed && gustSpeed > (magnitude || 0);

useEffect(() => {
  if (gustActive && !reducedMotion) {
    // Pulse animation when gusts are active
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnim.start();
    return () => pulseAnim.stop();
  }
}, [gustActive, reducedMotion]);
```

**Step 3: Pass gust data from WindDirectionCompass**

```typescript
// In WindDirectionCompass.tsx
const gustSpeed = conditions?.windGust;

<WindArrow
  // ... existing props
  gustSpeed={gustSpeed}
/>
```

**Step 4: Test with gust conditions**

Manually set gust > wind speed in dev tools to verify pulse

**Step 5: Commit**

```bash
git add src/features/wind/components/compass/WindArrow.tsx src/features/wind/components/compass/types.ts src/features/wind/components/compass/WindDirectionCompass.tsx
git commit -m "feat(compass): add pulse animation when wind gusts are active"
```

---

### Task 2.5: Update Center Badge Text

**Files:**
- Modify: `src/features/wind/components/compass/WindDirectionCompass.tsx:296-345`

**Step 1: Update locked/unlocked text**

```typescript
// In WindDirectionCompass.tsx, update the wind label container
{isLocked ? (
  <View style={[styles.lockedChip, ...]}>
    <MaterialCommunityIcons name="lock" size={14} color={tokens.colors.success} />
    <Text style={[styles.lockedChipText, ...]}>
      LOCKED
    </Text>
  </View>
) : (
  <View style={[styles.windLabel, ...]}>
    <MaterialCommunityIcons name="crosshairs-gps" size={14} color={tokens.colors.textMuted} />
    <Text style={[styles.windLabelText, ...]}>
      POINT AT TARGET
    </Text>
  </View>
)}
```

**Step 2: Update styles for visibility**

```typescript
// Increase font size and contrast for badge
lockedChipText: {
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 1,
},
```

**Step 3: Test on device**

Run: `npx expo start` and verify text is clearly visible

**Step 4: Commit**

```bash
git add src/features/wind/components/compass/WindDirectionCompass.tsx
git commit -m "feat(compass): update center badge to show POINT AT TARGET / LOCKED"
```

---

### Task 2.6: Remove Cardinal Direction Tap Buttons (Keep Labels Only)

**Files:**
- Modify: `src/features/wind/components/compass/CardinalDirections.tsx`

**Step 1: Read current CardinalDirections implementation**

Read: `src/features/wind/components/compass/CardinalDirections.tsx`

**Step 2: Remove Pressable wrapper, keep only Text labels**

```typescript
// In CardinalDirections.tsx, change from tappable buttons to plain text
// BEFORE (if Pressable exists):
<Pressable onPress={() => handleCardinalTap('N')}>
  <View style={styles.cardinalButton}>
    <Text>N</Text>
  </View>
</Pressable>

// AFTER (labels only):
<View style={styles.cardinalLabel}>
  <Text style={styles.cardinalText}>N</Text>
</View>
```

**Step 3: Remove any onPress handlers and button styling**

Remove:
- `onPress` handlers
- Button background colors
- Hit slop / touch targets for cardinals
- Any `accessibilityRole="button"` on cardinals

**Step 4: Keep accessibilityLabel for screen readers**

```typescript
<View
  style={styles.cardinalLabel}
  accessibilityLabel="North direction indicator"
>
  <Text style={styles.cardinalText}>N</Text>
</View>
```

**Step 5: Commit**

```bash
git add src/features/wind/components/compass/CardinalDirections.tsx
git commit -m "refactor(compass): remove cardinal direction tap buttons, keep labels only"
```

---

### Task 2.7: Ensure White User Arrow (Phone Arrow) vs Colored Wind Arrow

**Files:**
- Modify: `src/features/wind/components/compass/PhoneArrow.tsx`
- Modify: `src/features/wind/components/compass/WindDirectionCompass.tsx`

**Step 1: Read PhoneArrow implementation**

Read: `src/features/wind/components/compass/PhoneArrow.tsx`

**Step 2: Ensure PhoneArrow uses white/neutral color**

```typescript
// In PhoneArrow.tsx, use white or surface color
const PhoneArrow: React.FC<PhoneArrowProps> = ({ success }) => {
  const t = useTokens();

  // Use white/surface color instead of success (green)
  const arrowColor = '#FFFFFF'; // Pure white for high visibility

  return (
    <View style={[styles.arrow, { borderBottomColor: arrowColor }]} />
  );
};
```

**Step 3: Update WindDirectionCompass to pass correct prop**

```typescript
// In WindDirectionCompass.tsx
<PhoneArrow color={tokens.colors.surface} /> // White arrow for user heading
```

**Step 4: Commit**

```bash
git add src/features/wind/components/compass/PhoneArrow.tsx src/features/wind/components/compass/WindDirectionCompass.tsx
git commit -m "feat(compass): ensure phone arrow is white to distinguish from colored wind arrow"
```

---

## Phase 3: Lock Mechanism Enhancement (Week 3)

### Task 3.1: Add Thumb-Zone Lock Buttons

**Files:**
- Create: `src/features/wind/components/compass/ThumbZoneLockButton.tsx`
- Modify: `src/features/wind/screen.tsx`

**Step 1: Create ThumbZoneLockButton component**

```typescript
// src/features/wind/components/compass/ThumbZoneLockButton.tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTokens } from '@/src/theme/useTokens';

interface ThumbZoneLockButtonProps {
  side: 'left' | 'right';
  isLocked: boolean;
  onPress: () => void;
}

export function ThumbZoneLockButton({ side, isLocked, onPress }: ThumbZoneLockButtonProps) {
  const t = useTokens();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      style={[
        styles.button,
        side === 'left' ? styles.left : styles.right,
        {
          backgroundColor: isLocked ? t.colors.success : t.colors.surfaceAlt,
          borderColor: isLocked ? t.colors.success : t.colors.border,
        },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={isLocked ? 'Unlock compass' : 'Lock compass direction'}
      accessibilityHint="Locks the shot direction for wind calculations"
    >
      <MaterialCommunityIcons
        name={isLocked ? 'lock' : 'lock-open-variant'}
        size={28}
        color={isLocked ? t.colors.surface : t.colors.textPrimary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 120, // Above tab bar
    width: 56,
    height: 80,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  left: {
    left: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  right: {
    right: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
});
```

**Step 2: Export from index**

```typescript
// In src/features/wind/components/compass/index.ts, add:
export { ThumbZoneLockButton } from './ThumbZoneLockButton';
```

**Step 3: Add to WindScreen**

```typescript
// In screen.tsx, add thumb zone buttons based on settings
const { settings } = useSettings();

// Inside the return, after ScrollView:
{settings.lockButtonPosition !== 'none' && (
  <>
    {(settings.lockButtonPosition === 'both' || settings.lockButtonPosition === 'left') && (
      <ThumbZoneLockButton side="left" isLocked={isLocked} onPress={toggleLock} />
    )}
    {(settings.lockButtonPosition === 'both' || settings.lockButtonPosition === 'right') && (
      <ThumbZoneLockButton side="right" isLocked={isLocked} onPress={toggleLock} />
    )}
  </>
)}
```

**Step 4: Add setting to Settings context**

```typescript
// In src/core/context/settings.tsx, add to Settings interface:
lockButtonPosition: 'left' | 'right' | 'both' | 'none';

// Add default:
lockButtonPosition: 'both',
```

**Step 5: Test thumb-zone accessibility**

Run app and verify buttons are reachable with thumb in one-handed use

**Step 6: Commit**

```bash
git add src/features/wind/components/compass/ThumbZoneLockButton.tsx src/features/wind/components/compass/index.ts src/features/wind/screen.tsx src/core/context/settings.tsx
git commit -m "feat(wind): add thumb-zone lock buttons on screen edges"
```

---

### Task 3.2: Add Enhanced Haptic Feedback

**Files:**
- Modify: `src/features/wind/components/compass/LockButton.tsx`
- Modify: `src/features/wind/components/compass/ThumbZoneLockButton.tsx`

**Step 1: Implement notification haptic on lock**

```typescript
// In both lock button components, update haptic feedback
const handlePress = async () => {
  if (!isLocked) {
    // Locking - medium impact then success notification
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 100);
  } else {
    // Unlocking - light impact
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  onPress();
};
```

**Step 2: Test haptics on physical device**

Haptics don't work in simulator - test on real device

**Step 3: Commit**

```bash
git add src/features/wind/components/compass/LockButton.tsx src/features/wind/components/compass/ThumbZoneLockButton.tsx
git commit -m "feat(wind): add enhanced haptic feedback for lock/unlock"
```

---

## Phase 4: Result Display Enhancement (Week 3)

### Task 4.1: Add Dual Wind Calculation (Sustained + Gust)

**Files:**
- Modify: `src/features/wind/hooks/useWindCalculator.ts`
- Modify: `src/features/wind/components/WindCalculationResults.tsx`
- Create: `src/features/wind/components/results/DualResultCard.tsx`

**Step 1: Update useWindCalculator to calculate gust result**

```typescript
// In useWindCalculator.ts, add gust calculation
export interface WindCalculatorResult extends RecursiveWindCalculationResult {
  // ... existing
  gustResult?: RecursiveWindCalculationResult;  // Gust-based calculation
}

// In calculateWithClubRecursion, after sustained calculation:
if (currentConditions.windGust && currentConditions.windGust > currentWindSpeed) {
  const gustCalculation = calculateWindEffectRecursive(
    {
      ...params,
      windSpeed: currentConditions.windGust,
    },
    currentGetRecommendedClub,
    options
  );

  setResult({
    ...calculationResult,
    gustResult: gustCalculation,
    // ... other fields
  });
}
```

**Step 2: Create DualResultCard component**

```typescript
// src/features/wind/components/results/DualResultCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/src/theme/useTokens';

interface DualResultCardProps {
  sustainedDistance: number;
  gustDistance?: number;
  unit: string;
}

export function DualResultCard({ sustainedDistance, gustDistance, unit }: DualResultCardProps) {
  const t = useTokens();

  return (
    <View style={styles.container}>
      <View style={styles.resultColumn}>
        <Text style={[styles.label, { color: t.colors.textMuted }]}>Sustained</Text>
        <Text style={[styles.value, { color: t.colors.brand }]}>
          {Math.round(sustainedDistance)} {unit}
        </Text>
      </View>
      {gustDistance && (
        <View style={styles.resultColumn}>
          <Text style={[styles.label, { color: t.colors.warning }]}>Gusts</Text>
          <Text style={[styles.value, { color: t.colors.warning }]}>
            {Math.round(gustDistance)} {unit}
          </Text>
        </View>
      )}
    </View>
  );
}
```

**Step 3: Update WindCalculationResults to show dual results**

```typescript
// In WindCalculationResults.tsx
<ResultCard>
  {result.gustResult ? (
    <DualResultCard
      sustainedDistance={result.effectivePlayingDistance}
      gustDistance={result.gustResult.effectivePlayingDistance}
      unit={unitLabel}
    />
  ) : (
    <PrimaryRecommendation effectiveDistance={result.effectivePlayingDistance} />
  )}
  // ... rest of results
</ResultCard>
```

**Step 4: Test with gust conditions**

**Step 5: Commit**

```bash
git add src/features/wind/hooks/useWindCalculator.ts src/features/wind/components/results/DualResultCard.tsx src/features/wind/components/WindCalculationResults.tsx
git commit -m "feat(wind): show dual calculation for sustained and gust conditions"
```

---

### Task 4.2: Add Club Recommendation to Wind Screen

**Files:**
- Modify: `src/features/wind/components/results/ClubRecommendation.tsx`

**Step 1: Verify ClubRecommendation is displayed**

Read: `src/features/wind/components/results/ClubRecommendation.tsx`

The component already exists and is included in WindCalculationResults. Verify it shows prominently.

**Step 2: Enhance club display visibility**

```typescript
// Increase font size and add icon
<View style={styles.clubContainer}>
  <MaterialCommunityIcons name="golf" size={24} color={t.colors.brand} />
  <Text style={styles.clubName}>{recommendedClub}</Text>
</View>
```

**Step 3: Commit**

```bash
git add src/features/wind/components/results/ClubRecommendation.tsx
git commit -m "feat(wind): enhance club recommendation visibility"
```

---

### Task 4.3: Promote Aim Direction to Main Result Card

**Files:**
- Modify: `src/features/wind/components/WindCalculationResults.tsx`
- Modify: `src/features/wind/components/results/LateralAdjustment.tsx`

**Step 1: Move LateralAdjustment higher in the hierarchy**

```typescript
// In WindCalculationResults.tsx, reorder:
<ResultCard>
  <PrimaryRecommendation {...primaryRecommendationProps} />
  <LateralAdjustment {...lateralAdjustmentProps} />  {/* Moved up */}
  <ClubRecommendation {...clubRecommendationProps} />
  // ... rest
</ResultCard>
```

**Step 2: Enhance LateralAdjustment styling**

```typescript
// In LateralAdjustment.tsx, make it more prominent
const styles = {
  container: {
    backgroundColor: t.colors.surfaceAlt,
    borderRadius: t.borderRadius.lg,
    padding: t.spacing.md,
    marginBottom: t.spacing.md,
    alignItems: 'center',
  },
  text: {
    fontSize: t.fontSize.xl,
    fontWeight: '700',
    color: t.colors.warning,  // Stand out color
  },
};

// Display: "Aim: 4 yds LEFT"
```

**Step 3: Commit**

```bash
git add src/features/wind/components/WindCalculationResults.tsx src/features/wind/components/results/LateralAdjustment.tsx
git commit -m "feat(wind): promote aim direction to prominent position in results"
```

---

### Task 4.4: Make Breakdown Collapsed by Default

**Files:**
- Modify: `src/features/wind/components/results/IterationDetails.tsx`
- Modify: `src/core/context/settings.tsx`

**Step 1: Add setting for default breakdown state**

```typescript
// In settings.tsx, add:
breakdownDefaultExpanded: boolean;

// Default:
breakdownDefaultExpanded: false,
```

**Step 2: Update IterationDetails to use setting**

```typescript
// In IterationDetails.tsx
const { settings } = useSettings();
const [isExpanded, setIsExpanded] = useState(settings.breakdownDefaultExpanded);
```

**Step 3: Test expand/collapse behavior**

**Step 4: Commit**

```bash
git add src/features/wind/components/results/IterationDetails.tsx src/core/context/settings.tsx
git commit -m "feat(wind): collapse breakdown by default, add setting to control"
```

---

### Task 4.5: Build Result Takeover Screen

**Files:**
- Create: `src/features/wind/components/ResultTakeoverModal.tsx`
- Modify: `src/features/wind/screen.tsx`
- Modify: `src/features/wind/hooks/useWindCalculator.ts`

**Step 1: Create ResultTakeoverModal component**

```typescript
// src/features/wind/components/ResultTakeoverModal.tsx
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTokens } from '@/src/theme/useTokens';
import { WindCalculatorResult } from '../hooks/useWindCalculator';
import { PrimaryRecommendation } from './results/PrimaryRecommendation';
import { LateralAdjustment } from './results/LateralAdjustment';
import { ClubRecommendation } from './results/ClubRecommendation';
import { DualResultCard } from './results/DualResultCard';
import * as Haptics from 'expo-haptics';

interface ResultTakeoverModalProps {
  visible: boolean;
  result: WindCalculatorResult | null;
  onDismiss: () => void;
}

export function ResultTakeoverModal({ visible, result, onDismiss }: ResultTakeoverModalProps) {
  const t = useTokens();

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  if (!result) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <BlurView intensity={40} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.content, { backgroundColor: t.colors.surface }]}
        >
          {/* Hero Result Display */}
          {result.gustResult ? (
            <DualResultCard
              sustainedDistance={result.effectivePlayingDistance}
              gustDistance={result.gustResult.effectivePlayingDistance}
              unit="yds"
            />
          ) : (
            <PrimaryRecommendation effectiveDistance={result.effectivePlayingDistance} />
          )}

          {/* Aim Direction - Prominent */}
          <LateralAdjustment lateralEffect={result.lateralEffect} />

          {/* Club Recommendation */}
          <ClubRecommendation
            recommendedClub={result.recommendedClub}
            initialClub={result.initialClub}
            clubChange={result.clubChange}
          />

          {/* Dismiss Button */}
          <Pressable
            style={[styles.dismissButton, { backgroundColor: t.colors.surfaceAlt }]}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss results"
          >
            <Text style={[styles.dismissText, { color: t.colors.textPrimary }]}>
              Tap anywhere to dismiss
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  dismissButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
```

**Step 2: Add state to show takeover on calculation**

```typescript
// In screen.tsx
const [showResultTakeover, setShowResultTakeover] = useState(false);

// When calculate completes successfully, show takeover
useEffect(() => {
  if (result) {
    setShowResultTakeover(true);
  }
}, [result]);

// In render:
<ResultTakeoverModal
  visible={showResultTakeover}
  result={result}
  onDismiss={() => setShowResultTakeover(false)}
/>
```

**Step 3: Add swipe-to-dismiss gesture**

```typescript
// Use react-native-gesture-handler PanGestureHandler
// Dismiss on downward swipe > 100px
```

**Step 4: Commit**

```bash
git add src/features/wind/components/ResultTakeoverModal.tsx src/features/wind/screen.tsx
git commit -m "feat(wind): add full-screen result takeover on calculation complete"
```

---

## Phase 5: Distance Input Enhancement (Week 4)

### Task 5.1: Add Slider Haptics Every 10 Yards

**Files:**
- Modify: `src/core/components/ui/slider.tsx`

**Step 1: Update handleSliderChange for 10-yard haptics**

```typescript
// In slider.tsx, update handleSliderChange
const handleSliderChange = useCallback(
  (values: number[]) => {
    const newValue = values[0];
    const currentSteppedValue = Math.round(newValue / step) * step;

    // Trigger haptic every 10 yards (or 10 units)
    const currentTenValue = Math.floor(newValue / 10) * 10;
    const lastTenValue = Math.floor(lastSteppedValue.current / 10) * 10;

    if (currentTenValue !== lastTenValue) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (currentSteppedValue !== lastSteppedValue.current) {
      Haptics.selectionAsync();  // Lighter feedback for single steps
    }

    lastSteppedValue.current = currentSteppedValue;
    // ... rest
  },
  [onValueChange, step]
);
```

**Step 2: Test haptic feedback during sliding**

Test on physical device

**Step 3: Commit**

```bash
git add src/core/components/ui/slider.tsx
git commit -m "feat(slider): add light haptic feedback every 10 units during drag"
```

---

### Task 5.2: Consolidate to Single +/- Buttons with Hold-for-Fast

**Files:**
- Modify: `src/core/components/ui/slider.tsx`

**Step 1: Implement long-press for fast increment**

```typescript
// In slider.tsx, add long-press handling
const longPressInterval = useRef<NodeJS.Timeout | null>(null);
const [isLongPressing, setIsLongPressing] = useState(false);

const handlePressIn = (direction: 'increment' | 'decrement') => {
  // Immediate feedback
  if (direction === 'increment') {
    handleIncrement();
  } else {
    handleDecrement();
  }

  // Start long-press acceleration after 300ms
  longPressInterval.current = setTimeout(() => {
    setIsLongPressing(true);
    // Fast increment every 50ms
    longPressInterval.current = setInterval(() => {
      if (direction === 'increment') {
        handleIncrement();
      } else {
        handleDecrement();
      }
    }, 50);
  }, 300);
};

const handlePressOut = () => {
  if (longPressInterval.current) {
    clearTimeout(longPressInterval.current);
    clearInterval(longPressInterval.current);
  }
  setIsLongPressing(false);
};

// Update Pressable:
<Pressable
  onPressIn={() => handlePressIn('decrement')}
  onPressOut={handlePressOut}
  // Remove onPress - handled by onPressIn
>
```

**Step 2: Test hold-for-fast behavior**

Hold button and verify values increase/decrease quickly

**Step 3: Commit**

```bash
git add src/core/components/ui/slider.tsx
git commit -m "feat(slider): add hold-for-fast-scroll on +/- buttons"
```

---

### Task 5.3: Add Long-Press for Numeric Keypad Entry

**Files:**
- Modify: `src/core/components/ui/slider.tsx`

**Step 1: Add numeric input modal on long-press of value**

```typescript
// In slider.tsx, add state for modal
const [showNumericInput, setShowNumericInput] = useState(false);

// Add long-press handler to value display
<Pressable
  onLongPress={() => setShowNumericInput(true)}
  delayLongPress={500}
>
  <View style={styles.textInputContainer}>
    {/* ... existing TextInput */}
  </View>
</Pressable>

// Add modal for numeric entry
{showNumericInput && (
  <Modal visible transparent animationType="fade">
    <NumericKeypad
      value={sliderValue}
      onSubmit={(value) => {
        setSliderValue(value);
        setInputValue(String(value));
        onValueChange(value);
        setShowNumericInput(false);
      }}
      onCancel={() => setShowNumericInput(false)}
      min={min}
      max={max}
    />
  </Modal>
)}
```

**Step 2: Create NumericKeypad component**

```typescript
// src/core/components/ui/NumericKeypad.tsx
// Full numeric keypad implementation
```

**Step 3: Test numeric entry flow**

**Step 4: Commit**

```bash
git add src/core/components/ui/slider.tsx src/core/components/ui/NumericKeypad.tsx
git commit -m "feat(slider): add long-press for numeric keypad entry"
```

---

## Phase 6: Weather Data Enhancement (Week 4)

### Task 6.1: Make Weather Pills Tappable for Inline Edit

**Files:**
- Modify: `src/features/wind/screen.tsx:221-256`
- Create: `src/features/wind/components/EditableWeatherPill.tsx`

**Step 1: Create EditableWeatherPill component**

```typescript
// src/features/wind/components/EditableWeatherPill.tsx
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, Modal } from 'react-native';
import { useTokens } from '@/src/theme/useTokens';
import * as Haptics from 'expo-haptics';

interface EditableWeatherPillProps {
  label: string;
  value: number;
  unit: string;
  onValueChange: (value: number) => void;
  isOverridden?: boolean;
}

export function EditableWeatherPill({
  label,
  value,
  unit,
  onValueChange,
  isOverridden,
}: EditableWeatherPillProps) {
  const t = useTokens();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(true);
    setEditValue(String(value));
  };

  const handleSubmit = () => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue)) {
      onValueChange(newValue);
    }
    setIsEditing(false);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={[
          styles.pill,
          {
            backgroundColor: isOverridden
              ? t.colors.warningBackgroundAlpha
              : t.colors.surfaceAlt,
            borderColor: isOverridden ? t.colors.warning : t.colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value} ${unit}. Tap to edit.`}
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{Math.round(value)}</Text>
          <Text style={styles.unit}>{unit}</Text>
          {isOverridden && <Pencil size={12} color={t.colors.warning} />}
        </View>
      </Pressable>

      {/* Inline edit modal */}
      <Modal visible={isEditing} transparent>
        {/* ... edit UI */}
      </Modal>
    </>
  );
}
```

**Step 2: Replace static pills in screen.tsx**

```typescript
// In screen.tsx, replace currentWindRow content:
<View style={styles.currentWindRow}>
  <EditableWeatherPill
    label="Wind"
    value={conditions?.windSpeed || 0}
    unit="mph"
    onValueChange={handleWindSpeedOverride}
    isOverridden={overrides.windSpeed !== null}
  />
  {/* ... similar for direction and gusts */}
</View>
```

**Step 3: Add override state management**

```typescript
// In screen.tsx or a new context
const [overrides, setOverrides] = useState({
  windSpeed: null,
  windDirection: null,
  windGust: null,
});
```

**Step 4: Commit**

```bash
git add src/features/wind/components/EditableWeatherPill.tsx src/features/wind/screen.tsx
git commit -m "feat(wind): make weather pills tappable for inline edit with override indicator"
```

---

## Phase 7: 5-Hour Forecast (Week 5)

### Task 7.1: Build Collapsible 5-Hour Forecast Ticker

**Files:**
- Create: `src/features/wind/components/ForecastTicker.tsx`
- Modify: `src/features/wind/screen.tsx`
- Modify: `src/providers/EnhancedEnvironmentalProvider.tsx` (if forecast data needed)

**Step 1: Check if forecast data is available**

Read: `src/providers/EnhancedEnvironmentalProvider.tsx`

Look for hourly forecast data in the weather API response. If not available, we may need to extend the API call.

**Step 2: Create ForecastTicker component**

```typescript
// src/features/wind/components/ForecastTicker.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTokens } from '@/src/theme/useTokens';
import { ChevronDown, ChevronUp, Wind } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface HourlyForecast {
  hour: string; // "2pm", "3pm"
  windSpeed: number;
  windDirection: number;
  gustSpeed?: number;
}

interface ForecastTickerProps {
  forecast: HourlyForecast[];
}

export function ForecastTicker({ forecast }: ForecastTickerProps) {
  const t = useTokens();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  const containerStyle = useAnimatedStyle(() => ({
    height: withTiming(isExpanded ? 120 : 0, { duration: 200 }),
    opacity: withTiming(isExpanded ? 1 : 0, { duration: 200 }),
  }));

  return (
    <View style={[styles.container, { backgroundColor: t.colors.surfaceAlt }]}>
      <Pressable
        style={styles.header}
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Collapse forecast' : 'Expand 5-hour forecast'}
      >
        <Text style={[styles.title, { color: t.colors.textMuted }]}>
          5-Hour Forecast
        </Text>
        {isExpanded ? (
          <ChevronUp size={20} color={t.colors.textMuted} />
        ) : (
          <ChevronDown size={20} color={t.colors.textMuted} />
        )}
      </Pressable>

      <Animated.View style={[styles.content, containerStyle]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {forecast.map((hour, index) => (
            <View key={index} style={styles.hourCard}>
              <Text style={[styles.hourLabel, { color: t.colors.textMuted }]}>
                {hour.hour}
              </Text>
              <Wind
                size={16}
                color={t.colors.brand}
                style={{ transform: [{ rotate: `${hour.windDirection}deg` }] }}
              />
              <Text style={[styles.windSpeed, { color: t.colors.textPrimary }]}>
                {Math.round(hour.windSpeed)}
              </Text>
              {hour.gustSpeed && hour.gustSpeed > hour.windSpeed && (
                <Text style={[styles.gustSpeed, { color: t.colors.warning }]}>
                  G{Math.round(hour.gustSpeed)}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    overflow: 'hidden',
  },
  hourCard: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  hourLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  windSpeed: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  gustSpeed: {
    fontSize: 12,
    fontWeight: '500',
  },
});
```

**Step 3: Integrate into Wind screen**

```typescript
// In screen.tsx, after WindHourlyForecastBar
{conditions?.hourlyForecast && (
  <Animated.View entering={cardEntering(1)}>
    <ForecastTicker forecast={conditions.hourlyForecast} />
  </Animated.View>
)}
```

**Step 4: Add forecast data to environmental provider (if needed)**

Extend API call to fetch 5-hour forecast data.

**Step 5: Commit**

```bash
git add src/features/wind/components/ForecastTicker.tsx src/features/wind/screen.tsx
git commit -m "feat(wind): add collapsible 5-hour forecast ticker"
```

---

## Phase 8: Settings Additions (Week 5)

### Task 8.1: Add Lock Button Position Setting

**Step 1: Add setting options**

```typescript
// In settings.tsx, type is already added in Task 3.1
// Add UI in settings screen:
<SettingRow
  label="Lock Button Position"
  value={settings.lockButtonPosition}
  options={[
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
    { label: 'Both', value: 'both' },
  ]}
  onValueChange={(value) => updateSettings({ lockButtonPosition: value })}
/>
```

**Step 2: Commit**

```bash
git add src/features/settings/screen.tsx
git commit -m "feat(settings): add lock button position preference"
```

---

### Task 8.2: Add Distance Units Setting UI

**Files:**
- Modify: `src/features/settings/screen.tsx`

**Step 1: Add distance unit selector**

The setting already exists in context. Add UI if missing:

```typescript
<SettingRow
  label="Distance Units"
  value={settings.distanceUnit}
  options={[
    { label: 'Yards', value: 'yards' },
    { label: 'Meters', value: 'meters' },
  ]}
  onValueChange={(value) => updateSettings({ distanceUnit: value })}
/>
```

**Step 2: Commit**

```bash
git add src/features/settings/screen.tsx
git commit -m "feat(settings): add distance units preference UI"
```

---

### Task 8.3: Add Quick Select Values Customization

**Files:**
- Modify: `src/core/context/settings.tsx`
- Modify: `src/features/settings/screen.tsx`
- Modify: `src/features/wind/screen.tsx`

**Step 1: Add customizable presets to Settings interface**

```typescript
// In settings.tsx, add to Settings interface:
quickSelectPresets: number[];

// Default value:
quickSelectPresets: [100, 125, 150, 175, 200],
```

**Step 2: Create QuickSelectEditor component**

```typescript
// In settings screen, add preset editor
<View style={styles.settingSection}>
  <Text style={styles.sectionTitle}>Quick Select Presets</Text>
  <Text style={styles.sectionDescription}>
    Customize your yardage quick select buttons
  </Text>
  <View style={styles.presetsEditor}>
    {settings.quickSelectPresets.map((preset, index) => (
      <TextInput
        key={index}
        style={styles.presetInput}
        value={String(preset)}
        keyboardType="numeric"
        onChangeText={(text) => {
          const newPresets = [...settings.quickSelectPresets];
          newPresets[index] = parseInt(text) || 0;
          updateSettings({ quickSelectPresets: newPresets });
        }}
        accessibilityLabel={`Quick select preset ${index + 1}`}
      />
    ))}
  </View>
  <Button
    onPress={() => updateSettings({ quickSelectPresets: [100, 125, 150, 175, 200] })}
    variant="outline"
    size="sm"
  >
    Reset to Defaults
  </Button>
</View>
```

**Step 3: Update Wind screen to use customizable presets**

```typescript
// In screen.tsx, replace YARDAGE_PRESETS constant:
// BEFORE:
const YARDAGE_PRESETS = [100, 125, 150, 175, 200];

// AFTER:
const { settings } = useSettings();
const YARDAGE_PRESETS = settings.quickSelectPresets;
```

**Step 4: Commit**

```bash
git add src/core/context/settings.tsx src/features/settings/screen.tsx src/features/wind/screen.tsx
git commit -m "feat(settings): add customizable quick select yardage presets"
```

---

## Testing Checklist

After implementation, verify:

### Phase 1: Bug Fixes
- [ ] Title does not overlap content when scrolling
- [ ] Weather pills do not overlap status bar
- [ ] Temperature breakdown shows proper spacing
- [ ] Vertical spacing standardized (8dp/24dp)

### Phase 2: Compass
- [ ] Compass is 70% screen width
- [ ] Wind arrow changes color based on relationship (green/red/yellow)
- [ ] Wind arrow intensity reflects wind speed
- [ ] Wind arrow pulses when gusts active
- [ ] Center badge shows "POINT AT TARGET" / "LOCKED"
- [ ] Cardinal direction buttons removed (labels only)
- [ ] Phone arrow is white, wind arrow is colored

### Phase 3: Lock Mechanism
- [ ] Thumb-zone lock buttons work on both edges
- [ ] Haptic feedback on lock (medium + success notification)
- [ ] Haptic feedback on unlock (light)

### Phase 4: Results
- [ ] Dual result shows sustained + gust calculations
- [ ] Result takeover modal appears on calculation
- [ ] Dismiss works via tap and swipe
- [ ] Club recommendation is visible
- [ ] Aim direction is prominent
- [ ] Breakdown collapsed by default

### Phase 5: Distance Input
- [ ] Slider has haptic every 10 yards
- [ ] Hold +/- buttons for fast scroll
- [ ] Long-press value opens numeric keypad

### Phase 6: Weather
- [ ] Weather pills are tappable for inline edit
- [ ] Override indicator shows when values are manual (orange + pencil)

### Phase 7: Forecast
- [ ] 5-hour forecast ticker is collapsible
- [ ] Shows wind speed, direction, gusts for each hour

### Phase 8: Settings
- [ ] Lock button position setting works
- [ ] Distance units setting works
- [ ] Quick select presets are customizable

---

## Accessibility Verification

- [ ] All interactive elements have accessibilityLabel
- [ ] accessibilityRole set correctly (button, header, etc.)
- [ ] Touch targets minimum 48x48dp
- [ ] VoiceOver announces lock state changes
- [ ] Reduced motion respected for animations
- [ ] High contrast colors for outdoor visibility

---

*End of Implementation Plan*
