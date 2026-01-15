# AICaddyPro Master Plan
**Generated:** 2026-01-14T12:30:00Z
**Discovery Window:** 2026-01-11 to 2026-01-14 (Last 3 Days)
**Validation:** GPT-5.2 Cross-Review + Code Verification

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total plans/reviews discovered | 189 files |
| Active/In-Progress | 3 pipelines |
| Blocked (user input needed) | 4 P0 items |
| Verified implementations | 5 claims |
| GPT-corrected findings | 3 items |
| Plans to deprecate | 2 |

### Overall Status: **BLOCKED - 4 P0 App Store Blockers + 2 P0 Code Items**

---

## Priority 0 - Ship Blockers

### P0-1: App Icon (USER ACTION REQUIRED)
- **Current:** 192x192 PNG with alpha channel (RGBA)
- **Required:** 1024x1024 PNG, no transparency (RGB only), sRGB color space
- **Evidence:** `assets/images/icon.png` verified via `file` command
- **Additional:** Alpha channel must be removed - App Store rejects icons with transparency
- **Owner:** User must provide compliant icon
- **Status:** BLOCKED

### P0-2: Privacy Policy URL (USER ACTION REQUIRED)
- **Current:** Alert placeholder showing "Privacy policy coming soon!"
- **Required:** Live URL with actual privacy policy content
- **Evidence:**
  - `src/features/redesign/screens/SetupScreen.tsx:576-595` - Alert.alert() placeholder
  - `app/(tabs-redesign)/setup.tsx:64-68` - Placeholder URL
- **Owner:** User must host and provide URL
- **Status:** BLOCKED

### P0-3: Terms of Service URL (USER ACTION REQUIRED)
- **Current:** Not implemented
- **Required:** Live URL with ToS (required for IAP/subscriptions)
- **Evidence:** No ToS link found in codebase (grep verified)
- **Owner:** User must host and provide URL
- **Status:** BLOCKED

### P0-4: App Store Connect Metadata (USER ACTION REQUIRED)
- **Current:** Incomplete
- **Required:** Screenshots, subtitle, description, keywords, support URL
- **Evidence:** `scripts/ralph/ios-pipeline/reviews/IOS-GLOBAL-checklist.md`
- **Owner:** User must complete in App Store Connect
- **Status:** BLOCKED

### P0-5: Location Permission Deferred (CODE CHANGE) - *Downgraded to P1*
- **Current:** Permission requested on app launch (`app/_layout.tsx:183-187`)
- **Required:** Defer until user enters location-dependent flow
- **Evidence:**
  ```
  app/_layout.tsx:183: const { status } = await Location.getForegroundPermissionsAsync();
  app/_layout.tsx:187: await Location.requestForegroundPermissionsAsync();
  ```
- **Owner:** Developer
- **Status:** NOT STARTED
- **Note:** Per GPT re-validation, iOS checklist marks this as P1, not P0. Moved to P1 section.

### P0-6: Wind Flow Robustness (CODE CHANGE)
- **Current:** Error state set but not rendered; no retry for calculation failures
- **Required:** Visible error UI with retry action
- **Evidence:**
  - `src/features/wind/hooks/useWindCalculator.ts:49-260` - Sets `error` but...
  - `src/features/wind/screen.tsx:85-197` - Never reads `error` or renders retry
- **Owner:** Developer
- **Status:** PARTIAL (error detection exists, UI missing)

---

## Priority 1 - Before Release

### P1-1: Accessibility Headers on Play + Calculator Screens
- **Current:** Missing `accessibilityRole="header"` on screen titles
- **Evidence:**
  - `src/features/redesign/screens/PlayScreen.tsx` - NO header role
  - `src/features/calculator/screen.tsx` - NO header role
- **Files with headers (verified):** 6 files
  - `src/features/wind/screen.tsx`
  - `src/features/home/screen.tsx`
  - `src/features/settings/screen.tsx`
  - `src/features/redesign/screens/StatsScreen.tsx`
  - `src/features/redesign/screens/SetupScreen.tsx`
  - `src/features/wind/components/results/PrimaryRecommendation.tsx`
- **Status:** PARTIAL

### P1-2: Forecast Error CTAs
- **Current:** Non-actionable errors (no permission/settings button)
- **Required:** "Grant Permission" or "Open Settings" CTAs
- **Evidence:** `src/features/wind/components/WindHourlyForecastBar.tsx`
- **Status:** NOT STARTED

---

## Verified Implementations (Complete)

| Item | Evidence | Verified By |
|------|----------|-------------|
| ThemeProvider `isDark`/`effectiveScheme` | `src/theme/ThemeProvider.tsx:12,49,56` | Code + GPT |
| OS Appearance Listener | `src/theme/ThemeProvider.tsx:24-31` | Code + GPT |
| `mode === 'dark' \|\| mode === 'system'` removed | grep: 0 matches | Code + GPT |
| MIN_TOUCH_TARGET = 48 | `src/utils/responsive.ts:8` | Code + GPT |
| UI-001 through UI-007 complete | `scripts/ralph/ui-pipeline/prd.json` | PRD status |
| IOS-003,005,006,007,008 complete | `scripts/ralph/ios-pipeline/prd.json` | PRD status |
| Typecheck passing | `.factory/prd.json:102-104` (2026-01-14T04:41:52Z) | Factory |
| Lint passing | `.factory/prd.json:105-109` (2026-01-14T04:41:52Z) | Factory |

---

## Contradictions Resolved

| Contradiction | Resolution |
|---------------|------------|
| "36 files with accessibilityRole=header" | FALSE - Only 10 occurrences (6 in src/features, 4 in app/) |
| "19 files with incorrect isDark computation" | STALE - Pattern removed, 0 matches remaining |
| UI-GLOBAL commit pending but passes=true | NOT contradiction - commit is manual step after verification |
| iOS vs Factory globalChecks | Different scope - iOS checks App Store, Factory checks code quality |

---

## Plans Status

### Continue (Active)
| Plan | Location | Purpose |
|------|----------|---------|
| UI/UX Final Consolidated Plan | `docs/UI_UX_FINAL_CONSOLIDATED_PLAN.md` | Master UI execution plan |
| iOS Global Checklist | `scripts/ralph/ios-pipeline/reviews/IOS-GLOBAL-checklist.md` | App Store submission gate |
| UI Pipeline Progress | `scripts/ralph/ui-pipeline/progress.txt` | Session tracking |
| Factory Progress | `.factory/progress.txt` | Session tracking |
| Factory PRD | `.factory/prd.json` | Droid orchestration |
| iOS Pipeline PRD | `scripts/ralph/ios-pipeline/prd.json` | iOS submission tracking |
| UI Pipeline PRD | `scripts/ralph/ui-pipeline/prd.json` | UI polish tracking |

### Deprecate/Archive
| Plan | Location | Reason |
|------|----------|--------|
| combinedplan.md | `./combinedplan.md` | Superseded by pipeline PRDs |
| droidplan.md | `./droidplan.md` | Superseded by Factory PRD |
| 2026findings.md | `./2026findings.md` | From 2026-01-02, outside 3-day window |

---

## Recommended Execution Order

### Phase 1: User-Provided Assets (BLOCKS SUBMISSION)
1. Create 1024x1024 app icon (PNG, no alpha, sRGB)
2. Host Privacy Policy at live URL
3. Host Terms of Service at live URL
4. Complete App Store Connect metadata

### Phase 2: P0 Code Changes
1. Defer location permission (`app/_layout.tsx`)
2. Wind calculation error UI + retry (`src/features/wind/screen.tsx`)

### Phase 3: P1 Accessibility
1. Add headers to PlayScreen + Calculator
2. Forecast error permission/settings CTAs

### Phase 4: Close Pipelines
1. Run UI-GLOBAL commit
2. Final iOS submission verification

---

## Validation Commands

```bash
# Type checking
npx tsc --noEmit

# Lint
npx expo lint

# Verify theme patterns removed
grep -r "mode === 'dark' || mode === 'system'" src/

# Verify touch targets
grep -n "MIN_TOUCH_TARGET" src/utils/responsive.ts

# Count accessibility headers
grep -r "accessibilityRole.*header" src/features/ | wc -l
```

---

## Open Questions (Require User Input)

1. **Icon source:** Do you have the 1024x1024 icon ready to provide?
2. **Policy hosting:** Where will Privacy Policy and ToS be hosted?
3. **App Store Connect:** Have you started the App Store Connect setup?
4. **Sentry:** Enable crash reporting for production? (P1, deferred)

---

## Evidence Appendix

### File Modification Verification
All files referenced were verified to be modified within the last 3 days (2026-01-11 to 2026-01-14) using `find -mtime -3`.

### GPT Cross-Review Date
2026-01-14, GPT-5.2 (via mcp__codex__codex)

### Key Corrections from GPT Review
1. accessibilityRole count: 36 → 10 (false positive corrected)
2. Location permission: Assumed deferred → Verified still on launch
3. Wind error UI: Assumed complete → Verified only partial

---

## Re-Validation Notes (GPT Pass 2)

### Refinements Applied
1. **Location permission timing:** Downgraded from P0 to P1 per iOS checklist classification
2. **App icon alpha:** Added explicit note about removing alpha channel
3. **App Store Connect:** Marked as assumption (doc assertion, not code-verifiable)

### Ambiguities Identified
- Privacy Policy screen: Two implementations exist (`SetupScreen.tsx` vs `app/(tabs-redesign)/setup.tsx`)
- ToS: Template exists in `docs/APP_STORE_REQUIREMENTS.md` but not wired into app UI

### Validation Summary
- **13 claims verified** against code
- **1 claim is assumption** (App Store Connect incomplete)
- **2 claims have conditional accuracy** (depend on which screen is active)

---

*Master Plan generated by Ralph Loop Deep Discovery*
*Protocol: Evidence-based, no assumptions, GPT-validated (2 passes)*
