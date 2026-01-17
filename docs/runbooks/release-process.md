# Runbook: Release Process

## Pre-Release Checklist

### Code Quality
- [ ] All tests passing (`yarn test:ci`)
- [ ] No lint errors (`yarn lint`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Code formatted (`yarn format:check`)

### Version Update
- [ ] Update version in `app.json`
- [ ] Update `buildNumber` (iOS) / `versionCode` (Android)
- [ ] Update CHANGELOG.md with release notes

### Testing
- [ ] Manual testing on iOS device
- [ ] Manual testing on Android device
- [ ] Premium features verified
- [ ] Offline mode tested

## Build Process

### 1. Create Production Build

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### 2. Submit to Stores

```bash
# iOS - Submit to App Store Connect
eas submit --platform ios

# Android - Submit to Google Play
eas submit --platform android
```

## App Store Submission

### iOS (App Store Connect)

1. Build uploads automatically via EAS Submit
2. Go to [App Store Connect](https://appstoreconnect.apple.com/)
3. Select the build
4. Complete app metadata:
   - Screenshots (6.5", 5.5" required)
   - Description, keywords
   - Privacy policy URL
   - Support URL
5. Submit for review

### Android (Google Play)

1. Build uploads automatically via EAS Submit
2. Go to [Google Play Console](https://play.google.com/console/)
3. Create new release in Production track
4. Complete store listing:
   - Feature graphic
   - Screenshots
   - Description
5. Submit for review

## Post-Release

### Monitoring

- [ ] Check crash reports (Sentry/Crashlytics)
- [ ] Monitor app store reviews
- [ ] Watch for support tickets

### Rollback (if needed)

**iOS**: Contact Apple to expedite review of hotfix
**Android**: Use staged rollout, halt if issues detected

```bash
# Quick hotfix build
eas build --profile production --platform all --message "Hotfix: [description]"
```

## Version Numbering

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes, major features
- **MINOR**: New features, enhancements
- **PATCH**: Bug fixes, small improvements

Example: `1.2.3`
- iOS buildNumber: `1.2.3` → `1.2.4`
- Android versionCode: `10203` → `10204`

## Timeline

| Phase | Duration |
|-------|----------|
| Code freeze | 1 day before |
| Build & test | 1 day |
| iOS review | 1-3 days |
| Android review | 1-3 hours |
| Staged rollout | 3-7 days |
