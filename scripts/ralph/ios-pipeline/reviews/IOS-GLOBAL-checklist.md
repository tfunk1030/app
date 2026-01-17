# IOS-GLOBAL: App Store Review Guidelines Compliance

**Date:** 2024-01-13
**Updated:** 2024-01-13 (GPT Review Feedback)
**Overall Status:** REJECT - 4 P0 blockers
**Reviewer:** Claude + GPT-5.2-codex cross-review

---

## Executive Summary

The AICaddy Pro app requires **4 P0 blockers** to be resolved before App Store submission:

| # | P0 Blocker | Owner | Status |
|---|------------|-------|--------|
| 1 | App icon must be 1024x1024 | User | BLOCKED |
| 2 | Privacy Policy URL required | User | BLOCKED |
| 3 | Terms of Service URL required | User | BLOCKED |
| 4 | App Store Connect metadata incomplete | User | BLOCKED |

---

## P0 Blockers (Must Fix Before Submission)

### P0-1: App Icon Size
**Issue:** Icon is 192x192, must be 1024x1024
**File:** `assets/images/icon.png`
**Requirements:**
- Exactly 1024x1024 pixels
- PNG format
- No transparency (no alpha channel)
- No rounded corners (iOS applies them)
- sRGB color space

**Verification Evidence Required:**
```bash
# Run this to verify icon
file assets/images/icon.png
identify -verbose assets/images/icon.png | grep -E "Geometry|Type|Alpha"
# Expected: 1024x1024, no alpha
```

**Action:** User must provide compliant icon

---

### P0-2: Privacy Policy URL
**Issue:** Shows placeholder "Privacy policy coming soon!" alert
**File:** `src/features/redesign/screens/SetupScreen.tsx:594`
**Current Code:**
```typescript
onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon!')}
```
**Required Code:**
```typescript
onPress={() => Linking.openURL('https://aicaddypro.com/privacy')}
```

**App Store Connect Requirement:** Privacy Policy URL field must also be filled

**Verification Evidence Required:**
- [ ] Screenshot of Privacy Policy link working in app
- [ ] URL returns 200 status with valid policy content
- [ ] Same URL entered in App Store Connect

**Action:** User must host privacy policy and provide URL

---

### P0-3: Terms of Service URL (UPGRADED from P1)
**Issue:** Terms of Service link missing
**Reason for P0:** Apple requires ToS for apps with:
- User accounts
- In-App Purchases
- Subscriptions

**File:** `src/features/redesign/screens/SetupScreen.tsx`
**Requirements:**
- Add ToS link near Privacy Policy link
- ToS must cover subscription terms, cancellation, refunds

**App Store Connect Requirement:** EULA/Terms must be specified

**Verification Evidence Required:**
- [ ] Screenshot of ToS link working in app
- [ ] URL returns 200 status with valid terms content
- [ ] Terms cover IAP subscription requirements

**Action:** User must host ToS and provide URL

---

### P0-4: App Store Connect Metadata
**Issue:** Multiple required fields not prepared

#### Required Metadata Checklist

| Field | Max Length | Status | Content |
|-------|------------|--------|---------|
| App Name | 30 chars | READY | "AI Caddy Pro" |
| Subtitle | 30 chars | NEEDED | e.g., "Golf Shot Calculator" |
| Description | 4000 chars | NEEDED | Full app description |
| Keywords | 100 chars | NEEDED | Comma-separated |
| Support URL | URL | NEEDED | e.g., https://aicaddypro.com/support |
| Marketing URL | URL | NEEDED | e.g., https://aicaddypro.com |
| Privacy Policy URL | URL | NEEDED | See P0-2 |
| Categories | - | NEEDED | Primary: Sports, Secondary: Weather |

#### Required Screenshots

| Device | Size | Count | Status |
|--------|------|-------|--------|
| iPhone 6.9" (16 Pro Max) | 1320 x 2868 | 3-10 | NEEDED |
| iPhone 6.7" (15 Plus) | 1290 x 2796 | 3-10 | NEEDED |
| iPhone 6.5" (11 Pro Max) | 1242 x 2688 | 3-10 | NEEDED |
| iPhone 5.5" (8 Plus) | 1242 x 2208 | 3-10 | NEEDED |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 | 3-10 | NEEDED (if iPad supported) |
| iPad Pro 11" | 1668 x 2388 | 3-10 | NEEDED (if iPad supported) |

**Screenshot Requirements:**
- PNG or JPEG
- RGB color space
- No alpha transparency
- No device frames required (Apple adds them)

#### App Review Information

| Field | Status | Content |
|-------|--------|---------|
| Contact First Name | NEEDED | |
| Contact Last Name | NEEDED | |
| Contact Phone | NEEDED | |
| Contact Email | NEEDED | |
| Demo Account (if login) | NEEDED | Username/password for reviewer |
| Notes for Reviewer | NEEDED | Explain app functionality |

**Verification Evidence Required:**
- [ ] Screenshot of completed App Store Connect metadata
- [ ] All required screenshots uploaded
- [ ] App Review contact info filled

**Action:** User must complete App Store Connect setup

---

## P1 Issues (Should Fix)

| Issue | File | Priority | Recommendation |
|-------|------|----------|----------------|
| Sentry not enabled | `src/config/sentry.ts` | HIGH | Enable for crash reporting |
| Permission request on launch | sensor-data.tsx | MEDIUM | Defer until feature used |
| Motion permission description | app.json | LOW | Make golf-specific |

---

## App Store Review Guidelines Check

### Guideline 1.1 - App Completeness
| Check | Status | Evidence |
|-------|--------|----------|
| No crashes on launch | PASS | Manual testing |
| No placeholder content | **FAIL** | Privacy Policy placeholder |
| All features functional | PASS | Manual testing |
| No test data visible | PASS | Manual testing |

**Status:** FAIL - Placeholder content exists

### Guideline 2.3 - Accurate Metadata
| Check | Status | Evidence |
|-------|--------|----------|
| App name appropriate | PASS | "AI Caddy Pro" in app.json |
| Description accurate | PENDING | Not yet in App Store Connect |
| Screenshots match app | PENDING | Screenshots not created |
| App icon correct size | **FAIL** | 192x192 not 1024x1024 |

**Status:** FAIL - Icon size + metadata pending

### Guideline 3.1.2 - Subscriptions
| Check | Status | Evidence |
|-------|--------|----------|
| Subscription terms clear | **PARTIAL** | ToS link missing |
| Auto-renewal explained | PASS | Shown in purchase flow |
| Restore purchases available | PASS | CustomerCenter includes restore |
| Links to policies | **FAIL** | Privacy placeholder, ToS missing |

**Status:** FAIL - Policy links required

### Guideline 5.1 - Privacy
| Check | Status | Evidence |
|-------|--------|----------|
| Privacy policy provided | **FAIL** | Placeholder alert |
| Privacy policy URL in ASC | **FAIL** | Not provided |
| Data collection disclosed | PENDING | Privacy Nutrition Labels needed |
| Permission usage explained | PASS | Info.plist strings present |

**Status:** FAIL - Privacy policy required

---

## Component Status Summary

| Component | Status | P0 Blockers | P1 Issues |
|-----------|--------|-------------|-----------|
| IOS-001 Metadata | BLOCKED | Icon size | - |
| IOS-002 Icons | BLOCKED | Icon size | - |
| IOS-003 Privacy | PASS | - | Permission timing |
| IOS-004 IAP | BLOCKED | Privacy Policy, ToS | - |
| IOS-005 Performance | PASS | - | Sentry |
| IOS-006 Security | PASS | - | - |
| IOS-007 Build | PASS | - | - |
| IOS-008 Accessibility | PASS | - | - |
| **App Store Connect** | BLOCKED | Metadata incomplete | - |

---

## Pre-Submission Checklist

### Phase 1: User-Provided Assets (BLOCKING)

- [ ] **1024x1024 icon.png** - PNG, no transparency, sRGB
- [ ] **Privacy Policy URL** - Hosted, accessible, complete
- [ ] **Terms of Service URL** - Hosted, covers subscriptions
- [ ] **Support URL** - Contact/support page
- [ ] **Marketing URL** - App website/landing page

### Phase 2: App Store Connect Setup (BLOCKING)

- [ ] **App Information**
  - [ ] Subtitle (30 chars max)
  - [ ] Description (4000 chars max)
  - [ ] Keywords (100 chars, comma-separated)
  - [ ] Categories set (Sports, Weather)
  - [ ] Age Rating questionnaire completed

- [ ] **Screenshots**
  - [ ] iPhone 6.9" (1320 x 2868) - 3+ screenshots
  - [ ] iPhone 6.7" (1290 x 2796) - 3+ screenshots
  - [ ] iPhone 6.5" (1242 x 2688) - 3+ screenshots
  - [ ] iPhone 5.5" (1242 x 2208) - 3+ screenshots
  - [ ] iPad Pro 12.9" (2048 x 2732) - if iPad supported
  - [ ] iPad Pro 11" (1668 x 2388) - if iPad supported

- [ ] **URLs**
  - [ ] Privacy Policy URL entered
  - [ ] Support URL entered
  - [ ] Marketing URL entered (optional but recommended)

- [ ] **App Review Information**
  - [ ] Contact name/phone/email
  - [ ] Demo account credentials (if needed)
  - [ ] Notes explaining app for reviewer

- [ ] **Privacy Nutrition Labels**
  - [ ] Data types collected declared
  - [ ] Data usage purposes specified
  - [ ] Third-party data sharing disclosed

### Phase 3: Code Updates

- [ ] Replace `assets/images/icon.png` with 1024x1024 version
- [ ] Update SetupScreen.tsx Privacy Policy:
  ```typescript
  onPress={() => Linking.openURL('https://aicaddypro.com/privacy')}
  ```
- [ ] Add Terms of Service link to SetupScreen.tsx:
  ```typescript
  onPress={() => Linking.openURL('https://aicaddypro.com/terms')}
  ```
- [ ] (Optional) Enable Sentry in production config

### Phase 4: Build & Verify

- [ ] Run production build:
  ```bash
  eas build -p ios --profile production
  ```
- [ ] Install on device via TestFlight
- [ ] Verify all features work
- [ ] Test IAP purchase flow
- [ ] Test restore purchases
- [ ] Verify permission flows
- [ ] Verify Privacy/ToS links open correctly

### Phase 5: Submit

- [ ] Upload build to App Store Connect
- [ ] Select build for submission
- [ ] Review all metadata
- [ ] Submit for review
  ```bash
  eas submit -p ios --profile production
  ```

---

## Verification Evidence Tracker

| Evidence | Required For | Status | Collected |
|----------|--------------|--------|-----------|
| Icon size verification | P0-1 | PENDING | [ ] |
| Privacy Policy URL 200 OK | P0-2 | PENDING | [ ] |
| Privacy Policy screenshot | P0-2 | PENDING | [ ] |
| ToS URL 200 OK | P0-3 | PENDING | [ ] |
| ToS screenshot | P0-3 | PENDING | [ ] |
| App Store Connect metadata screenshot | P0-4 | PENDING | [ ] |
| All screenshots uploaded | P0-4 | PENDING | [ ] |
| TestFlight install success | Build | PENDING | [ ] |
| IAP flow test | Subscription | PENDING | [ ] |
| Restore purchases test | Subscription | PENDING | [ ] |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Icon rejection | HIGH (if not fixed) | Blocks submission | Provide 1024x1024 icon |
| Privacy rejection | HIGH (if not fixed) | Blocks submission | Host privacy policy |
| ToS rejection | HIGH (IAP requires) | Blocks submission | Host terms of service |
| Metadata rejection | MEDIUM | Delays approval | Complete all fields |
| Screenshot issues | LOW | Delays approval | Use correct sizes |
| IAP issues | LOW | May delay approval | Test thoroughly |

---

## Conclusion

**Status: REJECT - 4 P0 blockers must be resolved**

The app code is functionally ready, but App Store submission requires:
1. User-provided assets (icon, policy URLs)
2. Complete App Store Connect metadata
3. Required screenshots for all device sizes

**Estimated Time to Submission Ready:**
- After user provides assets: 1-2 hours for code updates
- App Store Connect setup: 1-2 hours
- TestFlight testing: 1-2 hours
- **Total: 4-6 hours after receiving assets**

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2024-01-13 | Initial audit | iOS pipeline run |
| 2024-01-13 | Upgraded ToS to P0 | GPT review - required for IAP |
| 2024-01-13 | Added App Store Connect metadata P0 | GPT review - missing requirements |
| 2024-01-13 | Added verification evidence tracker | GPT review - need verifiable gates |
| 2024-01-13 | Added screenshot size requirements | GPT review - incomplete checklist |
