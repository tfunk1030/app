/**
 * Setup Tab - Clubs & Settings
 *
 * Consolidated setup experience with:
 * - Club bag management
 * - Theme selection
 * - Unit preferences
 * - Permissions
 */

import React, { useCallback, memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Sun,
  Moon,
  Ruler,
  Crown,
  Bell,
  MapPin,
  Compass,
  HelpCircle,
  MessageSquare,
  Shield,
  LayoutGrid,
  X,
  Activity,
  Database,
  Wind,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';

import { useRedesignTheme, ThemeMode } from '@/src/theme/redesign';
import { QuickAction } from '@/src/components/redesign/QuickAction';
import { useSettings } from '@/src/core/context/settings';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { ClubData } from '@/src/core/models/YardageModel';
import { useNavigationPreference } from '@/src/stores/navigationPreference';
import * as Updates from 'expo-updates';

// App URLs - replace with your hosted URLs
const SUPPORT_URL = 'mailto:support@aicaddypro.com?subject=AICaddyPro%20Support';
const FEEDBACK_URL = 'mailto:feedback@aicaddypro.com?subject=AICaddyPro%20Feedback';
const PRIVACY_URL = 'https://aicaddypro.com/privacy'; // Replace with actual hosted URL

// Quick add club presets
const QUICK_ADD_CLUBS = [
  { name: 'Driver', yardage: 300 },
  { name: '3-Wood', yardage: 260 },
  { name: '5-Wood', yardage: 235 },
  { name: 'Hybrid', yardage: 235 },
  { name: '4-Iron', yardage: 220 },
  { name: '5-Iron', yardage: 205 },
  { name: '6-Iron', yardage: 192 },
  { name: '7-Iron', yardage: 180 },
  { name: '8-Iron', yardage: 165 },
  { name: '9-Iron', yardage: 153 },
  { name: 'PW', yardage: 138 },
  { name: 'GW', yardage: 125 },
  { name: 'SW', yardage: 110 },
  { name: 'LW', yardage: 90 },
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const SectionHeader = memo(function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useRedesignTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        {title}
      </Text>
      {action && onAction && (
        <Pressable onPress={onAction}>
          <Text style={[styles.sectionAction, { color: colors.brand }]}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

const SettingRow = memo(function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
}: SettingRowProps) {
  const { colors } = useRedesignTheme();

  const content = (
    <>
      <View style={styles.settingRowLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.brandMuted }]}>
          {icon}
        </View>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRowRight}>
        {value && (
          <Text style={[styles.settingValue, { color: colors.textMuted }]}>
            {value}
          </Text>
        )}
        {rightElement}
        {onPress && !rightElement && (
          <ChevronRight size={18} color={colors.textMuted} />
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[styles.settingRow, { borderBottomColor: colors.divider }]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
      {content}
    </View>
  );
});

const ThemeSelector = memo(function ThemeSelector({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}) {
  const { colors } = useRedesignTheme();

  return (
    <View style={styles.themeSelector}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange('light');
        }}
        style={[
          styles.themeOption,
          {
            backgroundColor: value === 'light' ? colors.brandMuted : 'transparent',
            borderColor: value === 'light' ? colors.brand : colors.border,
          },
        ]}
      >
        <Sun size={18} color={value === 'light' ? colors.brand : colors.textMuted} />
        <Text
          style={[
            styles.themeOptionLabel,
            { color: value === 'light' ? colors.brand : colors.textMuted },
          ]}
        >
          Light
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onChange('dark');
        }}
        style={[
          styles.themeOption,
          {
            backgroundColor: value === 'dark' ? colors.brandMuted : 'transparent',
            borderColor: value === 'dark' ? colors.brand : colors.border,
          },
        ]}
      >
        <Moon size={18} color={value === 'dark' ? colors.brand : colors.textMuted} />
        <Text
          style={[
            styles.themeOptionLabel,
            { color: value === 'dark' ? colors.brand : colors.textMuted },
          ]}
        >
          Dark
        </Text>
      </Pressable>
    </View>
  );
});

const NavigationStyleSection = memo(function NavigationStyleSection() {
  const { colors } = useRedesignTheme();
  const { style: navStyle, setStyle } = useNavigationPreference();
  const { cardEntering } = useAccessibleAnimations();

  const handleToggle = async (newStyle: 'classic' | 'redesign') => {
    await setStyle(newStyle);
    Alert.alert(
      'Navigation Changed',
      `Switched to ${newStyle === 'redesign' ? 'New 3-Tab' : 'Classic 5-Tab'} layout. The app will reload to apply changes.`,
      [
        {
          text: 'Reload Now',
          onPress: async () => {
            try {
              await Updates.reloadAsync();
            } catch {
              Alert.alert('Please restart the app to see the changes.');
            }
          },
        },
        { text: 'Later', style: 'cancel' },
      ]
    );
  };

  return (
    <Animated.View entering={cardEntering(3)}>
      <SectionHeader title="NAVIGATION STYLE" />
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.unitSelector}>
          <Pressable
            onPress={() => handleToggle('redesign')}
            style={[
              styles.unitOption,
              {
                backgroundColor: navStyle === 'redesign' ? colors.brandMuted : 'transparent',
                borderColor: navStyle === 'redesign' ? colors.brand : colors.border,
              },
            ]}
          >
            <LayoutGrid
              size={20}
              color={navStyle === 'redesign' ? colors.brand : colors.textMuted}
            />
            <Text
              style={[
                styles.unitOptionLabel,
                { color: navStyle === 'redesign' ? colors.brand : colors.textMuted, marginTop: 8 },
              ]}
            >
              New (3 tabs)
            </Text>
            <Text style={[styles.unitOptionDetail, { color: colors.textMuted }]}>
              Play, Stats, Setup
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleToggle('classic')}
            style={[
              styles.unitOption,
              {
                backgroundColor: navStyle === 'classic' ? colors.brandMuted : 'transparent',
                borderColor: navStyle === 'classic' ? colors.brand : colors.border,
              },
            ]}
          >
            <LayoutGrid
              size={20}
              color={navStyle === 'classic' ? colors.brand : colors.textMuted}
            />
            <Text
              style={[
                styles.unitOptionLabel,
                { color: navStyle === 'classic' ? colors.brand : colors.textMuted, marginTop: 8 },
              ]}
            >
              Classic (5 tabs)
            </Text>
            <Text style={[styles.unitOptionDetail, { color: colors.textMuted }]}>
              Weather, Shot, Wind...
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
});

// =============================================================================
// MAIN SCREEN
// =============================================================================

export default function SetupScreen() {
  const { colors, mode, setMode, tokens } = useRedesignTheme();
  const { settings, updateSettings, convertDistance } = useSettings();
  const { clubs, addClub, updateClub, removeClub } = useClubSettings();
  const { headerEntering, cardEntering } = useAccessibleAnimations();

  // Club modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState('');
  const [clubDistance, setClubDistance] = useState('');

  const handleDeleteClub = useCallback(
    (clubId: string, clubName: string) => {
      Alert.alert('Delete Club', `Remove ${clubName} from your bag?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Handle fallback IDs for legacy clubs
            if (clubId.startsWith('fallback-')) {
              const indexStr = clubId.split('-').pop();
              const index = parseInt(indexStr || '0', 10);
              const club = clubs[index];
              if (club?.id) {
                removeClub(club.id);
              }
            } else {
              removeClub(clubId);
            }
          },
        },
      ]);
    },
    [removeClub, clubs]
  );

  const handleUnitChange = useCallback(
    (type: 'imperial' | 'metric') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (type === 'metric') {
        updateSettings({
          distanceUnit: 'meters',
          temperatureUnit: 'celsius',
          altitudeUnit: 'meters',
          speedUnit: 'kph',
        });
      } else {
        updateSettings({
          distanceUnit: 'yards',
          temperatureUnit: 'fahrenheit',
          altitudeUnit: 'feet',
          speedUnit: 'mph',
        });
      }
    },
    [updateSettings]
  );

  // Open modal for adding a new club
  const handleOpenAddModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingClubId(null);
    setClubName('');
    setClubDistance('');
    setModalVisible(true);
  }, []);

  // Open modal for editing an existing club
  const handleOpenEditModal = useCallback(
    (clubId: string) => {
      let club: ClubData | undefined;

      // Handle fallback IDs for legacy clubs without proper IDs
      if (clubId.startsWith('fallback-')) {
        const indexStr = clubId.split('-').pop();
        const index = parseInt(indexStr || '0', 10);
        club = clubs[index];
      } else {
        club = clubs.find((c) => c.id === clubId);
      }

      if (!club) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const displayYardage =
        settings.distanceUnit === 'meters'
          ? Math.round(convertDistance(club.normalYardage, 'meters'))
          : Math.round(club.normalYardage);

      // Store the club's actual ID if it has one, otherwise store the fallback ID
      setEditingClubId(club.id || clubId);
      setClubName(club.name);
      setClubDistance(displayYardage.toString());
      setModalVisible(true);
    },
    [clubs, settings.distanceUnit, convertDistance]
  );

  // Handle quick add preset
  const handleQuickAdd = useCallback(
    (name: string, yardage: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setClubName(name);
      const displayYardage =
        settings.distanceUnit === 'meters'
          ? Math.round(convertDistance(yardage, 'meters'))
          : yardage;
      setClubDistance(displayYardage.toString());
    },
    [settings.distanceUnit, convertDistance]
  );

  // Save club (add or update)
  const handleSaveClub = useCallback(() => {
    if (!clubName.trim() || !clubDistance.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const numericYardage = parseFloat(clubDistance) || 0;
    const processedYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(numericYardage, 'yards')
        : numericYardage;

    const existingClub = editingClubId ? clubs.find((c) => c.id === editingClubId) : null;
    const clubData = {
      name: clubName.trim(),
      normalYardage: processedYardage,
      ball_speed: existingClub?.ball_speed ?? 0,
      launch_angle: existingClub?.launch_angle ?? 0,
      spin_rate: existingClub?.spin_rate ?? 0,
      max_height: existingClub?.max_height ?? 0,
      land_angle: existingClub?.land_angle ?? 0,
      spin_decay: existingClub?.spin_decay ?? 0,
      wind_sensitivity: existingClub?.wind_sensitivity ?? 1.0,
    };

    if (editingClubId) {
      updateClub(editingClubId, clubData);
    } else {
      addClub(clubData);
    }

    setModalVisible(false);
  }, [
    clubName,
    clubDistance,
    settings.distanceUnit,
    convertDistance,
    editingClubId,
    clubs,
    updateClub,
    addClub,
  ]);

  const isMetric = settings.distanceUnit === 'meters';
  const unit = isMetric ? 'm' : 'yds';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 }, // 64 (tab bar) + 16 (buffer) - insets already in tab bar
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Setup</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your bag & preferences
          </Text>
        </View>

        {/* My Bag */}
        <Animated.View entering={headerEntering}>
          <SectionHeader
            title="MY BAG"
            action="Add Club"
            onAction={handleOpenAddModal}
          />

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            {clubs.length === 0 ? (
              <View style={styles.emptyBag}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No clubs added yet
                </Text>
                <QuickAction
                  label="Add Your First Club"
                  icon={<Plus size={18} color={colors.textInverse} />}
                  variant="primary"
                  onPress={handleOpenAddModal}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              clubs.map((club, index) => {
                const clubId = club.id || `fallback-${club.name}-${index}`;
                const distance = Math.round(
                  isMetric
                    ? convertDistance(club.normalYardage, 'meters')
                    : club.normalYardage
                );

                return (
                  <View
                    key={clubId}
                    style={[styles.clubRow, { borderBottomColor: colors.divider }]}
                  >
                    <View style={styles.clubInfo}>
                      <Text style={[styles.clubName, { color: colors.textPrimary }]}>
                        {club.name}
                      </Text>
                      <Text style={[styles.clubDistance, { color: colors.textMuted }]}>
                        {distance} {unit}
                      </Text>
                    </View>
                    <View style={styles.clubActions}>
                      <Pressable
                        onPress={() => handleOpenEditModal(clubId)}
                        style={[styles.clubAction, { backgroundColor: colors.backgroundAlt }]}
                        accessibilityLabel={`Edit ${club.name}`}
                        accessibilityRole="button"
                      >
                        <Edit3 size={16} color={colors.textMuted} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteClub(clubId, club.name)}
                        style={[styles.clubAction, { backgroundColor: colors.backgroundAlt }]}
                        accessibilityLabel={`Delete ${club.name}`}
                        accessibilityRole="button"
                      >
                        <Trash2 size={16} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </Animated.View>

        {/* Appearance */}
        <Animated.View entering={cardEntering(1)}>
          <SectionHeader title="APPEARANCE" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                Theme
              </Text>
            </View>
            <View style={styles.themeSelectorContainer}>
              <ThemeSelector value={mode} onChange={setMode} />
            </View>
            <SettingRow
              icon={<Sun size={18} color={colors.brand} />}
              label="Outdoor/Sunlight Mode"
              rightElement={
                <Switch
                  value={mode === 'outdoor'}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode(value ? 'outdoor' : 'light');
                    updateSettings({ sunlightModeEnabled: value });
                  }}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Outdoor sunlight mode toggle"
                />
              }
            />
          </View>
        </Animated.View>

        {/* Units */}
        <Animated.View entering={cardEntering(2)}>
          <SectionHeader title="UNITS" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.unitSelector}>
              <Pressable
                onPress={() => handleUnitChange('imperial')}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: !isMetric ? colors.brandMuted : 'transparent',
                    borderColor: !isMetric ? colors.brand : colors.border,
                  },
                ]}
                accessibilityLabel="Imperial units: Yards, Fahrenheit, mph"
                accessibilityRole="button"
                accessibilityState={{ selected: !isMetric }}
              >
                <Text
                  style={[
                    styles.unitOptionLabel,
                    { color: !isMetric ? colors.brand : colors.textMuted },
                  ]}
                >
                  Imperial
                </Text>
                <Text style={[styles.unitOptionDetail, { color: colors.textMuted }]}>
                  Yards, °F, mph
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleUnitChange('metric')}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: isMetric ? colors.brandMuted : 'transparent',
                    borderColor: isMetric ? colors.brand : colors.border,
                  },
                ]}
                accessibilityLabel="Metric units: Meters, Celsius, km/h"
                accessibilityRole="button"
                accessibilityState={{ selected: isMetric }}
              >
                <Text
                  style={[
                    styles.unitOptionLabel,
                    { color: isMetric ? colors.brand : colors.textMuted },
                  ]}
                >
                  Metric
                </Text>
                <Text style={[styles.unitOptionDetail, { color: colors.textMuted }]}>
                  Meters, °C, km/h
                </Text>
              </Pressable>
            </View>

            {/* Wind Speed Unit Selector */}
            <View style={[styles.settingRow, { borderBottomColor: colors.divider, borderBottomWidth: 0 }]}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.brandMuted }]}>
                  <Wind size={18} color={colors.brand} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Wind Speed
                </Text>
              </View>
            </View>
            <View style={styles.windUnitSelector}>
              {(['mph', 'kph', 'kts', 'mps'] as const).map((unit) => (
                <Pressable
                  key={unit}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ windSpeedUnit: unit, speedUnit: unit });
                  }}
                  style={[
                    styles.windUnitOption,
                    {
                      backgroundColor: settings.speedUnit === unit ? colors.brandMuted : 'transparent',
                      borderColor: settings.speedUnit === unit ? colors.brand : colors.border,
                    },
                  ]}
                  accessibilityLabel={`Wind speed in ${unit === 'mps' ? 'meters per second' : unit}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.speedUnit === unit }}
                >
                  <Text
                    style={[
                      styles.windUnitOptionLabel,
                      { color: settings.speedUnit === unit ? colors.brand : colors.textMuted },
                    ]}
                  >
                    {unit === 'mps' ? 'm/s' : unit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Permissions */}
        <Animated.View entering={cardEntering(3)}>
          <SectionHeader title="PERMISSIONS" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon={<MapPin size={18} color={colors.brand} />}
              label="Location"
              rightElement={
                <Switch
                  value={settings.locationEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ locationEnabled: value });
                  }}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              }
            />
            <SettingRow
              icon={<Compass size={18} color={colors.brand} />}
              label="Compass"
              rightElement={
                <Switch
                  value={settings.compassEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ compassEnabled: value });
                  }}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              }
            />
            <SettingRow
              icon={<Bell size={18} color={colors.brand} />}
              label="Notifications"
              rightElement={
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ notificationsEnabled: value });
                  }}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              }
            />
            <SettingRow
              icon={<Activity size={18} color={colors.brand} />}
              label="Activity Tracking"
              rightElement={
                <Switch
                  value={settings.activityTrackingEnabled}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ activityTrackingEnabled: value });
                  }}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Activity Tracking toggle"
                />
              }
            />
          </View>
        </Animated.View>

        {/* Data Management */}
        <Animated.View entering={cardEntering(3)}>
          <SectionHeader title="DATA" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon={<Database size={18} color={colors.brand} />}
              label="Clear Weather Cache"
              onPress={() => {
                Alert.alert(
                  'Clear Weather Cache',
                  'This will remove cached weather data. Fresh data will be fetched on next use.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await AsyncStorage.removeItem('weatherCache');
                          await AsyncStorage.removeItem('weatherCacheTimestamp');
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          Alert.alert('Success', 'Weather cache cleared.');
                        } catch (error) {
                          console.error('Failed to clear cache:', error);
                          Alert.alert('Error', 'Failed to clear cache.');
                        }
                      },
                    },
                  ]
                );
              }}
            />
          </View>
        </Animated.View>

        {/* Navigation Style */}
        <NavigationStyleSection />

        {/* Premium */}
        <Animated.View entering={cardEntering(4)}>
          <SectionHeader title="PREMIUM" />
          <Pressable
            style={[
              styles.premiumCard,
              { backgroundColor: colors.brandMuted, borderColor: colors.brand },
            ]}
          >
            <View style={styles.premiumCardLeft}>
              <Crown size={24} color={colors.brand} />
              <View>
                <Text style={[styles.premiumTitle, { color: colors.textPrimary }]}>
                  Upgrade to Premium
                </Text>
                <Text style={[styles.premiumSubtitle, { color: colors.textMuted }]}>
                  Unlock advanced features
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.brand} />
          </Pressable>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={cardEntering(5)}>
          <SectionHeader title="SUPPORT" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon={<HelpCircle size={18} color={colors.brand} />}
              label="Help Center"
              onPress={() => Linking.openURL(SUPPORT_URL)}
            />
            <SettingRow
              icon={<MessageSquare size={18} color={colors.brand} />}
              label="Send Feedback"
              onPress={() => Linking.openURL(FEEDBACK_URL)}
            />
            <SettingRow
              icon={<Shield size={18} color={colors.brand} />}
              label="Privacy Policy"
              onPress={() => Linking.openURL(PRIVACY_URL)}
            />
          </View>
        </Animated.View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>
          AICaddy Pro v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      {/* Club Edit/Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingClubId ? 'Edit Club' : 'Add Club'}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.modalClose}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <X size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Quick Add Section (only when adding) */}
            {!editingClubId && (
              <View style={styles.quickAddContainer}>
                <Text style={[styles.quickAddTitle, { color: colors.textMuted }]}>
                  Quick Add
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.quickAddScroll}
                >
                  {QUICK_ADD_CLUBS.map((preset) => (
                    <Pressable
                      key={preset.name}
                      onPress={() => handleQuickAdd(preset.name, preset.yardage)}
                      style={[styles.quickAddChip, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
                    >
                      <Text style={[styles.quickAddChipText, { color: colors.textPrimary }]}>
                        {preset.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Club Name Input */}
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundAlt, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Club Name"
              placeholderTextColor={colors.textMuted}
              value={clubName}
              onChangeText={setClubName}
              accessibilityLabel="Club name"
            />

            {/* Distance Input */}
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundAlt, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder={`Distance (${settings.distanceUnit})`}
              placeholderTextColor={colors.textMuted}
              value={clubDistance}
              onChangeText={setClubDistance}
              keyboardType="numeric"
              accessibilityLabel={`Club distance in ${settings.distanceUnit}`}
            />

            {/* Save Button */}
            <Pressable
              onPress={handleSaveClub}
              disabled={!clubName.trim() || !clubDistance.trim()}
              style={[
                styles.saveButton,
                {
                  backgroundColor: clubName.trim() && clubDistance.trim() ? colors.brand : colors.border,
                },
              ]}
              accessibilityLabel={editingClubId ? 'Update club' : 'Add club'}
              accessibilityRole="button"
            >
              <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
                {editingClubId ? 'Update Club' : 'Add Club'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 24,
    paddingHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },

  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
  },

  section: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },

  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },

  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  settingValue: {
    fontSize: 15,
  },

  // Club Row
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },

  clubInfo: {
    flex: 1,
  },

  clubName: {
    fontSize: 16,
    fontWeight: '600',
  },

  clubDistance: {
    fontSize: 14,
    marginTop: 2,
  },

  clubActions: {
    flexDirection: 'row',
    gap: 8,
  },

  clubAction: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyBag: {
    padding: 24,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 15,
  },

  // Theme Selector
  themeSelectorContainer: {
    padding: 16,
  },

  themeSelector: {
    flexDirection: 'row',
    gap: 10,
  },

  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },

  themeOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Unit Selector
  unitSelector: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },

  unitOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },

  unitOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  unitOptionDetail: {
    fontSize: 12,
    marginTop: 4,
  },

  // Wind Unit Selector
  windUnitSelector: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  windUnitOption: {
    flex: 1,
    minWidth: 60,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },

  windUnitOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Premium Card
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },

  premiumCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  premiumSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Version
  version: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  modalClose: {
    padding: 8,
  },

  quickAddContainer: {
    marginBottom: 16,
  },

  quickAddTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },

  quickAddScroll: {
    flexGrow: 0,
  },

  quickAddChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },

  quickAddChipText: {
    fontSize: 13,
    fontWeight: '500',
  },

  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },

  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
