# AICaddyPro — Interview Decisions Summary

**Interviewee:** Taylor  
**Date:** January 16, 2026

---

## Claude Opus Interview

| # | Question | Decision |
|---|----------|----------|
| 1 | Lock interaction model (tap vs hold-release vs hold-to-lock) | **Tap to lock** |
| 2 | Dual result layout (stacked vs side-by-side vs range) | **Stacked** |
| 3 | User heading arrow color | **White** |
| 4 | Wind arrow color | **Dynamic based on effect** (green=tailwind, red=headwind, yellow=crosswind) |
| 5 | Wind arrow color intensity reflects strength? | **Yes** (pale=weak, vivid=strong) |
| 6 | Crosswind color distinction | **Single yellow** — direction shown by arrow angle only |
| 7 | Gust indicator on compass | **Pulse animation** |
| 8 | Forecast placement | **Collapsible ticker** at top of Wind screen |
| 9 | Lock button visibility | **Visible pill** (not invisible) |
| 10 | Precision buttons | **Single ±1 set**, hold for fast scroll |
| 11 | Direct numeric entry | **Yes** — long-press opens keypad |
| 12 | Voice commands | **Maybe later** — not MVP |
| 13 | Lock button position default | **Both sides** |
| 14 | Collapsed forecast shows | **Mini timeline** with direction + speed + gusts |
| 15 | Units default | **Yards** |
| 16 | Quick select presets | **Keep defaults** (100/125/150/175/200) |
| 17 | Club recommendation on Wind screen | **Yes** |
| 18 | Aim direction format | **Text only** ("Aim: 3 yds LEFT") |
| 19 | Result breakdown default | **Collapsed** — tap to expand |
| 20 | Result card behavior | **Auto takes over screen** when calculated |
| 21 | Weather pill edit interaction | **Inline edit** (pill expands in place) |
| 22 | Manual override indicator | **Yes** — orange tint + pencil icon |
| 23 | Unlocked center badge text | **"POINT AT TARGET"** |
| 24 | Locked center badge text | **Just "LOCKED"** — degrees shown elsewhere |
| 25 | Result dismiss method | **Button or swipe down** |
| 26 | Re-access result after dismiss | **Must re-lock to recalculate** (no saved state) |
| 27 | Cardinal direction labels on compass | **Keep N/S/E/W** |
| 28 | Compass tick marks | **Full ticks every 10°** with major at N/S/E/W |
| 29 | Slider haptic feedback | **Every 10 yards** |

---

## GPT Interview (from uploaded document)

| # | Question | Decision |
|---|----------|----------|
| 1 | Compass style (HUD vs minimal vs in-between) | **In-between** — professional instrument |
| 2 | Visual styling (minimal vs detailed vs balanced) | **Minimal** |
| 3 | Cardinal labels on compass | **Keep them** |
| 4 | Result format (stacked vs side-by-side vs range) | **Any except range** — no fuzzy estimates |
| 5 | Compass vs result emphasis | **Equal emphasis** |
| 6 | Information density | **Minimal by default, expandable** |
| 7 | Visible factors | **A few key factors visible** |
| 8 | Lock interaction | **Tap to lock** |
| 9 | Lock position | **Configurable left/right** |
| 10 | Slider style | **Medium with optional keypad** |
| 11 | Slider snap points | **No snap points** — free smooth control |
| 12 | Forecast placement | **Collapsible panel** |
| 13 | Forecast visibility | **Optional visibility** |
| 14 | Freemium philosophy | **Free very useful; premium adds extras** |
| 15 | App personality | **High-end professional instrument** |
| 16 | Visual feel | **Clean modern calculator** |
| 17 | Priority order | 1. Visual polish, 2. Usability, 3. Speed, 4. Data, 5. Wow factor |
| 18 | Final message format | **"Play 186 yards, aim 4 left"** |

---

## Consolidated Decisions

### Interaction
- **Lock:** Tap to lock, tap to unlock
- **Lock button:** Visible pill on both edges by default
- **Result:** Auto takes over screen, dismiss via button or swipe
- **Re-access:** Must re-lock to recalculate

### Compass
- **Style:** Professional instrument (clean, minimal, not flashy HUD)
- **Size:** Large, prominent (60-70% screen width)
- **Labels:** Keep N/S/E/W
- **Ticks:** Full marks every 10°
- **User arrow:** White
- **Wind arrow:** Dynamic color (green/red/yellow) with intensity based on strength
- **Gust indicator:** Pulse animation
- **Center badge:** "POINT AT TARGET" when unlocked, "LOCKED" when locked

### Results
- **Layout:** Stacked vertically (sustained over gust)
- **Format:** Exact numbers, no ranges
- **Club recommendation:** Yes, show on Wind screen
- **Aim:** Text only ("Aim: 3 yds LEFT")
- **Breakdown:** Collapsed by default, tap to expand

### Distance Input
- **Slider:** Keep, no snap points, free smooth control
- **Buttons:** Single ±1 set, hold for fast scroll
- **Keypad:** Yes, long-press to open
- **Haptics:** Every 10 yards
- **Presets:** Keep 100/125/150/175/200

### Weather
- **Forecast:** Collapsible ticker showing mini timeline (direction + speed + gusts)
- **Edit:** Inline (pill expands in place)
- **Override indicator:** Orange tint + pencil icon

### Settings
- **Lock position:** Both / Left / Right (default: Both)
- **Units:** Yards / Meters (default: Yards)

### Philosophy
- **Freemium:** Free is useful, premium adds power features
- **Feel:** Professional instrument, not toy
- **Priority:** Polish > Usability > Speed > Data > Wow
- **North star:** "Play 186 yards, aim 4 left"

---

## What NOT to Do
- No compass in free version
- No snap points on slider
- No range displays ("150-160")
- No forecast clutter on main screen
- No flashy HUD aesthetics

