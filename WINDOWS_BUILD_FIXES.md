# Windows Build Fixes

## Overview

This document describes the Windows-specific fixes applied to resolve Android build issues on Windows.

## Problem

Multiple Gradle tasks were failing on Windows with the error:
```
Error: Expected cmd.exe to be one of: zsh, bash, powershell
Process 'command 'cmd'' finished with non-zero exit value 2
```

## Root Cause

Several packages were wrapping Node.js commands with `cmd /c` on Windows, which caused issues when the scripts expected Unix shells (bash, zsh, or PowerShell) but received `cmd.exe` instead.

## Solutions Applied

### 1. expo-modules-autolinking

**File**: `node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin-shared/src/main/kotlin/expo/modules/plugin/Os.kt`

**Fix**: Removed the `cmd /c` wrapper from `windowsAwareCommandLine` function.

**Patch**: `patches/expo-modules-autolinking+3.0.23.patch`

### 2. expo-constants

**File**: `node_modules/expo-constants/scripts/get-app-config-android.gradle`

**Fix**: Removed the Windows-specific `cmd /c` wrapper, allowing Node.js to execute `.js` files directly.

**Patch**: `patches/expo-constants+18.0.12.patch`

### 3. expo-updates

**File**: `node_modules/expo-updates/expo-updates-gradle-plugin/src/main/kotlin/expo/modules/updates/ExpoUpdatesPlugin.kt`

**Fix**: Removed `cmd /c` wrappers from both `createUpdatesResources` task and `getExpoUpdatesPackageDir` function.

**Patch**: `patches/expo-updates+29.0.15.patch`

### 4. @react-native/gradle-plugin

**File**: `node_modules/@react-native/gradle-plugin/shared/src/main/kotlin/com/facebook/react/utils/TaskUtils.kt`

**Fix**: Removed the `cmd /c` wrapper from `windowsAwareCommandLine` function. This fixes codegen tasks for all React Native packages (e.g., `react-native-async-storage`).

**Automation**: The fix is automatically applied via `scripts/fix-rn-gradle-plugin.js` which runs during `yarn install` (via the `postinstall` script). The plugin is then rebuilt to ensure the changes take effect.

## How Patches Work

All patches (except the React Native Gradle plugin) are automatically applied when you run:
```bash
yarn install
```

This is configured via the `postinstall` script in `package.json`:
```json
"postinstall": "npx patch-package"
```

## Verification

To verify all fixes are working, run:
```bash
cd android
./gradlew assembleDebug
```

All tasks should complete without `cmd.exe` errors.

## Future Considerations

These fixes are workarounds for Windows compatibility issues. Consider:
1. Reporting these issues to the respective package maintainers
2. Using WSL2 for Android builds if these issues persist
3. Monitoring for upstream fixes in future package versions

