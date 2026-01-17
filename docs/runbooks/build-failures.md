# Runbook: Build Failures

## Symptoms
- EAS build fails
- Local build crashes
- Gradle/CocoaPods errors

## Diagnostic Steps

### 1. Check EAS Build Logs

```bash
# View recent builds
eas build:list

# View specific build logs
eas build:view [build-id]
```

### 2. Local Build Test

```bash
# iOS
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

## Common Issues & Fixes

### iOS: CocoaPods Issues

**Symptom**: "Pod install failed"

```bash
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install --repo-update
cd ..
```

### Android: Gradle Issues

**Symptom**: "Could not resolve dependencies"

```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
cd ..
```

### Metro Bundler Cache

**Symptom**: "Unable to resolve module"

```bash
# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo
yarn cache clean
yarn install
yarn start --clear
```

### Native Module Version Mismatch

**Symptom**: "Native module cannot be null"

```bash
# Align native dependencies with Expo SDK
npx expo install --fix
```

### EAS Build: Environment Variables

**Symptom**: "API key undefined" in production build

```bash
# List EAS env vars
eas env:list

# Update if missing
eas env:create --scope project --name EXPO_PUBLIC_TOMORROW_API_KEY --value "xxx"
```

## Build Profiles

| Profile | Use Case |
|---------|----------|
| development | Local testing with dev client |
| preview | Internal testing (TestFlight/Internal) |
| production | App Store submission |

```bash
# Build with specific profile
eas build --profile preview --platform ios
```

## Pre-Build Checklist

1. [ ] `npx expo-doctor` passes
2. [ ] `yarn lint` has no errors
3. [ ] `yarn test` passes
4. [ ] Version bumped in `app.json`
5. [ ] CHANGELOG.md updated
6. [ ] All env vars set in EAS

## Escalation

For persistent build issues:
1. Check [Expo Forums](https://forums.expo.dev/)
2. Search [GitHub Issues](https://github.com/expo/expo/issues)
3. Create issue with full build logs
