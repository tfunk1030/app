# IDE Gradle Sync Error Fix

## Issue

The IDE may show this error:
```
Could not find com.facebook.react:react-native-gradle-plugin:.
Required by:
    root project : > project :expo-dev-launcher-gradle-plugin
    root project : > project :expo-module-gradle-plugin
    root project : > project :expo-updates-gradle-plugin
```

## Cause

This is typically an IDE Gradle sync cache issue. The actual build works fine because:
1. The local Maven repository is set up correctly
2. All patches are applied
3. The Expo plugins specify the correct version (0.81.5)

## Solution

### Option 1: Refresh Gradle Project (Recommended)

**VS Code / Cursor:**
1. Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run: `Java: Clean Java Language Server Workspace`
3. Reload the window
4. The Gradle sync should refresh automatically

**Android Studio:**
1. Click "Sync Project with Gradle Files" button (elephant icon)
2. Or: File → Sync Project with Gradle Files
3. If that doesn't work: File → Invalidate Caches → Invalidate and Restart

### Option 2: Manual Gradle Sync

Run from the project root:
```bash
cd android
./gradlew --refresh-dependencies
```

### Option 3: Verify Setup

Ensure the local Maven repository is set up:
```bash
yarn setup:maven
```

Then verify it exists:
```bash
ls -la android/local-maven-repo/com/facebook/react/react-native-gradle-plugin/
```

You should see directories for versions like `0.81.5` and `0.79.6`.

## Verification

The build actually works despite the IDE error. To verify:
```bash
cd android
./gradlew tasks
```

If this succeeds, the setup is correct and it's just an IDE cache issue.

## Note

This error is cosmetic and doesn't affect actual builds. The IDE's Gradle sync sometimes doesn't recognize the local Maven repository until it's refreshed.

