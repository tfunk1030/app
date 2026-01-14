# Ralph iOS App Store Readiness Pipeline

Automated multi-agent review pipeline to prepare AICaddyPro for iOS App Store submission.

## Overview

This pipeline systematically audits and fixes all requirements for a successful App Store submission, covering:

| ID | Component | Focus |
|----|-----------|-------|
| IOS-001 | App Store Metadata | Title, description, keywords, screenshots |
| IOS-002 | Icons & Launch Screen | App icons, splash screen compliance |
| IOS-003 | Privacy & Permissions | Info.plist, ATT, privacy labels |
| IOS-004 | In-App Purchases | RevenueCat, subscriptions, restore |
| IOS-005 | Performance & Stability | Launch time, memory, crash handling |
| IOS-006 | Security & Compliance | ATS, data encryption, GDPR |
| IOS-007 | Build & Distribution | EAS, certificates, provisioning |
| IOS-008 | Accessibility | VoiceOver, Dynamic Type, contrast |
| IOS-GLOBAL | Review Guidelines | Final compliance verification |

## Usage

```bash
# Start the iOS readiness pipeline
cd scripts/ralph/ios-pipeline
./run-ios-pipeline.sh

# Or with Claude Code
claude "Run the iOS App Store readiness pipeline from scripts/ralph/ios-pipeline/prd.json"
```

## Pipeline Phases

Each component goes through 3 phases:

1. **Audit** - Review current state against requirements
2. **Implementation** - Fix identified issues
3. **Verification** - Confirm fixes and pass/fail status

## Priority Levels

- **P0 (Blocker)** - Will definitely cause rejection
- **P1 (High)** - Likely to cause rejection
- **P2 (Medium)** - Should fix for quality
- **P3 (Low)** - Nice to have improvements

## Success Criteria

- All IOS-001 through IOS-008 pass verification
- IOS-GLOBAL compliance check passes
- No P0 or P1 issues remaining
- App builds successfully for distribution
- Ready for TestFlight upload

## Review Documentation

All audit findings and changes are documented in `reviews/`:

```
reviews/
  IOS-001-audit.md
  IOS-001-changes.md
  IOS-001-verify.md
  ...
  IOS-GLOBAL-checklist.md
```

## Key Resources

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
