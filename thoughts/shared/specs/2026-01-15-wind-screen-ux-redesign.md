# Wind Screen UX Redesign Specification

## Executive Summary

Redesign the AICaddyPro wind calculator screen to prioritize on-course usability with arrow-based wind visualization, reduced clutter, and responsive one-handed operation. The goal is to show wind-relative-to-target information instantly and intuitively without requiring explicit calculation steps for basic wind awareness.

## Problem Statement

The current wind screen has multiple usability issues:
- **Too many cards** creating visual clutter
- **Poor hierarchy** - everything appears equally important
- **Multiple overlap bugs** - lock button, compass labels, and other elements collide
- **Inefficient flow** - requires lock→calculate→view for basic wind info
- **Text-heavy** - HEADWIND/TAILWIND/CROSSWIND labels take up space when arrows could communicate faster
- **Inconsistent design** - mixes two different design systems (MetricPill flat vs GlassCard gradients)
- **Only tested on Pro Max** - unknown responsive behavior on smaller devices

**Current pain points on course:**
- Can't quickly glance to see "is this a headwind or tailwind?"
- One-handed operation is difficult
- Information hierarchy doesn't match urgency of mid-round decisions

## Success Criteria

| Criteria | Measurement |
|----------|-------------|
| Wind direction visible instantly | Live arrow updates without lock/calculate |
| One-handed usability | All primary actions in thumb zone |
| No overlapping elements | Visual audit on SE, standard, and Pro Max |
| Clear hierarchy | Primary info (wind direction) dominant |
| Accessibility maintained | VoiceOver labels for all visual indicators |
| Consistent styling | Single design language on screen |

## User Personas

**All skill levels** - casual to low-handicap golfers who:
- Hold phone one-handed (other hand on club)
- Need quick glances in outdoor sunlight
- Want wind info without cognitive load
- May have gloves affecting touch accuracy

## User Journey

### Current Flow (Problem)
1. Open Wind tab
2. See conditions bar, slider, compass, manual inputs (cluttered)
3. Adjust distance
4. Point phone at target, lock compass
5. Tap Calculate
6. View results on separate screen
7. Go back to adjust if needed

### Target Flow (Solution)
1. Open Wind tab
2. **Immediately see** wind arrow relative to phone heading
3. As phone rotates, arrow updates live showing head/tail/crosswind
4. Adjust distance with bottom slider (thumb-reachable)
5. Lock compass only when ready for precise calculation
6. Results appear inline, no screen transition needed

## Functional Requirements

### Must Have (P0)

#### 1. Arrow-Based Wind Visualization
- **Single wind vector arrow** showing direction relative to target/phone heading
- **Crosswind component indicator** (perpendicular tick or split arrowhead)
- **Magnitude encoding** via arrow length, opacity, or stroke weight
- **Minimal legend icon** for disambiguation (not text labels)
- **Fixed target reference** - phone-top or locked heading as baseline

#### 2. Layout Restructure
- **Balanced split**: Compass top half, distance controls bottom half
- **Bottom-of-screen controls** for one-handed thumb reach
- **Reduce card count** - combine related information
- **Clear visual hierarchy**: Wind direction > Distance > Secondary info

#### 3. Responsive Design
- **Breakpoints by screen height** (not device model):
  - Compact mode (<700pt): Stacked controls, smaller compass
  - Regular mode (700-850pt): Balanced split
  - Large mode (>850pt): Generous spacing
- **Safe-area padding** for notches, home indicators
- **Min/max constraints** to prevent overflow

#### 4. Overlap Fixes
- Lock button positioned outside compass bounds
- Cardinal directions (N/E/S/W) contained within ring
- No element overlaps on any screen size

### Should Have (P1)

#### 5. Sensor Reliability UX
- **Accuracy indicator** - subtle visual when compass is unreliable
- **Calibration hint** - prompt when magnetometer needs attention
- **Manual fallback** - direction input when sensors fail
- **Lock behavior** - secondary affordance, not primary flow

#### 6. Accessibility
- **VoiceOver labels** for arrows: "Wind is 12 mph, 30 degrees left of target"
- **Haptic feedback** on heading lock
- **Reduced motion support** - smooth/limit animation updates
- **Sufficient contrast** in both light and dark mode, sunlight readable

#### 7. Inline Results
- Show "plays like" distance inline when locked
- No separate results screen for basic calculation
- Detailed breakdown available via expand/tap if needed

### Nice to Have (P2)

#### 8. Animation Polish
- Smooth arrow transitions (not jumpy)
- Spring physics for lock feedback
- Subtle pulse on significant wind changes

#### 9. Gust Awareness
- Secondary indicator for gust difference
- Color-coded warning for high gusts

## Technical Architecture

### Component Hierarchy

```
WindScreen
├── HeaderSection (minimal - just title if needed)
├── CompassSection (top half)
│   ├── WindDirectionCompass
│   │   ├── DegreeMarks (existing)
│   │   ├── CardinalDirections (existing, contained)
│   │   ├── WindArrow (enhanced - primary arrow)
│   │   ├── CrosswindIndicator (NEW)
│   │   ├── PhoneArrow (existing - target reference)
│   │   └── AccuracyIndicator (NEW - subtle)
│   └── WindMagnitudeLegend (NEW - minimal)
├── DistanceSection (bottom half)
│   ├── DistanceSlider
│   └── InlineResult (shows when locked)
└── ActionBar (bottom, fixed)
    ├── LockButton
    └── CalculateButton (or combined action)
```

### Design System Decision

**Rule**: Use **flat/MetricPill style** for data containers, **accent treatment** for primary actions only.

- Data displays: Flat cards with `colors.surface`, no gradients
- Primary action (Calculate): Brand color, subtle shadow
- Lock button: Surface elevated when unlocked, success color when locked
- No GlassCard on this screen for consistency

### Responsive Strategy

```typescript
const getLayoutMode = (screenHeight: number): 'compact' | 'regular' | 'large' => {
  if (screenHeight < 700) return 'compact';
  if (screenHeight < 850) return 'regular';
  return 'large';
};

const getCompassSize = (mode: LayoutMode, screenWidth: number): number => {
  const baseRatio = { compact: 0.55, regular: 0.60, large: 0.50 };
  const maxSizes = { compact: 220, regular: 280, large: 320 };
  const calculated = screenWidth * baseRatio[mode];
  return Math.min(calculated, maxSizes[mode]);
};
```

### Arrow Visualization Design

```
Target Direction (phone top / locked heading)
           │
           │
    ╲      │      ╱
     ╲     │     ╱
      ╲    │    ╱
       ╲   │   ╱
        ╲  │  ╱
         ╲ │ ╱
          ╲│╱
           *  ←── Center point
          ╱│╲
         ╱ │ ╲
        ╱  │  ╲
       ╱   │   ╲  ←── Wind arrow (pointing FROM wind source)
      ╱    │    ╲
     ╱     │     ╲
    ╱      │      ╲

Crosswind component shown as perpendicular offset or split heads
Magnitude = arrow length from center to edge
```

### Key Calculations (Existing)

From `compass/types.ts`:
```typescript
export type WindRelationship = 'HEADWIND' | 'TAILWIND' | 'CROSSWIND' | 'QUARTERING';

export function getWindRelationship(relativeAngle: number): WindRelationship {
  const normalized = ((relativeAngle % 360) + 360) % 360;
  if (normalized <= 30 || normalized >= 330) return 'HEADWIND';
  if (normalized >= 150 && normalized <= 210) return 'TAILWIND';
  if ((normalized > 60 && normalized < 120) || (normalized > 240 && normalized < 300)) return 'CROSSWIND';
  return 'QUARTERING';
}
```

This logic stays - just visualized differently.

## Non-Functional Requirements

- **Performance**: Arrow updates at 30fps minimum, no frame drops
- **Reliability**: Graceful degradation when sensors unavailable
- **Accessibility**: WCAG 2.1 AA compliant
- **Battery**: Efficient sensor polling (existing implementation adequate)

## Out of Scope

- Changes to the Shot Calculator screen (separate effort if consistency desired)
- Backend/calculation logic changes
- New features beyond UX improvements
- iPad layout optimization

## Open Questions for Implementation

1. Should lock button move to ActionBar or stay on compass edge?
2. Exact arrow style (SVG path vs Animated component)?
3. Should gust indicator be P1 or P2?
4. Manual direction input - slider, wheel, or number input?

## Appendix: Research Findings

### Architect Review (GPT)

Key risks identified:
- **Arrow-only ambiguity**: Need minimal legend or baseline marker
- **Sensor reliability**: Add fallback UX for poor accuracy
- **Responsive strategy**: Use height breakpoints, not device-specific
- **Accessibility**: VoiceOver needs text even with visual arrows
- **Design system conflict**: Pick one style per screen

Effort estimate: **Medium (1-2 days)**

### Existing Code Assets

| Component | Path | Reusable? |
|-----------|------|-----------|
| WindDirectionCompass | `src/features/wind/components/compass/` | Yes, modular |
| CompassLockProvider | `src/features/wind/context/compass-lock.tsx` | Yes |
| useSensorData | `src/features/wind/context/sensor-data.tsx` | Yes |
| MetricPill | `src/components/redesign/MetricPill.tsx` | Yes |
| Slider | `src/core/components/ui/slider.tsx` | Yes |
| useAccessibleAnimations | `src/hooks/useAccessibility.ts` | Yes |
| getResponsiveCompassSize | `src/utils/responsive.ts` | Extend |

---

*Spec created: 2026-01-15*
*Discovery interview completed with user + GPT Architect review*
