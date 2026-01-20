/**
 * DiagnosticOverlay.tsx
 *
 * A diagnostic overlay component that displays real-time logs, sensor status,
 * and other diagnostic information to help troubleshoot issues in production.
 *
 * Part of the Enhanced Diagnostics Pattern implementation.
 */

import { useWindData } from '@/src/components/diagnostics/DiagnosticOverlayAdapter';
import { darkTokens as tokens } from '@/src/theme/tokens';
import { FeatureFlags } from '@/src/utils/FeatureFlags';
import { LogManager } from '@/src/utils/LogManager';
import { scaledFontSize } from '@/src/utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Tab options for the diagnostic overlay
type DiagnosticTab = 'logs' | 'sensors' | 'state' | 'flags' | 'transitions' | 'cache';

interface DiagnosticOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * DiagnosticOverlay component displays real-time diagnostic information
 * when enabled via the DIAGNOSTIC_MODE or ALLOW_DEBUG_OVERLAY feature flags.
 */
export const DiagnosticOverlay: React.FC<DiagnosticOverlayProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<DiagnosticTab>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [sensorStatus, setSensorStatus] = useState<Record<string, any>>({});
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [sessionId, setSessionId] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [stateTransitions, setStateTransitions] = useState<any[]>([]);

  // Get wind data for state transitions
  const windData = useWindData();

  // Load state transitions from WindData provider
  const loadStateTransitions = useCallback(async () => {
    try {
      if (windData && windData.getStateTransitions) {
        const transitions = await windData.getStateTransitions();
        setStateTransitions(transitions);
      }
    } catch (error) {
      console.error('Failed to load state transitions:', error);
    }
  }, [windData]);

  // Load logs and other diagnostic data
  const loadDiagnosticData = useCallback(async () => {
    // Get logs from LogManager
    const currentLogs = LogManager.getLogs();
    setLogs(currentLogs.slice(-100)); // Show only the most recent 100 logs

    // Get current session ID
    setSessionId(LogManager.getCurrentSessionId());

    // Get feature flags
    setFeatureFlags(FeatureFlags.getAllFeatures());

    // Get sensor status from AsyncStorage
    try {
      const storedSensorStatus = await AsyncStorage.getItem('sensor_status');
      if (storedSensorStatus) {
        setSensorStatus(JSON.parse(storedSensorStatus));
      }
    } catch (error) {
      console.error('Failed to load sensor status:', error);
    }

    // Load state transitions
    await loadStateTransitions();
  }, [loadStateTransitions]);

  // Refresh data periodically
  useEffect(() => {
    if (!isVisible) return;

    // Initial load
    loadDiagnosticData();

    // Set up refresh interval
    const refreshInterval = setInterval(() => {
      loadDiagnosticData();
    }, 2000); // Refresh every 2 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isVisible, loadDiagnosticData]);

  // Toggle expanded/collapsed state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Clear logs
  const clearLogs = async () => {
    LogManager.clearLogs();
    await LogManager.clearStoredLogs();
    setLogs([]);
  };

  // Render the appropriate content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'logs':
        return renderLogsTab();
      case 'sensors':
        return renderSensorsTab();
      case 'state':
        return renderStateTab();
      case 'flags':
        return renderFlagsTab();
      case 'transitions':
        return renderTransitionsTab();
      case 'cache':
        return renderCacheTab();
      default:
        return null;
    }
  };

  // Render cache status tab content
  const renderCacheTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabHeaderText}>Cache Status</Text>
        <ScrollView style={styles.scrollView}>
          {Object.entries(sensorStatus).map(([sensor, status]) => {
            // Only show sensors with cache information
            if (!status.data || !status.data.cacheState) return null;

            return (
              <View key={sensor} style={styles.cacheItem}>
                <Text style={styles.cacheName}>{sensor}</Text>
                <View style={styles.cacheStatusRow}>
                  <Text style={styles.cacheLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.cacheStatus,
                      { color: getCacheStatusColor(status.data.cacheState) },
                    ]}
                  >
                    {status.data.cacheState.toUpperCase()}
                  </Text>
                </View>

                {status.data.cacheTimestamp && (
                  <View style={styles.cacheStatusRow}>
                    <Text style={styles.cacheLabel}>Last Updated:</Text>
                    <Text style={styles.cacheValue}>{status.data.cacheTimestamp}</Text>
                  </View>
                )}

                {status.data.cacheValidationTime && (
                  <View style={styles.cacheStatusRow}>
                    <Text style={styles.cacheLabel}>Last Validated:</Text>
                    <Text style={styles.cacheValue}>{status.data.cacheValidationTime}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {Object.values(sensorStatus).every(s => !s.data?.cacheState) && (
            <Text style={styles.noDataText}>No cache information available</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  // Helper function to get color for cache status
  const getCacheStatusColor = (status: string): string => {
    switch (status) {
      case 'valid':
        return tokens.colors.success;
      case 'invalid':
        return tokens.colors.danger;
      case 'unknown':
      default:
        return tokens.colors.brandAlt;
    }
  };

  // Render state transitions tab content
  const renderTransitionsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabHeaderText}>State Transitions ({stateTransitions.length})</Text>
          <Pressable style={styles.clearButton} onPress={loadStateTransitions}>
            <Text style={styles.clearButtonText}>Refresh</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.scrollView}>
          {stateTransitions.map((transition, index) => (
            <View key={index} style={styles.transitionItem}>
              <Text style={styles.transitionTimestamp}>
                {new Date(transition.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={styles.transitionAction}>
                Action: {transition.action}
                {transition.cause && ` (${transition.cause})`}
              </Text>
              <View style={styles.transitionStates}>
                <View style={styles.transitionState}>
                  <Text style={styles.transitionStateLabel}>From:</Text>
                  <Text style={styles.transitionStateValue}>
                    {JSON.stringify(transition.fromState, null, 2)}
                  </Text>
                </View>
                <View style={styles.transitionState}>
                  <Text style={styles.transitionStateLabel}>To:</Text>
                  <Text style={styles.transitionStateValue}>
                    {JSON.stringify(transition.toState, null, 2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {stateTransitions.length === 0 && (
            <Text style={styles.noDataText}>No state transitions recorded</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  // Render logs tab content
  const renderLogsTab = () => {
    // Group logs by component
    const logsByComponent: Record<string, any[]> = {};
    logs.forEach(log => {
      if (!logsByComponent[log.component]) {
        logsByComponent[log.component] = [];
      }
      logsByComponent[log.component].push(log);
    });

    return (
      <View style={styles.tabContent}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabHeaderText}>Logs ({logs.length})</Text>
          <Pressable style={styles.clearButton} onPress={clearLogs}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.logScrollView}>
          {Object.entries(logsByComponent).map(([component, componentLogs]) => (
            <View key={component} style={styles.componentSection}>
              <Text style={styles.componentHeader}>{component}</Text>
              {componentLogs.slice(-10).map((log, index) => (
                <View key={index} style={styles.logEntry}>
                  <Text style={getLogLevelStyle(log.level)}>
                    [{new Date(log.timestamp).toLocaleTimeString()}] {log.level.toUpperCase()}:{' '}
                    {log.message}
                  </Text>
                  {log.data && (
                    <Text style={styles.logData}>{JSON.stringify(log.data, null, 2)}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render sensors tab content
  const renderSensorsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabHeaderText}>Sensor Status</Text>
        <ScrollView style={styles.scrollView}>
          {Object.entries(sensorStatus).map(([sensor, status]) => (
            <View key={sensor} style={styles.sensorItem}>
              <Text style={styles.sensorName}>{sensor}</Text>
              <Text style={styles.sensorStatus}>
                {status.available ? 'Available' : 'Unavailable'}
              </Text>
              {status.data && (
                <Text style={styles.sensorData}>{JSON.stringify(status.data, null, 2)}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render state tab content
  const renderStateTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabHeaderText}>State Information</Text>
        <ScrollView style={styles.scrollView}>
          <View style={styles.stateItem}>
            <Text style={styles.stateLabel}>Session ID:</Text>
            <Text style={styles.stateValue}>{sessionId}</Text>
          </View>
          <View style={styles.stateItem}>
            <Text style={styles.stateLabel}>Environment:</Text>
            <Text style={styles.stateValue}>{__DEV__ ? 'Development' : 'Production'}</Text>
          </View>
          <View style={styles.stateItem}>
            <Text style={styles.stateLabel}>Platform:</Text>
            <Text style={styles.stateValue}>
              {Platform.OS} {Platform.Version}
            </Text>
          </View>
          <View style={styles.stateItem}>
            <Text style={styles.stateLabel}>Screen Dimensions:</Text>
            <Text style={styles.stateValue}>
              {Math.round(Dimensions.get('window').width)} x{' '}
              {Math.round(Dimensions.get('window').height)}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render feature flags tab content
  const renderFlagsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabHeaderText}>Feature Flags</Text>
        <ScrollView style={styles.scrollView}>
          {Object.entries(featureFlags).map(([flag, enabled]) => (
            <View key={flag} style={styles.flagItem}>
              <Text style={styles.flagName}>{flag}</Text>
              <Text style={[styles.flagStatus, { color: enabled ? '#4FB3F6' : '#E45858' }]}>
                {enabled ? 'ENABLED' : 'DISABLED'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Get style for log level
  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'error':
        return [styles.logText, styles.errorText];
      case 'warn':
        return [styles.logText, styles.warnText];
      case 'info':
        return [styles.logText, styles.infoText];
      case 'debug':
        return [styles.logText, styles.debugText];
      default:
        return styles.logText;
    }
  };

  if (!isVisible) return null;

  // Render the overlay
  return (
    <SafeAreaView
      style={[styles.container, isExpanded ? styles.expandedContainer : styles.collapsedContainer]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={toggleExpanded}
          style={styles.expandButton}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Collapse diagnostics panel' : 'Expand diagnostics panel'}
        >
          <Text style={styles.expandButtonText}>{isExpanded ? '▼' : '▲'}</Text>
        </Pressable>
        <Text style={styles.title}>Diagnostic Mode</Text>
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close diagnostics panel"
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
      </View>

      {isExpanded && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}>
            <View style={styles.tabBar}>
              <Pressable
                style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
                onPress={() => setActiveTab('logs')}
              >
                <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
                  Logs
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'sensors' && styles.activeTab]}
                onPress={() => setActiveTab('sensors')}
              >
                <Text style={[styles.tabText, activeTab === 'sensors' && styles.activeTabText]}>
                  Sensors
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'state' && styles.activeTab]}
                onPress={() => setActiveTab('state')}
              >
                <Text style={[styles.tabText, activeTab === 'state' && styles.activeTabText]}>
                  State
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'flags' && styles.activeTab]}
                onPress={() => setActiveTab('flags')}
              >
                <Text style={[styles.tabText, activeTab === 'flags' && styles.activeTabText]}>
                  Flags
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'transitions' && styles.activeTab]}
                onPress={() => setActiveTab('transitions')}
              >
                <Text style={[styles.tabText, activeTab === 'transitions' && styles.activeTabText]}>
                  Transitions
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeTab === 'cache' && styles.activeTab]}
                onPress={() => setActiveTab('cache')}
              >
                <Text style={[styles.tabText, activeTab === 'cache' && styles.activeTabText]}>
                  Cache
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {renderTabContent()}
        </>
      )}
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    zIndex: 9999,
  },
  collapsedContainer: {
    top: 0,
    height: 40,
  },
  expandedContainer: {
    top: 0,
    height: '50%',
  },
  // Cache tab styles
  cacheItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    marginBottom: 5,
  },
  cacheName: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(14),
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cacheStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  cacheLabel: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(12),
    width: 100,
  },
  cacheStatus: {
    fontSize: scaledFontSize(12),
    fontWeight: 'bold',
  },
  cacheValue: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(12),
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 40,
  },
  title: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(16),
    fontWeight: 'bold',
  },
  expandButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonText: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(16),
  },
  closeButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(16),
  },
  tabBarScroll: {
    maxHeight: 40,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.brandAlt,
  },
  tabText: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(14),
  },
  activeTabText: {
    color: tokens.colors.brandAlt,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tabHeaderText: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(14),
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: tokens.colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  clearButtonText: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(12),
  },
  scrollView: {
    flex: 1,
  },
  logScrollView: {
    flex: 1,
    paddingHorizontal: 10,
  },
  componentSection: {
    marginBottom: 10,
  },
  componentHeader: {
    color: tokens.colors.brandAlt,
    fontSize: scaledFontSize(14),
    fontWeight: 'bold',
    marginVertical: 5,
  },
  logEntry: {
    marginBottom: 5,
  },
  logText: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(12),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorText: {
    color: tokens.colors.danger,
  },
  warnText: {
    color: tokens.colors.brandAlt,
  },
  infoText: {
    color: tokens.colors.brandAlt,
  },
  debugText: {
    color: tokens.colors.textMuted,
  },
  logData: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(11),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: 10,
  },
  sensorItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  sensorName: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(14),
    fontWeight: 'bold',
  },
  sensorStatus: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(12),
  },
  sensorData: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(11),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 5,
  },
  stateItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  stateLabel: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(14),
    fontWeight: 'bold',
    width: 150,
  },
  stateValue: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(14),
    flex: 1,
  },
  flagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  flagName: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(14),
  },
  flagStatus: {
    fontSize: scaledFontSize(12),
    fontWeight: 'bold',
  },
  // State transitions styles
  transitionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    marginBottom: 5,
  },
  transitionTimestamp: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(12),
    fontWeight: 'bold',
  },
  transitionAction: {
    color: tokens.colors.brandAlt,
    fontSize: scaledFontSize(14),
    marginVertical: 5,
  },
  transitionStates: {
    marginTop: 5,
  },
  transitionState: {
    marginBottom: 10,
  },
  transitionStateLabel: {
    color: tokens.colors.textPrimary,
    fontSize: scaledFontSize(12),
    fontWeight: 'bold',
  },
  transitionStateValue: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(11),
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: 10,
  },
  noDataText: {
    color: tokens.colors.textMuted,
    fontSize: scaledFontSize(14),
    textAlign: 'center',
    marginTop: 20,
  },
});

export default DiagnosticOverlay;
