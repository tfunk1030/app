# AICaddyPro — Action Plan

**Date:** January 16, 2026  
**Purpose:** What's wrong, what to fix, what to add

---

## Part 1: Bugs to Fix

| Bug | Screen | Priority |
|-----|--------|----------|
| Title "Wind Calculator" overlaps Target Distance input when scrolled | Wind | 🔴 Critical |
| Condition pills (Wind/Gust/Direction) overlap status bar | Wind | 🔴 Critical |
| Missing space before "+2 yds" in Temperature breakdown | Wind | 🟡 Minor |

---

## Part 2: Current Issues to Address

### Layout & Spacing

| Issue | Problem | Fix |
|-------|---------|-----|
| Inconsistent vertical spacing | App feels unpolished | Standardize gaps: 8dp between related elements, 24dp between sections |
| Compass positioned differently across scroll states | Disorienting for user | Lock compass position, don't let it shift on scroll |
| "Edit manually" section cramped at bottom | Hard to access | Replace with inline edit on weather pills |
| No clear visual hierarchy | Everything has same weight | Make compass and result the heroes, reduce visual noise elsewhere |

### Compass

| Issue | Problem | Fix |
|-------|---------|-----|
| Visually flat | Doesn't feel premium | Increase size to 70% screen width, add professional instrument styling |
| "Locked" badge small and unclear | Users don't understand state | Larger center badge: "POINT AT TARGET" when unlocked, "LOCKED" when locked |
| Cardinal direction buttons (E, W, S, N boxes) clutter the ring | Confusing, unused | Remove tappable buttons, keep only N/S/E/W labels |
| Hard to distinguish user heading vs wind direction | Both arrows look similar | White arrow for user, dynamic colored arrow for wind (green/red/yellow) |
| No indication of wind effect type | User must interpret mentally | Wind arrow color shows help/hurt: green=tailwind, red=headwind, yellow=crosswind |
| No indication of wind strength | All winds look the same | Color intensity reflects strength (pale=weak, vivid=strong) |
| No indication of gusty conditions | Gusts not visually distinct | Add pulse animation on wind arrow when gusts active |

### Lock Mechanism

| Issue | Problem | Fix |
|-------|---------|-----|
| No thumb-reachable lock button | Must look at screen to lock | Add visible lock buttons on both screen edges (thumb zone) |
| Lock state unclear | "Locked" badge too subtle | Clear visual state change: outline when unlocked, solid fill when locked |
| No haptic feedback | Lock feels unresponsive | Add medium haptic on lock, success notification on confirm |

### Result Display

| Issue | Problem | Fix |
|-------|---------|-----|
| Single calculation only | No gust data shown | Show both sustained AND gust results |
| Result doesn't stand out | Competes with other elements | Result auto-takes over screen when calculated |
| No club recommendation on Wind screen | User must remember or switch tabs | Add club suggestion to Wind screen results |
| Aim direction is text buried in breakdown | Easy to miss | Promote "Aim: X yds LEFT/RIGHT" to main result card |
| Breakdown always expanded | Too much info by default | Collapse breakdown by default, tap to expand |

### Distance Input

| Issue | Problem | Fix |
|-------|---------|-----|
| No direct numeric entry option | Must use slider for exact numbers like 237 | Add long-press on value to open numeric keypad |
| No haptic feedback on slider | Feels disconnected | Add light haptic every 10 yards |
| Multiple button sets confusing | +1, -1, +5, -5 is cluttered | Single ±1 set, hold for fast scroll |

### Weather Data

| Issue | Problem | Fix |
|-------|---------|-----|
| Manual override buried at bottom | Hard to access when forecast is wrong | Make weather pills tappable for inline edit |
| No indication when data is manually overridden | User forgets they changed it | Add orange tint + pencil icon on overridden pills |
| No forecast for round planning | Surprised by changing conditions | Add collapsible 5-hour forecast ticker |

---

## Part 3: Features to Add

### Must Have (MVP)

| Feature | Description |
|---------|-------------|
| Thumb-zone lock buttons | Visible pill on both edges, tap to lock/unlock |
| Dual wind calculation | Show sustained AND gust results stacked |
| Result takeover screen | Full-screen result on calculate, dismiss with button or swipe |
| Dynamic wind arrow color | Green=tailwind, Red=headwind, Yellow=crosswind |
| Wind strength intensity | Color brightness reflects wind speed |
| Gust pulse animation | Wind arrow pulses when gusts active |
| Inline weather edit | Tap pill to edit in place |
| Override indicator | Orange tint + pencil when manually set |
| Club recommendation on Wind screen | Show suggested club with yardage |

### Should Have

| Feature | Description |
|---------|-------------|
| 5-hour forecast ticker | Collapsible mini-timeline at top showing direction + speed + gusts |
| Numeric keypad entry | Long-press distance value to type exact number |
| Slider haptics | Light feedback every 10 yards |

### Nice to Have (Future)

| Feature | Description |
|---------|-------------|
| Voice commands | "Set distance 237 yards" via Siri/Google Assistant |
| Shareable shot cards | Export calculation as image |
| Shot history analytics | Track wind trends over rounds |

---

## Part 4: Settings to Add

| Setting | Options | Default |
|---------|---------|---------|
| Lock button position | Left / Right / Both | Both |
| Distance units | Yards / Meters | Yards |
| Quick select values | Customizable presets | 100/125/150/175/200 |
| Breakdown display | Expanded / Collapsed by default | Collapsed |

---

## Part 5: Implementation Order

### Week 1: Critical Fixes
1. Fix z-index title overlap bug
2. Fix condition pills overlapping status bar
3. Fix spacing typo in temperature breakdown
4. Standardize spacing throughout

### Week 2: Compass Overhaul
5. Increase compass size to 70% width
6. Remove cardinal direction tap buttons (keep labels)
7. Implement white user arrow
8. Implement dynamic-colored wind arrow (green/red/yellow)
9. Add color intensity based on wind strength
10. Add pulse animation for gusts
11. Update center badge text ("POINT AT TARGET" / "LOCKED")

### Week 3: Lock & Result
12. Add thumb-zone lock buttons (both edges)
13. Implement tap-to-lock interaction
14. Add haptic feedback on lock
15. Build result takeover screen
16. Implement stacked dual result (sustained + gust)
17. Add club recommendation to result
18. Add dismiss via button or swipe

### Week 4: Input & Weather
19. Consolidate to single ±1 button set with hold-for-fast
20. Add slider haptics every 10 yards
21. Add long-press for numeric keypad
22. Convert weather pills to inline edit
23. Add override indicator (orange + pencil)

### Week 5: Forecast & Polish
24. Build collapsible 5-hour forecast ticker
25. Add handedness setting
26. Add units setting
27. Final animation and haptic polish

---

## Part 6: What NOT to Change

| Element | Reason |
|---------|--------|
| Slider for distance input | Correct for golf's variable distances (80-250 yds) |
| Quick select presets (100/125/150/175/200) | Working well, reduces friction |
| Dark theme | OLED-friendly, good outdoor contrast |
| Environmental breakdown (temp/altitude/humidity) | Builds trust, shows why adjustment exists |
| Tab navigation (Shot/Wind/Setup) | Clear separation of features |
| Free version without compass | Correct freemium split — compass is premium value |

---

## Part 7: Success Criteria

When complete, the app should:

- [ ] Allow lock without looking at screen (thumb zone)
- [ ] Show result in under 2 seconds after lock
- [ ] Display both sustained and gust calculations
- [ ] Clearly indicate wind help/hurt via arrow color
- [ ] Allow weather override in one tap
- [ ] Show 5-hour forecast for round planning
- [ ] Feel like a professional instrument, not a toy
- [ ] Deliver "Play 186 yards, aim 4 left" with zero ambiguity

---

*End of Action Plan*
