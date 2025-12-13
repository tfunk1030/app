#!/bin/bash
# Setup and verification script for the cache relaunch crash fix

echo "=== AICaddyPro Cache Relaunch Crash Fix Setup ==="
echo "This script will verify that all components are ready to build."

# Check current directory structure
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Verify JS files
echo ""
echo "=== Checking JavaScript files ==="
JS_FILES=(
  "src/modules/NativeErrorBridge.ts"
  "src/utils/cacheManager.ts"
  "src/components/error-boundary/ErrorBoundary.tsx"
  "app/_layout.tsx"
)

JS_FILES_OK=true
for file in "${JS_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file is missing"
    JS_FILES_OK=false
  fi
done

# Verify Swift files
echo ""
echo "=== Checking Swift files ==="
SWIFT_FILES=(
  "ios/NativeErrorModule.swift"
  "ios/NativeErrorModule.m"
  "ios/ErrorRecovery.swift"
  "ios/StartupProcedure.swift"
  "ios/BuildConfig.xcconfig"
  "ios/integrate-files.sh"
)

SWIFT_FILES_OK=true
for file in "${SWIFT_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file is missing"
    SWIFT_FILES_OK=false
  fi
done

# Check dependencies
echo ""
echo "=== Checking dependencies ==="

# Check for AsyncStorage
if grep -q "@react-native-async-storage/async-storage" package.json; then
  echo "✅ AsyncStorage dependency found"
else
  echo "❌ AsyncStorage dependency missing. You may need to run:"
  echo "  npm install @react-native-async-storage/async-storage --save"
fi

# Check for Expo FileSystem
if grep -q "expo-file-system" package.json; then
  echo "✅ expo-file-system dependency found"
else
  echo "❌ expo-file-system dependency missing. You may need to run:"
  echo "  expo install expo-file-system"
fi

# Check for Expo Constants
if grep -q "expo-constants" package.json; then
  echo "✅ expo-constants dependency found"
else
  echo "❌ expo-constants dependency missing. You may need to run:"
  echo "  expo install expo-constants"
fi

# Make integration script executable
echo ""
echo "=== Setting up integration script ==="
if [ -f "ios/integrate-files.sh" ]; then
  chmod +x ios/integrate-files.sh
  echo "✅ Made integration script executable"
else
  echo "❌ Could not set up integration script (file missing)"
fi

# Verify Swift syntax
echo ""
echo "=== Verifying Swift syntax ==="
if command -v xcrun &> /dev/null && command -v swiftc &> /dev/null; then
  # Only do a syntax check, not full compilation
  if [ -f "ios/ErrorRecovery.swift" ]; then
    xcrun swiftc -syntax-only ios/ErrorRecovery.swift 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "✅ ErrorRecovery.swift syntax is valid"
    else
      echo "❌ ErrorRecovery.swift has syntax errors"
    fi
  fi

  if [ -f "ios/StartupProcedure.swift" ]; then
    xcrun swiftc -syntax-only ios/StartupProcedure.swift 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "✅ StartupProcedure.swift syntax is valid"
    else
      echo "❌ StartupProcedure.swift has syntax errors"
    fi
  fi

  if [ -f "ios/NativeErrorModule.swift" ]; then
    xcrun swiftc -syntax-only ios/NativeErrorModule.swift 2>/dev/null
    if [ $? -eq 0 ]; then
      echo "✅ NativeErrorModule.swift syntax is valid"
    else
      echo "❌ NativeErrorModule.swift has syntax errors"
    fi
  fi
else
  echo "⚠️ Swift compiler not available to check syntax"
fi

# Print summary
echo ""
echo "=== Setup Summary ==="
if [ "$JS_FILES_OK" = true ] && [ "$SWIFT_FILES_OK" = true ]; then
  echo "✅ All files present and ready to build"
else
  echo "❌ Some files are missing, review the output above"
fi

# Print next steps
echo ""
echo "=== Next Steps ==="
echo "1. Navigate to the iOS directory:"
echo "   cd ios"
echo ""
echo "2. Run the integration script to add files to XCode project:"
echo "   ./integrate-files.sh"
echo ""
echo "3. Open the XCode project and build:"
echo "   xed ."
echo ""
echo "4. Test the fix by:"
echo "   a) Building and running in debug mode to ensure it works"
echo "   b) Creating corrupted cache data to verify recovery"
echo "   c) Testing on different iOS versions"
echo ""
echo "For more details, refer to docs/CACHE_RELAUNCH_FIX.md"
