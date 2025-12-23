import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { LogBox, Platform, Text as RNText } from 'react-native';
import 'react-native-reanimated';
import SegmentedCacheManager from '../src/utils/SegmentedCacheManager';
import CacheManager from '../src/utils/cacheManager';
import { runCacheValidation } from '@/src/startup/cacheValidation';

// TypeScript doesn't know about React Native's global ErrorUtils
const globalAny = global as any;
const ErrorUtils = globalAny.ErrorUtils || {};

import { useColorScheme } from '@/components/useColorScheme';

// Import our consolidated AppProvider
import { AppProvider } from '@/src/core/context/AppProvider';
import { AppThemeProvider } from '@/src/theme/ThemeProvider';

// Import onboarding components for first-run experience
import { OnboardingFlow, hasCompletedOnboarding } from '@/src/components/onboarding/OnboardingFlow';

// Import the bridge since it's needed for native error events
// Import our new cross-platform error bridge
import errorBridge from '../src/modules/CrossPlatformErrorBridge';

// Global error handler to prevent crashes in production
const errorHandler = (error: Error, isFatal?: boolean) => {
  console.error('Global error caught:', error);

  // Check if this is a cache relaunch error
  const isCacheRelaunchError =
    error.message?.includes('tryRelaunchFromCache') ||
    error.stack?.includes('ErrorRecovery.tryRelaunchFromCache') ||
    error.stack?.includes('ErrorRecovery.runNextTask') ||
    error.message?.includes('cache') ||
    error.message?.includes('Cache');

  if (isCacheRelaunchError) {
    console.error('Cache relaunch error detected and prevented from crashing the app');

    // Use our CacheManager for better error recovery
    try {
      // Try to backup cache before clearing (if it's not already corrupted)
      CacheManager.backupCache().catch(e =>
        console.warn('Failed to backup cache before clearing:', e)
      );

      // Clear the problematic cache data
      CacheManager.clearCache().catch(e => console.error('Failed to clear app cache:', e));

      // Also clear file system cache if possible
      if (FileSystem.documentDirectory) {
        const cachePath = FileSystem.documentDirectory + 'app-cache/';
        FileSystem.deleteAsync(cachePath, { idempotent: true }).catch(e =>
          console.error('Failed to clear document directory cache:', e)
        );
      }
    } catch (clearError) {
      console.error('Error while trying to clear cache:', clearError);
    }

    // Never crash for cache errors in production
    if (!__DEV__) {
      LogBox.ignoreLogs(['Unhandled JS Exception']);
      return;
    }
  }

  // Handle other errors
  if (__DEV__ && isFatal) {
    // In development, show the error
    console.error('Fatal error in development mode:', error);
  } else if (isFatal) {
    // In production, log but don't crash
    console.error('Fatal error prevented in production:', error);
    // Ignore the unhandled exception to prevent app crash
    LogBox.ignoreLogs(['Unhandled JS Exception']);
  }

  // If in development mode, simulate a native error for testing purposes
  if (__DEV__ && isCacheRelaunchError) {
    console.log('DEV: Simulating native error event for testing');
    errorBridge.simulateNativeError('errorRecoveryFailure', {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    });
  }
};

// Set up global error handler safely
if (globalAny.ErrorUtils) {
  globalAny.ErrorUtils.setGlobalHandler(errorHandler);
} else if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === 'function') {
  ErrorUtils.setGlobalHandler(errorHandler);
} else {
  console.warn('ErrorUtils not available, global error handler not set');

  // As a fallback, use the standard global error handler
  const originalErrorHandler = global.onerror;
  global.onerror = function (message, source, lineno, colno, error) {
    // Make sure we create Error from a string, not an Event object
    const errorMsg = typeof message === 'string' ? message : 'Unknown error';
    errorHandler(error || new Error(errorMsg), true);
    return originalErrorHandler
      ? originalErrorHandler(message, source, lineno, colno, error)
      : true;
  };
}

// Patch the ErrorRecovery.crash method if possible
try {
  // This is a best-effort attempt to override the native method
  // It may not work in all cases due to the compiled nature of the app
  const globalAny = global as any;
  if (globalAny.ErrorRecovery && typeof globalAny.ErrorRecovery.crash === 'function') {
    const originalCrash = globalAny.ErrorRecovery.crash;
    globalAny.ErrorRecovery.crash = function () {
      if (__DEV__) {
        console.error('ErrorRecovery.crash called in development mode');
        return originalCrash.apply(this, arguments);
      } else {
        console.error('ErrorRecovery.crash prevented in production mode');
        // Don't call the original method in production
        return undefined;
      }
    };
    console.log('Successfully patched ErrorRecovery.crash method');
  }
} catch (patchError) {
  console.error('Failed to patch ErrorRecovery.crash method:', patchError);
}

// Import our custom ErrorBoundary instead of using the one from expo-router
import { ErrorBoundary } from '../src/components/error-boundary';

// Re-export for use in other components
export { ErrorBoundary };

// Define the RootLayoutNav component before using it in the default export
const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Check if onboarding has been completed on first launch
  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const completed = await hasCompletedOnboarding();
        if (!completed) {
          setShowOnboarding(true);
        }
      } catch (error) {
        // If there's an error checking, don't show onboarding to avoid blocking
        console.error('Error checking onboarding status:', error);
      } finally {
        setOnboardingChecked(true);
      }
    }

    checkOnboardingStatus();
  }, []);

  // Check and request permissions on mount
  useEffect(() => {
    async function checkAndRequestPermissions() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status !== 'granted') {
          // Request permission if not already granted
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          setPermissionGranted(newStatus === 'granted');
        } else {
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error('Error checking or requesting location permissions:', error);
        setPermissionGranted(false);
      }
    }

    checkAndRequestPermissions();
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    // Wrap with theme + app providers
    <AppThemeProvider>
      <AppProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            {/*
            Removed non-existent routes that were causing warnings:
            - "home"
            - "shot"
            - "wind"
            - "settings"

            If these screens are needed, create the corresponding files:
            - aicaddypro/app/home.tsx
            - aicaddypro/app/shot.tsx
            - aicaddypro/app/wind.tsx
            - aicaddypro/app/settings.tsx
          */}
          </Stack>
          {/* Onboarding flow - shows on first app launch only */}
          {onboardingChecked && (
            <OnboardingFlow
              visible={showOnboarding}
              onComplete={handleOnboardingComplete}
            />
          )}
        </ThemeProvider>
      </AppProvider>
    </AppThemeProvider>
  );
};

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Use system fonts; remove platform-specific requires to avoid missing asset errors
    ...FontAwesome.font,
  });

  // Set global default font family (non-breaking, keeps per-Text overrides)
  useEffect(() => {
    const family = Platform.select({ ios: 'System', android: 'System' });
    if (family) {
      // @ts-ignore: defaultProps exists at runtime on RN Text
      RNText.defaultProps = RNText.defaultProps || {};
      // @ts-ignore
      RNText.defaultProps.style = [RNText.defaultProps.style || {}, { fontFamily: family }];
    }
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  // Add enhanced cache validation effect using startup helper
  useEffect(() => {
    runCacheValidation().catch((err: unknown) => console.error('Cache validation failed', err));
  }, []);

  useEffect(() => {
    // Handle notifications when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      // Handle the notification
    });

    // Handle notification interactions when app is in background
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        const { notification } = response;
        console.log('Notification interaction:', notification);

        // Navigate or perform actions based on notification
        // Example: if (notification.request.content.data.screen) { router.push(notification.request.content.data.screen); }
      }
    );

    return () => {
      foregroundSubscription.remove();
      backgroundSubscription.remove();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <RootLayoutNav />
    </ErrorBoundary>
  );
}

async function registerForPushNotifications() {
  try {
    // Check for existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If no existing permission, request it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission not granted, exit
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token: permission not granted');
      return;
    }

    // Get push token
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: '22d97181-5980-4d2c-ab9f-58036e334d0d', // Use your Expo project ID
      })
    ).data;

    // Save token for later use
    await AsyncStorage.setItem('pushToken', token);
    console.log('Push token:', token);

    // Configure badge count behavior on iOS
    if (Platform.OS === 'ios') {
      Notifications.setBadgeCountAsync(0);
    }
  } catch (error) {
    console.error('Error registering for push notifications:', error);
  }
}

// RootLayoutNav has been moved above before the default export
