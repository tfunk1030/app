# Runbook: App Not Loading

## Symptoms
- App crashes on launch
- White/black screen persists
- Splash screen never dismisses

## Diagnostic Steps

### 1. Check Device Logs

**iOS (Xcode)**
```bash
# View device logs
xcrun simctl spawn booted log stream --predicate 'subsystem == "com.tfunk1030.aicaddypro"'
```

**Android (adb)**
```bash
adb logcat | grep -i "aicaddypro\|ReactNative\|expo"
```

### 2. Verify Metro Connection

```bash
# Check if Metro is running
curl http://localhost:8081/status

# Restart Metro with cache clear
yarn start --clear
```

### 3. Check for JavaScript Errors

1. Open React Native Debugger
2. Look for red box errors
3. Check console for stack traces

## Common Causes & Fixes

### Native Module Crash
**Symptom**: Crash before JS loads
**Fix**:
```bash
# Clean native builds
cd ios && pod install --repo-update && cd ..
cd android && ./gradlew clean && cd ..
```

### Bundle Loading Failure
**Symptom**: "Unable to load script"
**Fix**:
```bash
# Reset Metro cache
yarn start --reset-cache
```

### Environment Variable Missing
**Symptom**: Crash after splash screen
**Fix**:
```bash
# Verify .env.local exists
cat .env.local
# If missing, create from template
cp .env.example .env.local
```

## Escalation

If issue persists after above steps:
1. Create GitHub issue with device logs
2. Tag with `bug` and `P0` labels
3. Include: device model, OS version, app version
