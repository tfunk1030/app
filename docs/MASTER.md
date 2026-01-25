# AICaddyPro — Master Document

**Last Updated:** January 17, 2026

---

## Quick Status

| Metric | Value |
|--------|-------|
| **Version** | 1.0.0 (pre-release) |
| **Expo SDK** | 55.0.0-canary |
| **React Native** | 0.83.1 |
| **Last Successful Build** | Pending (CocoaPods fix needed) |
| **Current Sprint** | Week 2: Compass Overhaul |
| **P0 Blockers** | 4 (user action required) |

---

## App Vision

> **North Star:** "Play 186 yards, aim 4 left"

Professional golf caddy assistant providing:
- Weather-adjusted shot calculations (FREE)
- Wind-based aiming with compass input (PREMIUM)
- Club recommendations
- Real-time environmental conditions

**Target User:** Golfers wanting precise distance adjustments for wind/weather.

**Freemium Model:**
- Free: Shot calculator with environmental adjustments
- Premium: Wind calculator with compass, forecast

---

## Feature Status

### Core Features

| Feature | Status | Tier | Notes |
|---------|--------|------|-------|
| Shot Calculator | ✅ Done | FREE | Environmental adjustments |
| Distance Slider | ✅ Done | FREE | With presets (100/125/150/175/200) |
| Club Recommendations | ✅ Done | FREE | Based on adjusted distance |
| Wind Calculator | 🔄 Polish | PREMIUM | Week 2 improvements |
| Compass Input | ✅ Done | PREMIUM | Device magnetometer |
| Thumb-Zone Lock | ✅ Done | PREMIUM | Both edges |
| Result Takeover | ✅ Done | PREMIUM | Full-screen modal |
| Dual Results | ✅ Done | PREMIUM | Sustained + gust stacked |
| 5-Hour Forecast | ✅ Done | PREMIUM | Collapsible bar |
| Inline Weather Edit | ✅ Done | PREMIUM | Tap pill to edit |
| Override Indicator | ✅ Done | PREMIUM | Orange tint + pencil |

### In Progress (Week 2)

| Feature | Status | Priority | File |
|---------|--------|----------|------|
| Dynamic wind arrow colors | ⏳ Planned | P1 | WindDirectionCompass.tsx |
| Wind strength intensity | ⏳ Planned | P1 | WindDirectionCompass.tsx |
| Gust pulse animation | ⏳ Planned | P1 | WindDirectionCompass.tsx |

### Should Have (Future)

| Feature | Priority | Notes |
|---------|----------|-------|
| Numeric keypad entry | P2 | Long-press distance value |
| Slider haptics | P2 | Every 10 yards |
| Voice commands | P3 | Siri/Google Assistant |
| Shot history | P3 | Track wind trends |

---

## Implementation Timeline

### Week 1: Critical Fixes ✅ COMPLETE
- [x] Fix z-index title overlap bug
- [x] Fix condition pills overlapping status bar
- [x] Fix spacing typo in temperature breakdown
- [x] Standardize spacing throughout

### Week 2: Compass Overhaul 🔄 IN PROGRESS
- [x] Increase compass size to 70% width
- [x] Remove cardinal direction tap buttons (keep labels)
- [x] Update center badge text ("POINT AT TARGET" / "LOCKED")
- [ ] Implement dynamic-colored wind arrow (green/red/yellow)
- [ ] Add color intensity based on wind strength
- [ ] Add pulse animation for gusts

### Week 3: Lock & Result ✅ COMPLETE
- [x] Add thumb-zone lock buttons (both edges)
- [x] Implement tap-to-lock interaction
- [x] Add haptic feedback on lock
- [x] Build result takeover screen
- [x] Implement stacked dual result (sustained + gust)
- [x] Add club recommendation to result
- [x] Add dismiss via button or swipe

### Week 4: Input & Weather ✅ COMPLETE
- [x] Consolidate to single ±1 button set with hold-for-fast
- [ ] Add slider haptics every 10 yards
- [ ] Add long-press for numeric keypad
- [x] Convert weather pills to inline edit
- [x] Add override indicator (orange + pencil)

### Week 5: Forecast & Polish
- [x] Build collapsible 5-hour forecast ticker
- [x] Add units setting
- [ ] Final animation and haptic polish

---

## Build Status

### Recent Builds

| Date | Platform | Profile | Status | Issue |
|------|----------|---------|--------|-------|
| Jan 2026 | iOS | preview | ❌ Failed | CocoaPods |
| Jan 2026 | iOS | preview | ❌ Failed | CocoaPods |
| Jan 2026 | iOS | production | ❌ Failed | CocoaPods |

### Known Build Issues

**CocoaPods Error (SDK 55 Canary)**
```
spawn pod ENOENT
```
- **Root cause:** Expo SDK 55 canary may have incomplete EAS build support
- **expo doctor:** "Dependency validation unreliable with canary SDK"

**Workarounds:**
1. `npx expo install --check` to fix dependencies
2. Add `"cocoapodsLegacyCompatibility": true` to eas.json ios section
3. Downgrade to SDK 54 stable if needed

**TrueSheet Native Module**
- Blocks Expo Go (must use dev client)
- Error: "package doesn't seem to be linked"
- Solution: Build with `eas build --profile development`

### Build Commands

```bash
# Development (local - requires macOS)
npx expo run:ios

# EAS Builds
eas build -p ios --profile development  # Dev client
eas build -p ios --profile preview      # TestFlight
eas build -p ios --profile production   # App Store
```

---

## Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React Native | 0.83.1 |
| Platform | Expo | 55.0.0-canary |
| Routing | Expo Router | 7.0.0 |
| State | Zustand | 5.0.10 |
| Styling | NativeWind | 4.x |
| Animations | Reanimated | 4.2.1 |
| Payments | RevenueCat | 9.7.0 |
| Icons | lucide-react-native | - |

### Directory Structure

```
app/                      # Expo Router screens
├── (tabs-redesign)/      # Main 3-tab navigation
│   ├── (shot)/           # FREE - Shot calculator
│   ├── (wind)/           # PREMIUM - Wind calculator
│   └── (setup)/          # Club management + settings
│
src/
├── features/             # Domain modules
│   ├── wind/             # Wind calculator (screen + components)
│   ├── redesign/         # Shot screen components
│   ├── settings/         # Settings + premium
│   └── clubs/            # Club bag management
│
├── services/             # Business logic
│   ├── weather/          # 9 API adapters + fallback chain
│   ├── calculations/     # Wind math/physics
│   └── cache/            # Data caching
│
├── core/                 # Infrastructure
│   ├── components/ui/    # Base primitives
│   └── context/          # React contexts
│
├── theme/                # Design tokens
├── stores/               # Zustand state
└── hooks/                # Custom hooks
```

### Key Files

| Purpose | Path |
|---------|------|
| Wind Screen | `src/features/wind/screen.tsx` |
| Compass | `src/features/wind/components/WindDirectionCompass.tsx` |
| Lock Buttons | `src/features/wind/components/ThumbZoneLockButton.tsx` |
| Result Modal | `src/features/wind/components/ResultTakeoverModal.tsx` |
| Theme Tokens | `src/theme/tokens.ts` |
| Weather Service | `src/services/weather/enhanced-environmental-service.ts` |

---

## Design Decisions

From user interviews (Jan 16, 2026):

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Lock interaction | Tap to lock | Simpler than hold |
| Result layout | Stacked | Sustained over gust |
| User arrow color | White | Distinguish from wind |
| Wind arrow color | Dynamic | Green=tailwind, Red=headwind, Yellow=crosswind |
| Forecast | Collapsible ticker | Shows timeline without clutter |
| Result breakdown | Collapsed default | Tap to expand |
| Lock button position | Both edges | Thumb-reachable either hand |
| Compass style | Professional instrument | Not flashy HUD |

---

## P0 Blockers (App Store)

| Blocker | Owner | Status |
|---------|-------|--------|
| App icon 1024x1024 (no alpha) | User | ⏳ Waiting |
| Privacy Policy URL | User | ⏳ Waiting |
| Terms of Service URL | User | ⏳ Waiting |
| App Store Connect metadata | User | ⏳ Waiting |

---

## Success Criteria

- [x] Lock without looking at screen (thumb zone)
- [ ] Result in <2 seconds after lock
- [x] Both sustained and gust calculations
- [ ] Wind help/hurt via arrow color (Week 2)
- [x] Weather override in one tap
- [x] 5-hour forecast
- [ ] Professional instrument feel
- [x] "Play 186 yards, aim 4 left" clarity

---

## Design System

### Colors

| Token | Value | Use |
|-------|-------|-----|
| primary | #2E8B57 | Course green |
| accent | #F4D03F | Sand/gold highlights |
| success | #16A34A | Under par, tailwind |
| warning | #F59E0B | Bogey, crosswind |
| danger | #DC2626 | Out of bounds, headwind |
| background | #FAFAFA | Light mode |
| backgroundDark | #0F172A | Dark mode |

### Spacing (8pt Grid)

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px (related elements) |
| md | 16px |
| lg | 24px (sections) |
| xl | 32px |

### Touch Targets

| Type | Size |
|------|------|
| Minimum | 48x48dp |
| Primary actions | 56x56dp |

---

## What NOT to Change

| Element | Reason |
|---------|--------|
| Slider for distance | Correct for 80-250 yd range |
| Quick select presets | Working well |
| Dark theme | OLED-friendly, outdoor contrast |
| Environmental breakdown | Builds trust |
| Tab navigation | Clear feature separation |
| Free without compass | Correct freemium split |

---

## Reference Links

- **Action Plan:** `docs/current/AICaddyPro-Action-Plan.md`
- **Interview Decisions:** `docs/current/AICaddyPro-Interview-Summary.md`
- **UI Plan:** `docs/current/winduiplan.md`
- **Archive:** `archive/` (old plans, completed reviews)

---

*Auto-updated by Claude sessions. Last edit: January 17, 2026*
