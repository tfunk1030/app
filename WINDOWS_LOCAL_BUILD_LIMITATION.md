# Windows Local Build Limitation

## Issue

Local Android builds on Windows may fail with `react-native-worklets` prefab command errors:

```
Process 'command 'C:\dev\aicaddypro\node_modules\react-native-worklets\android\build\intermediates\cxx\Debug\1v152c42\logs\x86_64\prefab_command.bat'' finished with non-zero exit value 2
```

## Status

✅ **EAS builds work perfectly** - This is only a local Windows build issue
✅ **Code is correct** - The EAS build succeeded, confirming the setup is valid
⚠️ **Local Windows builds** - May fail due to Windows-specific prefab tool issues

## Why This Happens

`react-native-worklets` is a peer dependency of `react-native-reanimated` that requires native C++ compilation. The Android Gradle Plugin uses the "prefab" tool to generate native library configurations, and on Windows, this can sometimes fail due to:

- Path length limitations on Windows
- Prefab command script execution issues
- NDK/CMake path resolution problems

## Solutions

### Option 1: Use EAS Build (Recommended)

Since EAS builds work perfectly, use them for testing:

```bash
eas build --platform android --profile development
```

### Option 2: Build for Specific Architectures

Limit the build to fewer architectures to reduce prefab command executions:

```bash
cd android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Or edit `android/gradle.properties`:

```properties
# Build only for arm64-v8a (most common architecture)
reactNativeArchitectures=arm64-v8a
```

### Option 3: Clean and Rebuild

Sometimes cleaning the build cache helps:

```bash
cd android
./gradlew clean
./gradlew :app:assembleDebug
```

### Option 4: Use WSL2

If you need reliable local builds on Windows, consider using WSL2 (Windows Subsystem for Linux) where the build environment is more stable.

## Verification

To verify your setup is correct, check that EAS builds succeed:

```bash
eas build --platform android --profile development
```

If EAS builds work, your configuration is correct and this is purely a local Windows environment limitation.

## Related

- `react-native-worklets` is required by `react-native-reanimated`
- This is a known issue with prefab on Windows
- EAS build servers use Linux, which doesn't have this issue

