import { useTokens } from '@/src/theme/useTokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import nativeErrorBridge from '../../modules/NativeErrorBridge';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * A React Error Boundary component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private nativeErrorUnsubscribe?: () => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  componentDidMount() {
    // Add listener for native errors
    this.nativeErrorUnsubscribe = nativeErrorBridge.addListener(event => {
      if (!this.state.hasError) {
        // Only update state if we're not already in an error state
        this.setState({
          hasError: true,
          error: new Error(
            `Native error: ${event.type} - ${event.details.message || 'Unknown error'}`
          ),
        });

        console.error('Native error caught by ErrorBoundary:', event);

        // Try to recover by clearing cache
        this.clearProblemCache().catch(error => {
          console.error('Failed to clear cache after native error:', error);
        });
      }
    });
  }

  componentWillUnmount() {
    // Clean up listener
    if (this.nativeErrorUnsubscribe) {
      this.nativeErrorUnsubscribe();
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to the console
    console.error('Error caught by error boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Try to clear any problematic cache that might be causing the error
    this.clearProblemCache().catch(cacheError => {
      console.error('Failed to clear problem cache:', cacheError);
    });
  }

  /**
   * Clear any cache that might be causing the error
   */
  async clearProblemCache(): Promise<void> {
    try {
      // Clear AsyncStorage cache
      await AsyncStorage.removeItem('app-cache-data');

      // Also clear other related cache items
      const cachesToClear = ['app-state', 'user-preferences', 'last-sync-state'];

      for (const cacheKey of cachesToClear) {
        try {
          await AsyncStorage.removeItem(cacheKey);
        } catch (e) {
          console.warn(`Failed to clear cache item ${cacheKey}:`, e);
        }
      }

      // Clear file system cache if it exists
      if (FileSystem.documentDirectory) {
        const cachePath = FileSystem.documentDirectory + 'app-cache/';
        try {
          const dirInfo = await FileSystem.getInfoAsync(cachePath);
          if (dirInfo.exists) {
            await FileSystem.deleteAsync(cachePath, { idempotent: true });
            console.log('Successfully cleared file system cache directory');
          }
        } catch (fsError) {
          console.warn('Error clearing file system cache:', fsError);
        }
      }

      console.log('Successfully cleared all problem cache');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Reset the error state to allow the component to try rendering again
   */
  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback component is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      // Otherwise, use the default fallback UI
      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Default fallback UI to display when an error is caught
 */
export function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const t = useTokens();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: t.colors.textPrimary }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: t.colors.textMuted }]}>
          {"The app encountered an unexpected error. We've logged the issue and are working to fix it."}
        </Text>
        <Text
          style={[
            styles.errorDetails,
            { backgroundColor: t.colors.surfaceAlt, color: t.colors.danger },
          ]}
        >
          {error.message}
        </Text>
        <Pressable
          style={[styles.button, { backgroundColor: t.colors.brand }]}
          onPress={resetError}
        >
          <Text style={[styles.buttonText, { color: t.colors.textPrimary }]}>Try Again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDetails: {
    fontSize: 14,
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
