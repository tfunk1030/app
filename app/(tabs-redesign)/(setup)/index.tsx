/**
 * Setup Tab - Clubs & Settings
 *
 * Consolidated setup experience with:
 * - Club bag management
 * - Theme selection
 * - Unit preferences
 * - Permissions
 */

import React, { useCallback, memo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { TrueSheet, type TrueSheetRef } from '@lodev09/react-native-true-sheet';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import Animated from 'react-native-reanimated';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit3,
  Sun,
  Moon,
  Crown,
  Bell,
  MapPin,
  Compass,
  HelpCircle,
  MessageSquare,
  Shield,
  X,
  Activity,
  Database,
  Wind,
  Hand,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';

import { useRedesignTheme, ThemeMode } from '@/src/theme/redesign';
import { QuickAction } from '@/src/components/redesign/QuickAction';
import { useSettings } from '@/src/core/context/settings';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { usePremium } from '@/src/features/settings/context/premium';
import { ClubData } from '@/src/core/models/YardageModel';

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
  collapsible,
  expanded,
  onToggle,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const { colors } = useRedesignTheme();

  const headerContent = (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {collapsible && (
          expanded ? (
            <ChevronUp size={16} color={colors.textMuted} style={styles.chevronIcon} />
          ) : (
            <ChevronDown size={16} color={colors.textMuted} style={styles.chevronIcon} />
          )
        )}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {title}
        </Text>
      </View>
      {action && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <Text style={[styles.sectionAction, { color: colors.brand }]}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );

  if (collapsible && onToggle) {
    return (
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${title} section, tap to ${expanded ? 'collapse' : 'expand'}`}
        accessibilityState={{ expanded }}
        style={styles.collapsibleHeader}
      >
        {headerContent}
      </Pressable>
    );
  }

  return headerContent;
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
        accessibilityRole="button"
        accessibilityLabel={label}
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
        accessibilityRole="button"
        accessibilityLabel="Light theme"
        accessibilityState={{ selected: value === 'light' }}
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
        accessibilityRole="button"
        accessibilityLabel="Dark theme"
        accessibilityState={{ selected: value === 'dark' }}
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

// =============================================================================
// MAIN SCREEN
// =============================================================================

export default function SetupScreen() {
  const { colors, mode, setMode } = useRedesignTheme();
  const { settings, updateSettings, convertDistance } = useSettings();
  const { clubs, addClub, updateClub, removeClub } = useClubSettings();
  const { setShowUpgradeModal } = usePremium();
  const { headerEntering, cardEntering } = useAccessibleAnimations();

  // TrueSheet ref for club editing
  const clubSheetRef = useRef<TrueSheetRef>(null);

  // Club editing state
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState('');
  const [clubDistance, setClubDistance] = useState('');

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    clubs: true,
    appearance: true,
    units: false,
    permissions: false,
    support: false,
  });

  const toggleSection = useCallback((section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

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

  // Open sheet for adding a new club
  const handleOpenAddSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingClubId(null);
    setClubName('');
    setClubDistance('');
    clubSheetRef.current?.present();
  }, []);

  // Open sheet for editing an existing club
  const handleOpenEditSheet = useCallback(
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
      clubSheetRef.current?.present();
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

    clubSheetRef.current?.dismiss();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* My Bag */}
        <Animated.View entering={headerEntering}>
          <SectionHeader
            title="MY BAG"
            action="Add Club"
            onAction={handleOpenAddSheet}
            collapsible
            expanded={expandedSections.clubs}
            onToggle={() => toggleSection('clubs')}
          />

          {expandedSections.clubs && (
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
                    onPress={handleOpenAddSheet}
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
                          onPress={() => handleOpenEditSheet(clubId)}
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
          )}
        </Animated.View>

        {/* Appearance */}
        <Animated.View entering={cardEntering(1)}>
          <SectionHeader
            title="APPEARANCE"
            collapsible
            expanded={expandedSections.appearance}
            onToggle={() => toggleSection('appearance')}
          />
          {expandedSections.appearance && (
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
              {/* Dominant Hand - for lock button positioning */}
              <View style={[styles.settingRow, { borderBottomColor: colors.divider, borderBottomWidth: 0 }]}>
                <View style={styles.settingRowLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.brandMuted }]}>
                    <Hand size={18} color={colors.brand} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    Dominant Hand
                  </Text>
                </View>
              </View>
              <View style={styles.handSelector}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ dominantHand: 'right' });
                  }}
                  style={[
                    styles.handOption,
                    {
                      backgroundColor: settings.dominantHand === 'right' ? colors.brandMuted : 'transparent',
                      borderColor: settings.dominantHand === 'right' ? colors.brand : colors.border,
                    },
                  ]}
                  accessibilityLabel="Right handed - lock button on right"
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.dominantHand === 'right' }}
                >
                  <Text
                    style={[
                      styles.handOptionLabel,
                      { color: settings.dominantHand === 'right' ? colors.brand : colors.textMuted },
                    ]}
                  >
                    Right
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateSettings({ dominantHand: 'left' });
                  }}
                  style={[
                    styles.handOption,
                    {
                      backgroundColor: settings.dominantHand === 'left' ? colors.brandMuted : 'transparent',
                      borderColor: settings.dominantHand === 'left' ? colors.brand : colors.border,
                    },
                  ]}
                  accessibilityLabel="Left handed - lock button on left"
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.dominantHand === 'left' }}
                >
                  <Text
                    style={[
                      styles.handOptionLabel,
                      { color: settings.dominantHand === 'left' ? colors.brand : colors.textMuted },
                    ]}
                  >
                    Left
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                Positions lock button on your preferred side
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Units */}
        <Animated.View entering={cardEntering(2)}>
          <SectionHeader
            title="UNITS"
            collapsible
            expanded={expandedSections.units}
            onToggle={() => toggleSection('units')}
          />
          {expandedSections.units && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            {/* Distance Unit Selector - Native SegmentedControl */}
            <View style={styles.segmentedControlContainer}>
              <Text style={[styles.segmentedControlLabel, { color: colors.textPrimary }]}>
                Distance & Temperature
              </Text>
              <SegmentedControl
                values={['Imperial (yds, °F)', 'Metric (m, °C)']}
                selectedIndex={isMetric ? 1 : 0}
                onChange={(event) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleUnitChange(event.nativeEvent.selectedSegmentIndex === 0 ? 'imperial' : 'metric');
                }}
                style={styles.segmentedControl}
                tintColor={colors.brand}
                fontStyle={{ color: colors.textMuted }}
                activeFontStyle={{ color: colors.textPrimary }}
              />
            </View>

            {/* Wind Speed Unit Selector - Native SegmentedControl */}
            <View style={styles.segmentedControlContainer}>
              <View style={styles.segmentedControlLabelRow}>
                <Wind size={18} color={colors.brand} />
                <Text style={[styles.segmentedControlLabel, { color: colors.textPrimary }]}>
                  Wind Speed
                </Text>
              </View>
              <SegmentedControl
                values={['mph', 'kph', 'kts', 'm/s']}
                selectedIndex={['mph', 'kph', 'kts', 'mps'].indexOf(settings.speedUnit)}
                onChange={(event) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const units = ['mph', 'kph', 'kts', 'mps'] as const;
                  const selectedUnit = units[event.nativeEvent.selectedSegmentIndex];
                  updateSettings({ windSpeedUnit: selectedUnit, speedUnit: selectedUnit });
                }}
                style={styles.segmentedControl}
                tintColor={colors.brand}
                fontStyle={{ color: colors.textMuted }}
                activeFontStyle={{ color: colors.textPrimary }}
              />
            </View>
          </View>
          )}
        </Animated.View>

        {/* Permissions */}
        <Animated.View entering={cardEntering(3)}>
          <SectionHeader
            title="PERMISSIONS"
            collapsible
            expanded={expandedSections.permissions}
            onToggle={() => toggleSection('permissions')}
          />
          {expandedSections.permissions && (
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
                    accessibilityLabel="Location permission toggle"
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
                    accessibilityLabel="Compass permission toggle"
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
                    accessibilityLabel="Notifications permission toggle"
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
          )}
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

        {/* Premium */}
        <Animated.View entering={cardEntering(4)}>
          <SectionHeader title="PREMIUM" />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowUpgradeModal(true);
            }}
            style={[
              styles.premiumCard,
              { backgroundColor: colors.brandMuted, borderColor: colors.brand },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Premium. Unlock advanced features"
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

      {/* Club Edit/Add TrueSheet */}
      <TrueSheet
        ref={clubSheetRef}
        detents={['auto']}
        grabber
        backgroundColor={colors.surface}
        cornerRadius={24}
      >
        <View style={styles.sheetContent}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              {editingClubId ? 'Edit Club' : 'Add Club'}
            </Text>
            <Pressable
              onPress={() => clubSheetRef.current?.dismiss()}
              style={styles.sheetClose}
              accessibilityLabel="Close sheet"
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
                    accessibilityRole="button"
                    accessibilityLabel={`Quick add ${preset.name}, ${preset.yardage} yards`}
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
        </View>
      </TrueSheet>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },

  // Sections
  collapsibleHeader: {
    minHeight: 48, // 48dp minimum touch target
  },

  chevronIcon: {
    marginRight: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 24,
    paddingHorizontal: 4,
  },

  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    minHeight: 48, // 48dp minimum touch target
    paddingVertical: 14,
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
    justifyContent: 'center',
    minHeight: 56, // Larger touch target for primary selection
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
    minHeight: 48, // 48dp minimum touch target
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },

  windUnitOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Dominant hand selector
  handSelector: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },

  handOption: {
    flex: 1,
    alignItems: 'center',
    minHeight: 48, // 48dp minimum touch target
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
  },

  handOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },

  settingHint: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
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

  // TrueSheet Styles
  sheetContent: {
    padding: 24,
    paddingBottom: 40,
  },

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  sheetClose: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // SegmentedControl Styles
  segmentedControlContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  segmentedControlLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },

  segmentedControlLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  segmentedControl: {
    height: 36,
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
    paddingVertical: 14,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
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
