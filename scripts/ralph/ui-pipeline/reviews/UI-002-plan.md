# UI-002 Implementation Plan: SetupScreen.tsx

**Component:** `src/features/redesign/screens/SetupScreen.tsx`
**Date:** 2026-01-13
**Phase:** 4 - Final Implementation Plan

---

## Summary

Based on the synthesis of RAMS, GPT, and ui-ux-pro-max reviews, this plan details the exact code changes needed.

**Estimated Changes:** ~100 lines across 1 file
**Typecheck Required:** After each section

---

## Section 1: Switch Accessibility (P0)

### 1.1 Add accessibilityLabel to Location Switch

**Location:** Lines 476-484 (SettingRow for Location)
**Change:** Add accessibilityLabel to Switch

```tsx
// BEFORE
<Switch
  value={settings.locationEnabled}
  onValueChange={(value) => {...}}
  trackColor={{ false: colors.border, true: colors.brand }}
  thumbColor={colors.surface}
/>

// AFTER
<Switch
  value={settings.locationEnabled}
  onValueChange={(value) => {...}}
  trackColor={{ false: colors.border, true: colors.brand }}
  thumbColor={colors.surface}
  accessibilityLabel="Enable location access"
/>
```

### 1.2 Add accessibilityLabel to Compass Switch

**Location:** Lines 491-499
```tsx
accessibilityLabel="Enable compass"
```

### 1.3 Add accessibilityLabel to Notifications Switch

**Location:** Lines 506-514
```tsx
accessibilityLabel="Enable notifications"
```

---

## Section 2: Club Action Touch Targets (P0)

### 2.1 Increase button size to 44x44

**Location:** Lines 705-711 (styles.clubAction)

```tsx
// BEFORE
clubAction: {
  width: 36,
  height: 36,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},

// AFTER
clubAction: {
  width: 44,
  height: 44,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
},
```

### 2.2 Add accessibilityRole and hitSlop to ClubRow buttons

**Location:** Lines 202-216 (ClubRow component)

```tsx
// BEFORE
<Pressable
  onPress={onEdit}
  style={[styles.clubAction, { backgroundColor: colors.surface }]}
  accessibilityLabel={`Edit ${club.name}`}
>
  <Edit3 size={16} color={colors.textMuted} />
</Pressable>

// AFTER
<Pressable
  onPress={onEdit}
  style={[styles.clubAction, { backgroundColor: colors.surface }]}
  accessibilityLabel={`Edit ${club.name}`}
  accessibilityRole="button"
  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
>
  <Edit3 size={18} color={colors.textMuted} />
</Pressable>
```

Apply same to Delete button.

---

## Section 3: Radio Group Roles (P0)

### 3.1 Add radiogroup to ThemeSelector container

**Location:** Line 240 (ThemeSelector)

```tsx
// BEFORE
<View style={styles.themeSelector}>

// AFTER
<View
  style={styles.themeSelector}
  accessibilityRole="radiogroup"
  accessibilityLabel="Theme selection"
>
```

### 3.2 Add accessibilityLabel to theme options

**Location:** Lines 242-267

```tsx
// BEFORE
accessibilityRole="radio"
accessibilityState={{ selected: value === option.mode }}

// AFTER
accessibilityRole="radio"
accessibilityState={{ selected: value === option.mode }}
accessibilityLabel={`${option.label} theme`}
```

### 3.3 Add radiogroup to Unit container

**Location:** Line 413

```tsx
// BEFORE
<View style={styles.unitSelector}>

// AFTER
<View
  style={styles.unitSelector}
  accessibilityRole="radiogroup"
  accessibilityLabel="Unit system selection"
>
```

### 3.4 Add accessibilityLabel to unit options

**Location:** Lines 414-462

```tsx
// Imperial option
accessibilityLabel="Imperial units: Yards, Fahrenheit, miles per hour"

// Metric option
accessibilityLabel="Metric units: Meters, Celsius, kilometers per hour"
```

---

## Section 4: Row-Level Toggle Behavior (P0)

### 4.1 Make SettingRow trigger switch on row tap

**Location:** SettingRow component (Lines 112-176)

Need to modify the component to accept an `onToggle` prop and make the entire row tappable for switches.

```tsx
// Add to SettingRowProps
interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  onToggle?: () => void;  // NEW: for row-level switch toggling
}

// In SettingRow, wrap with Pressable when onToggle provided
if (onToggle) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
      style={[styles.settingRow, { borderBottomColor: colors.divider }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: /* passed via prop */ }}
      accessibilityLabel={label}
    >
      {content}
    </Pressable>
  );
}
```

### 4.2 Update Switch rows to use onToggle

**Location:** Lines 472-516

```tsx
<SettingRow
  icon={<MapPin size={18} color={colors.brand} />}
  label="Location"
  onToggle={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ locationEnabled: !settings.locationEnabled });
  }}
  rightElement={
    <Switch
      value={settings.locationEnabled}
      onValueChange={(value) => updateSettings({ locationEnabled: value })}
      trackColor={{ false: colors.border, true: colors.brand }}
      thumbColor={colors.surface}
      accessibilityLabel="Enable location access"
    />
  }
/>
```

---

## Section 5: SectionHeader Accessibility (P1)

**Location:** Lines 98-104

```tsx
// BEFORE
<Pressable onPress={onAction} accessibilityRole="button">

// AFTER
<Pressable
  onPress={onAction}
  accessibilityRole="button"
  accessibilityLabel={action}
>
```

---

## Section 6: Page Title Header Role (P1)

**Location:** Lines 337-340

```tsx
// BEFORE
<Text style={[styles.title, { color: colors.textPrimary }]}>
  Setup
</Text>

// AFTER
<Text
  style={[styles.title, { color: colors.textPrimary }]}
  accessibilityRole="header"
>
  Setup
</Text>
```

---

## Section 7: Premium Card Fix (P1)

**Location:** Lines 524-547

Option A: Make it disabled
```tsx
<Pressable
  style={[styles.premiumCard, {...}]}
  accessibilityRole="button"
  accessibilityLabel="Upgrade to Premium"
  accessibilityState={{ disabled: true }}
  accessibilityHint="Premium features coming soon"
  disabled={true}
>
```

Option B: Add placeholder onPress
```tsx
<Pressable
  style={[styles.premiumCard, {...}]}
  accessibilityRole="button"
  accessibilityLabel="Upgrade to Premium"
  onPress={() => Alert.alert('Premium', 'Premium features coming soon!')}
>
```

**Recommendation:** Option B (provides user feedback)

---

## Section 8: Token Normalization (P2)

### 8.1 Import tokens at top of file

```tsx
import { tokens } from '@/src/theme/tokens';
```

### 8.2 Replace gap values

```tsx
// Line 729
themeSelector: { gap: tokens.spacing.sm }, // 8

// Line 752
unitSelector: { gap: tokens.spacing.sm }, // 8
```

### 8.3 Replace key spacing values (optional for this phase)

If time permits, replace:
- `paddingHorizontal: 16` → `paddingHorizontal: tokens.spacing.md`
- `marginBottom: 24` → `marginBottom: tokens.spacing.lg`
- etc.

---

## Implementation Order

1. **Run typecheck first:** `npx tsc --noEmit` (baseline)
2. **Section 1:** Switch accessibility labels
3. **Typecheck**
4. **Section 2:** Club action touch targets
5. **Typecheck**
6. **Section 3:** Radio group roles
7. **Typecheck**
8. **Section 4:** Row-level toggle behavior (most complex)
9. **Typecheck**
10. **Section 5-7:** Minor P1 fixes
11. **Typecheck**
12. **Section 8:** Token normalization (if time)
13. **Final typecheck**

---

## Verification Checklist

After implementation:
- [ ] `npx tsc --noEmit` passes
- [ ] All Switches have accessibilityLabel
- [ ] Club buttons are 44x44
- [ ] Theme/Unit containers have radiogroup role
- [ ] Tapping switch rows toggles the switch
- [ ] Premium card has working onPress
- [ ] Page title has header role
- [ ] No regressions in visual appearance

---

*Plan generated: 2026-01-13*
*Ready for Phase 5: Implementation*
