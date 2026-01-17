# Ralph iOS App Store Readiness Pipeline

## Mission

Prepare AICaddyPro for iOS App Store submission by systematically auditing and fixing all requirements for a successful first-time approval.

## Pipeline Structure

Each user story (IOS-001 through IOS-008) follows this 3-phase process:

### Phase 1: Audit
- Read all relevant files for the component
- Check against App Store Review Guidelines
- Document findings with PASS/FAIL for each requirement
- Identify P0 (blocking), P1 (should fix), P2 (nice to have) issues

### Phase 2: Implementation
- Fix all P0 and P1 issues
- Document all changes made
- Preserve existing functionality

### Phase 3: Verification
- Re-audit after changes
- Confirm all blocking issues resolved
- Update prd.json with pass/fail status

## iOS App Store Expertise Areas

### App Store Review Guidelines (Key Sections)

**1. Safety**
- 1.1 Objectionable Content - App must not include offensive material
- 1.2 User Generated Content - Moderation if applicable
- 1.3 Kids Category - Extra restrictions if targeting children

**2. Performance**
- 2.1 App Completeness - No crashes, placeholders, or test data
- 2.3 Accurate Metadata - Screenshots match actual app
- 2.4 Hardware Compatibility - Works on all supported devices
- 2.5 Software Requirements - Uses current iOS SDK

**3. Business**
- 3.1 Payments - In-app purchases for digital goods/subscriptions
- 3.1.1 In-App Purchase - Clear pricing, restore purchases
- 3.1.2 Subscriptions - Clear terms, easy cancellation

**4. Design**
- 4.0 Design - Follow Human Interface Guidelines
- 4.2 Minimum Functionality - Must provide lasting value
- 4.3 Spam - No duplicate apps

**5. Legal**
- 5.1 Privacy - Clear data collection disclosure
- 5.1.1 Data Collection - Privacy nutrition labels
- 5.1.2 Data Use - How data is used/shared
- 5.2 Intellectual Property - No trademark violations

### Required Info.plist Keys (iOS)

```xml
<!-- Location (if used) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>AICaddy uses your location to provide accurate weather conditions and elevation data for shot calculations.</string>

<!-- Motion/Compass (if used) -->
<key>NSMotionUsageDescription</key>
<string>AICaddy uses motion sensors to determine wind direction relative to your shot.</string>

<!-- Camera (if used) -->
<key>NSCameraUsageDescription</key>
<string>AICaddy uses your camera to scan course markers.</string>

<!-- App Tracking (if IDFA used) -->
<key>NSUserTrackingUsageDescription</key>
<string>AICaddy uses this to provide personalized recommendations.</string>
```

### App Store Connect Checklist

1. **App Information**
   - [ ] App name (30 chars max)
   - [ ] Subtitle (30 chars max)
   - [ ] Primary category: Sports
   - [ ] Secondary category: Weather
   - [ ] Content rights declaration
   - [ ] Age rating questionnaire completed

2. **Version Information**
   - [ ] Description (4000 chars max)
   - [ ] Keywords (100 chars max, comma-separated)
   - [ ] Support URL
   - [ ] Marketing URL (optional)
   - [ ] Privacy Policy URL

3. **App Review Information**
   - [ ] Contact info for reviewer
   - [ ] Demo account (if login required)
   - [ ] Notes for reviewer

4. **Screenshots**
   - [ ] 6.7" iPhone (1290 x 2796)
   - [ ] 6.5" iPhone (1284 x 2778 or 1242 x 2688)
   - [ ] 5.5" iPhone (1242 x 2208)
   - [ ] iPad Pro 12.9" (2048 x 2732)

5. **In-App Purchases**
   - [ ] Products created and approved
   - [ ] Pricing set correctly
   - [ ] Localized descriptions

## Quality Gates

### P0 - Submission Blockers
- App crashes on launch
- Missing privacy descriptions
- Hardcoded test data visible
- Broken in-app purchases
- Missing required icons
- Invalid bundle identifier

### P1 - Likely Rejection
- Incomplete features (placeholders)
- Screenshots don't match app
- Subscription terms unclear
- Privacy policy link broken
- Poor performance (slow launch)

### P2 - Polish Items
- Optimization opportunities
- Minor UI inconsistencies
- Enhanced accessibility
- Analytics improvements

## Output Format

Each phase should produce a markdown file in `reviews/`:

```
IOS-{number}-audit.md      # Initial findings
IOS-{number}-changes.md    # Implementation details
IOS-{number}-verify.md     # Final verification
```

## Success Criteria

Pipeline complete when:
1. All IOS-001 through IOS-008 pass their audits
2. IOS-GLOBAL compliance check passes
3. No P0 or P1 issues remaining
4. App successfully builds for App Store distribution
5. Ready for TestFlight submission

## Common Rejection Reasons (Avoid These)

1. **Crashes** - Test thoroughly on real devices
2. **Placeholder Content** - Remove all "Lorem ipsum", TODO comments
3. **Broken Links** - Privacy policy, terms of service
4. **Guideline 4.2** - App must have real functionality, not just a website wrapper
5. **IAP Issues** - Restore purchases must work
6. **Privacy** - Must accurately describe data collection
7. **Metadata Mismatch** - Screenshots must show real app
8. **Incomplete** - All advertised features must work
