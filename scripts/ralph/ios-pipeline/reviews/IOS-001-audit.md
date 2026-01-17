# IOS-001: App Store Metadata & Assets - Audit

**Date:** 2024-01-13
**Status:** FAIL
**Priority Issues Found:** 2 P0, 1 P1

## Requirements Checklist

| Requirement | Status | Finding |
|-------------|--------|---------|
| App name under 30 chars | PASS | "aicaddypro" (10 chars) |
| App name user-friendly | FAIL | Should be "AI Caddy Pro" or similar |
| Subtitle under 30 chars | FAIL | Not defined |
| Description under 4000 chars | N/A | Set in App Store Connect |
| Keywords optimized | N/A | Set in App Store Connect |
| App icon 1024x1024 | **FAIL** | Currently 192x192 |
| Adaptive icon proper size | FAIL | Currently 432x432, should be 1024x1024 |
| Screenshots required sizes | N/A | Marketing asset, not in codebase |
| Category: Sports/Weather | N/A | Set in App Store Connect |
| Age rating: 4+ | N/A | Set in App Store Connect questionnaire |

## P0 - Submission Blockers

### 1. App Icon Size Incorrect
- **Current:** `assets/images/icon.png` is 192x192 pixels
- **Required:** 1024x1024 pixels (no transparency/alpha)
- **Impact:** App will be rejected - icon is required
- **Fix:** Replace with 1024x1024 PNG

### 2. App Name Not User-Friendly
- **Current:** "aicaddypro" (all lowercase, no spaces)
- **Impact:** Poor discoverability and unprofessional appearance
- **Fix:** Change to "AI Caddy Pro" or "AICaddy Pro"

## P1 - Should Fix

### 1. Adaptive Icon Size Incorrect
- **Current:** `assets/images/adaptive-icon.png` is 432x432 pixels
- **Required:** 1024x1024 pixels for Android adaptive icon
- **Impact:** May cause issues on Android, not iOS blocker

### 2. Missing Subtitle
- **Current:** No subtitle defined
- **Recommended:** Add compelling subtitle (30 chars max)
- **Example:** "Golf Wind & Weather Calculator"

## P2 - Polish Items

### 1. Notification Icon
- **Current:** `notif-icon.png` is 192x192
- **Note:** May need to be optimized for iOS notification display

## Asset Inventory

| File | Size | Alpha | Status |
|------|------|-------|--------|
| icon.png | 192x192 | Yes (RGBA) | **WRONG SIZE** |
| adaptive-icon.png | 432x432 | Yes (RGBA) | WRONG SIZE |
| adaptive-icon-background.png | 1024x1024 | Yes | OK |
| splash-icon.png | 1024x1024 | No | OK |
| favicon.png | 48x48 | Yes | OK |
| notif-icon.png | 192x192 | Yes | Review |

## app.json Review

```json
{
  "name": "aicaddypro",     // P0: Change to "AI Caddy Pro"
  "version": "1.2.0",       // OK
  "icon": "./assets/images/icon.png",  // P0: Need 1024x1024
  "ios": {
    "bundleIdentifier": "com.tfunk1030.aicaddypro",  // OK
    "buildNumber": "1.2.0"  // OK
  }
}
```

## Recommended Actions

1. **Create 1024x1024 icon.png** - Critical for submission
2. **Update app name** to "AI Caddy Pro"
3. **Add subtitle** for App Store listing
4. **Update adaptive-icon.png** to 1024x1024 for Android
5. **Verify icon has no transparency** (iOS requirement)

## Next Phase
Implementation required for P0 issues before verification.
