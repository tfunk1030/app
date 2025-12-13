# Android Build Issue - React Native Gradle Plugin Dependency

## ✅ RESOLVED

This issue has been resolved by:

1. Upgrading to **Expo SDK 54**
2. Creating a local Maven repository for the React Native Gradle plugin
3. Patching Expo plugins to use the local Maven repository
4. Building and publishing the React Native Gradle plugin JAR to the local repository

## Problem (Original)

The Android build failed with:

```
Could not find com.facebook.react:react-native-gradle-plugin:.
Required by:
    root project : > project :expo-dev-launcher-gradle-plugin
    root project : > project :expo-module-gradle-plugin
    root project : > project :expo-updates-gradle-plugin
```

## Root Cause

This was a compatibility issue between **Expo SDK 53/54** and **React Native 0.79**. The Expo Gradle plugins require `com.facebook.react:react-native-gradle-plugin` as a compile-time dependency, but in React Native 0.79, this plugin is only available as an **included build** (via `includeBuild` in `settings.gradle`).

Gradle's included builds have a limitation: **included builds cannot resolve dependencies from other included builds during their own compilation phase**. This means when the Expo plugins are being compiled, they can't access the React Native Gradle plugin from the included build.

## What We've Fixed

✅ **Expo autolinking Windows issue** - Fixed the `cmd /c` wrapper problem by patching `expo-modules-autolinking`
✅ **Added patch-package** - Created patches that will be applied automatically on `yarn install`
✅ **Fixed Gradle plugin versions** - Added proper versions for Android Gradle Plugin and Kotlin

## Workarounds Attempted

1. ❌ Dependency substitution in `settings.gradle` - Doesn't work for buildscript classpath
2. ❌ Adding React Native Gradle plugin to buildscript classpath - Can't resolve from included build
3. ❌ Publishing to mavenLocal - React Native Gradle plugin doesn't have publish task configured
4. ❌ Using flatDir repository - Expo plugins compile before React Native plugin is built

## Solution Implemented

### Local Maven Repository Workaround

We've implemented a workaround that:

1. Builds the React Native Gradle plugin JAR
2. Publishes it to a local Maven repository (`android/local-maven-repo`)
3. Patches Expo plugins to use this local repository
4. Automatically applies patches via `patch-package`

### Setup

The local Maven repository is set up automatically when you:

1. Run `yarn install` (patches are applied)
2. Build the React Native Gradle plugin: `yarn setup:maven`

Or manually run:

- **Windows**: `android\setup-local-maven-repo.bat`
- **Unix/Mac**: `bash android/setup-local-maven-repo.sh`

### Files Created/Modified

**Patches** (automatically applied on `yarn install`):

- `patches/expo-modules-autolinking+3.0.23.patch` - Fixes Windows cmd/c issue
- `patches/expo-constants+18.0.12.patch` - Fixes Windows cmd/c issue
- `patches/expo-updates+29.0.15.patch` - Fixes Windows cmd/c issue and adds local Maven repo
- `patches/expo-dev-launcher+6.0.20.patch` - Adds local Maven repo
- `patches/expo-modules-core+3.0.29.patch` - Adds local Maven repo

**Additional Windows Fixes**:

All Windows `cmd /c` issues have been resolved by patching the following packages:

- `expo-modules-autolinking` - Autolinking command execution (patched via patch-package)
- `expo-constants` - App config generation (patched via patch-package)
- `expo-updates` - Updates resources generation (patched via patch-package)
- `@react-native/gradle-plugin` - Codegen schema generation (source modified directly, changes persist as it's an included build)

**Local Maven Repository**:

- `android/local-maven-repo/com/facebook/react/react-native-gradle-plugin/0.79.6/`
  - `react-native-gradle-plugin-0.79.6.jar`
  - `react-native-gradle-plugin-0.79.6.pom`

## Current Status

- ✅ Expo autolinking works (patched for Windows)
- ✅ React Native autolinking works
- ✅ Expo Gradle plugins can compile (using local Maven repository)
- ✅ Android build configuration successful
- ✅ expo-constants command execution fixed (Windows cmd/c issue)
- ✅ React Native codegen tasks fixed (Windows cmd/c issue)
- ✅ expo-updates command execution fixed (Windows cmd/c issue)
- ✅ Android Gradle Plugin updated to 8.6.1 (resolves dependency compatibility)
- ✅ Kotlin updated to 2.1.20 (resolves KSP compatibility warnings)
- ✅ Automated fix script for React Native Gradle plugin (runs on postinstall)

## Files Modified

- `package.json` - Added patch-package, postinstall script, and setup:maven script
- `android/build.gradle` - Updated Android Gradle Plugin to 8.6.1, Kotlin to 2.1.20, added local Maven repository
- `scripts/fix-rn-gradle-plugin.js` - Automated script to fix React Native Gradle plugin Windows issue
- `android/settings.gradle` - Configured included builds
- `android/gradle.properties` - Added suppressUnsupportedCompileSdk property
- `node_modules/@react-native/gradle-plugin/shared/src/main/kotlin/com/facebook/react/utils/TaskUtils.kt` - Removed cmd/c wrapper for Windows

## Next Steps

1. Report this issue to Expo team: https://github.com/expo/expo/issues
2. Check if Expo SDK 54 resolves this issue
3. Consider using Expo's Prebuild workflow if applicable
