# PRD: UI/UX Restoration - OLD to NEW Version Fix

**Document Type**: Product Requirements Document
**Project**: AICaddyPro
**Created**: 2026-01-21
**Priority**: P0 - Critical
**Status**: Ready for Implementation

---

## Executive Summary

The NEW app version has significant UI/UX regressions compared to the OLD version. This PRD defines the work needed to restore the premium visual polish of the OLD version while preserving valuable NEW features.

### Scorecards
| Version | Score | Status |
|---------|-------|--------|
| OLD | 8.7/10 | Professional, polished |
| NEW | 4.5/10 | Regression, bugs, but good ideas |
| TARGET | 9.0/10 | Best of both |

---

## 1. Critical Bugs (P0 - Blocking)

### 1.1 Title Overlap Bug
**Severity**: Critical - content inaccessible
**Screens Affected**: Wind Calculator, Setup
**Evidence**: IMG_0436, IMG_0437, IMG_0439

**Problem**: Titles scroll WITH content instead of being fixed, causing them to overlap the compass and list items.

**Root Cause**: Title is inside ScrollView instead of outside.

**Current (Broken)**:
```tsx
<ScrollView>
  <Text style={styles.title}>Wind Calculator</Text>
  {/* Title scrolls with content, overlaps! */}
</ScrollView>
```

**Required (Fixed)**:
```tsx
<View style={{ flex: 1 }}>
  <View style={styles.fixedHeader}>
    <Text style={styles.title}>Wind Calculator</Text>
  </View>
  <ScrollView>
    {/* Content scrolls under fixed header */}
  </ScrollView>
</View>
```

**Files to Modify**:
- `src/features/wind/screen.tsx`
- `src/features/settings/screen.tsx`
- Any other screen with ScrollView + title

**Acceptance Criteria**:
- [x] Title remains fixed at top during scroll (Wind screen)
- [ ] Title remains fixed at top during scroll (Settings screen)
- [x] Content scrolls underneath title
- [ ] No visual overlap between title and content (Settings still broken)
- [ ] Works on all screen sizes

---

### 1.2 Missing Tab Bar Icons
**Severity**: Critical - looks unfinished
**Screens Affected**: All screens
**Evidence**: All NEW screenshots show "(shot) (wind) (setup)" text only

**Problem**: Tab bar shows text labels in parentheses without icons, making the app look like a prototype.

**Current (Broken)**:
```tsx
<Tab.Screen
  name="wind"
  options={{
    tabBarLabel: '(wind)',
    // NO tabBarIcon!
  }}
/>
```

**Required (Fixed)**:
```tsx
<Tab.Screen
  name="wind"
  options={{
    tabBarLabel: 'Wind',
    tabBarIcon: ({ color, size }) => (
      <Wind color={color} size={size} />
    ),
  }}
/>
```

**Files to Modify**:
- `app/(tabs-redesign)/_layout.tsx`
- Possibly `app/_layout.tsx`

**Icon Mapping**:
| Tab | Icon | Library |
|-----|------|---------|
| Shot | Target/Crosshair | lucide-react-native |
| Wind | Wind | lucide-react-native |
| Setup | Settings/Cog | lucide-react-native |

**Acceptance Criteria**:
- [x] All tabs have icons AND labels
- [x] Icons match OLD version design
- [x] Icons change color based on active/inactive state
- [x] No parentheses around labels

---

## 2. High Priority (P1 - Degraded UX)

### 2.1 Compass Size Reduced
**Severity**: High - primary interaction degraded
**Evidence**: ~200px vs ~280px original

**Problem**: Compass is too small, reducing usability for the primary interaction.

**Required Changes**:
```tsx
// In WindDirectionCompass.tsx or parent
const COMPASS_SIZE = 280; // Currently ~200, restore to 280
```

**Files to Modify**:
- `src/features/wind/components/compass/WindDirectionCompass.tsx`
- `src/features/wind/screen.tsx` (if size is set there)

**Acceptance Criteria**:
- [ ] Compass diameter is 280px
- [ ] Compass remains centered
- [ ] Touch targets scale proportionally
- [ ] Still fits on screen with inputs visible

---

### 2.2 Compass Polish Lost
**Severity**: High - looks like downgrade
**Evidence**: Less detail, fewer markers in NEW

**Required Restorations**:

| Element | OLD | NEW | Action |
|---------|-----|-----|--------|
| Cardinal labels | N, S, E, W + NE, SE, SW, NW | N, S, E, W only | Add intercardinal |
| Degree ticks | Every 15° | Sparse | Add tick marks |
| Direction labels | White, ~14px, readable | Faint, small | Increase contrast |
| Shot arrow | Thin cyan line | Present | Verify visibility |
| Ring styling | Dark blue (#1a2a4a) | Less defined | Restore ring |

**Files to Modify**:
- `src/features/wind/components/compass/CardinalDirections.tsx`
- `src/features/wind/components/compass/DegreeMarks.tsx`
- `src/features/wind/components/compass/WindDirectionCompass.tsx`

**Acceptance Criteria**:
- [x] All 8 direction labels visible (N, NE, E, SE, S, SW, W, NW)
- [x] Degree tick marks every 10° (not 15° as originally specified)
- [x] Direction labels white with good contrast
- [x] Compass ring has visible border/definition

---

## 3. Medium Priority (P2 - Visual Polish)

### 3.1 Flat Design Regression
**Severity**: Medium - less premium feel
**Evidence**: No gradient background, no card depth

**OLD Version (Premium)**:
- Background: Dark navy gradient (`#0a0f1a → #1a2035`)
- Cards: Darker navy (`#0d1220`) with borders (`#2a3545`)
- Depth: Subtle shadows on cards

**NEW Version (Flat)**:
- Background: Flat black
- Cards: Minimal/no borders
- Depth: None

**Required Changes**:
```tsx
// Background gradient
background: linear-gradient(180deg, #0a0f1a 0%, #1a2035 100%)

// Card styling
{
  backgroundColor: '#0d1220',
  borderWidth: 1,
  borderColor: '#2a3545',
  borderRadius: 12,
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
}
```

**Files to Modify**:
- `src/theme/tokens.ts` (add gradient colors if missing)
- `src/features/wind/screen.tsx`
- `src/features/shot/screen.tsx`
- `src/features/settings/screen.tsx`

**Acceptance Criteria**:
- [ ] Background has subtle gradient (not flat black)
- [ ] Cards have visible borders
- [ ] Cards have subtle shadow for depth
- [ ] Premium feel restored

---

### 3.2 Truncated Direction Display
**Severity**: Medium - UI bug
**Evidence**: "Direction S (?" in IMG_0435

**Problem**: Direction text is truncated or malformed.

**Files to Investigate**:
- `src/features/wind/components/wind-weather-bar.tsx`
- Component displaying wind pills

**Acceptance Criteria**:
- [ ] Direction displays fully (e.g., "Direction: S" or "S (180°)")
- [ ] No truncation or malformed text
- [ ] Consistent format across all states

---

## 4. Features to Preserve from NEW

These NEW features are valuable and must NOT be removed:

### 4.1 Inline Wind Pill Editing
**Location**: Wind calculator header
**Behavior**: Tap wind/gust/direction to edit inline
**Preserve**: YES ✓

### 4.2 +1/-1 Fine Adjustment Buttons
**Location**: Yardage input
**Behavior**: Fine-tune values with small increments
**Preserve**: YES ✓

### 4.3 "Lock Direction First" Guidance
**Location**: Below compass
**Behavior**: Explicit flow instruction for users
**Preserve**: YES ✓

### 4.4 "Edit Manually" Option
**Location**: Below compass
**Behavior**: Alternative to compass for direction input
**Preserve**: YES ✓

### 4.5 Locked State Green Ring
**Location**: Compass
**Behavior**: Visual confirmation when direction locked
**Preserve**: YES ✓

---

## 5. Implementation Order

### Phase 1: Critical Bugs (P0)
1. Fix title overlap bug (all screens)
2. Restore tab bar icons

### Phase 2: High Priority (P1)
3. Restore compass size to 280px
4. Restore compass polish (markers, labels)

### Phase 3: Visual Polish (P2)
5. Restore background gradient
6. Restore card depth/shadows
7. Fix truncated direction display

### Phase 4: Verification
8. Visual regression testing
9. Accessibility audit
10. User acceptance testing

---

## 6. Files Inventory

### Definitely Need Changes
| File | Changes |
|------|---------|
| `app/(tabs-redesign)/_layout.tsx` | Add tab icons |
| `src/features/wind/screen.tsx` | Fix title overlap, restore gradient |
| `src/features/settings/screen.tsx` | Fix title overlap |
| `src/features/wind/components/compass/WindDirectionCompass.tsx` | Restore size |
| `src/features/wind/components/compass/CardinalDirections.tsx` | Add intercardinal labels |
| `src/features/wind/components/compass/DegreeMarks.tsx` | Add tick marks |

### May Need Changes
| File | Reason |
|------|--------|
| `src/theme/tokens.ts` | Add gradient colors if missing |
| `src/features/shot/screen.tsx` | Visual polish |
| `src/features/wind/components/wind-weather-bar.tsx` | Fix truncation |

---

## 7. Verification Plan

### Binary Tests
```bash
npm test wind-colors  # Must pass (41 tests)
```

### Visual Verification
```bash
yarn test:visual           # Playwright visual regression
yarn test:visual:update    # Update baselines after fixes
```

### Manual Checks
- [ ] Screenshot comparison: NEW matches OLD styling
- [ ] Scroll behavior: Title stays fixed
- [ ] Tab bar: Icons visible and correct
- [ ] Compass: 280px, all markers visible
- [ ] Background: Gradient visible
- [ ] Cards: Borders and shadows visible

### Playwright MCP Verification
```
browser_navigate → http://localhost:8081/(tabs-redesign)/(wind)
browser_snapshot → Check accessibility tree
browser_take_screenshot → Compare with OLD screenshots
```

---

## 8. Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Visual Polish Score | 4/10 | 9/10 |
| Layout Score | 3/10 | 9/10 |
| Navigation Score | 2/10 | 9/10 |
| Compass Score | 5/10 | 9/10 |
| Overall Score | 4.5/10 | 9.0/10 |

### Specific Requirements
- [ ] No title overlap on any screen
- [ ] All tabs have icons
- [ ] Compass size = 280px
- [ ] 8 direction labels (N, NE, E, SE, S, SW, W, NW)
- [ ] Background gradient present
- [ ] Card borders and shadows visible
- [ ] All 41 wind-colors tests pass
- [ ] No accessibility regressions

---

## 9. Reference Screenshots

### OLD Version (Target)
- `oldbutgood.PNG` - Weather screen
- `oldbutgood1.PNG` - Wind calculator (top)
- `oldbutgood2.PNG` - Wind calculator (scrolled)
- `oldbutgood3.PNG` - Results screen

### NEW Version (Current - Broken)
- `IMG_0434.PNG` - Shot calculator
- `IMG_0435.PNG` - Wind calculator (initial)
- `IMG_0436.PNG` - Wind calculator (scrolled - OVERLAP BUG)
- `IMG_0437.PNG` - Wind calculator (edit manually - WORSE OVERLAP)
- `IMG_0438.PNG` - Wind calculator (locked)
- `IMG_0439.PNG` - Setup/Club list (OVERLAP BUG)

---

## 10. Appendix: Color Reference

### OLD Version Colors
```tsx
// Background
background: '#0a0f1a'  // Start
backgroundEnd: '#1a2035'  // End (gradient)

// Cards
cardBackground: '#0d1220'
cardBorder: '#2a3545'

// Text
textPrimary: '#ffffff'
textSecondary: '#8899aa'

// Accent
accent: '#00d4aa'  // Cyan/teal
```

### Typography Reference
```tsx
// Title
fontSize: 24-28
fontWeight: '700'
color: white

// Section headers
fontSize: 14
fontWeight: '600'
textTransform: 'uppercase'
color: white

// Metric values
fontSize: 22
fontWeight: '700'
color: white

// Metric labels
fontSize: 12
fontWeight: '400'
color: gray
```

---

*PRD Generated: 2026-01-21*
*Based on comprehensive 10-screenshot comparison analysis*
