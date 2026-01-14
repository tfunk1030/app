/**
 * SetupScreen - Clubs & Settings Combined
 *
 * Consolidated setup experience:
 * - Club bag management (primary)
 * - Unit preferences
 * - App settings
 * - Theme selection
 * - Premium features
 *
 * Design: Clean list-based layout with expandable sections
 */

import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Sun,
  Moon,
  Smartphone,
  Ruler,
  Thermometer,
  Wind,
  Mountain,
  Crown,
  Bell,
  MapPin,
  Compass,
  HelpCircle,
  MessageSquare,
  Shield,
} from 'lucide-react-native';

import { useRedesignTheme, ThemeMode } from '@/src/theme/redesign';
import { QuickAction } from '@/src/components/redesign/QuickAction';
import { useSettings } from '@/src/core/context/settings';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { ClubData } from '@/src/core/models/YardageModel';

// =============================================================================
// TYPES
// =============================================================================

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

interface ClubRowProps {
  club: ClubData;
  distance: number;
  unit: string;
  onEdit: () => void;
  onDelete: () => void;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Section Header
 */
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
});

/**
 * Setting Row
 */
const SettingRow = memo(function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  destructive,
}: SettingRowProps) {
  const { colors } = useRedesignTheme();

  const content = (
    <>
      <View style={styles.settingRowLeft}>
        <View style={[styles.settingIcon, { backgroundColor: colors.brandMuted }]}>
          {icon}
        </View>
        <Text
          style={[
            styles.settingLabel,
            { color: destructive ? colors.error : colors.textPrimary },
          ]}
        >
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
        accessibilityLabel={`${label}${value ? `: ${value}` : ''}`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.settingRow, { borderBottomColor: colors.divider }]}
      accessibilityRole="text"
    >
      {content}
    </View>
  );
});

/**
 * Club Row
 */
const ClubRow = memo(function ClubRow({
  club,
  distance,
  unit,
  onEdit,
  onDelete,
}: ClubRowProps) {
  const { colors } = useRedesignTheme();

  return (
    <View style={[styles.clubRow, { borderBottomColor: colors.divider }]}>
      <View style={styles.clubInfo}>
        <Text style={[styles.clubName, { color: colors.textPrimary }]}>
          {club.name}
        </Text>
        <Text style={[styles.clubDistance, { color: colors.textMuted }]}>
          {Math.round(distance)} {unit}
        </Text>
      </View>

      <View style={styles.clubActions}>
        <Pressable
          onPress={onEdit}
          style={[styles.clubAction, { backgroundColor: colors.surface }]}
          accessibilityLabel={`Edit ${club.name}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Edit3 size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={[styles.clubAction, { backgroundColor: colors.surface }]}
          accessibilityLabel={`Delete ${club.name}`}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={18} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
});

/**
 * Theme Selector
 */
const ThemeSelector = memo(function ThemeSelector({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}) {
  const { colors } = useRedesignTheme();

  const options: { mode: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'light', icon: <Sun size={18} color={value === 'light' ? colors.brand : colors.textMuted} />, label: 'Light' },
    { mode: 'dark', icon: <Moon size={18} color={value === 'dark' ? colors.brand : colors.textMuted} />, label: 'Dark' },
    // { mode: 'outdoor', icon: <Smartphone size={18} color={value === 'outdoor' ? colors.brand : colors.textMuted} />, label: 'Outdoor' },
  ];

  return (
    <View
      style={styles.themeSelector}
      accessibilityRole="radiogroup"
      accessibilityLabel="Theme selection"
    >
      {options.map((option) => (
        <Pressable
          key={option.mode}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(option.mode);
          }}
          style={[
            styles.themeOption,
            {
              backgroundColor: value === option.mode ? colors.brandMuted : colors.surface,
              borderColor: value === option.mode ? colors.brand : colors.border,
            },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === option.mode }}
          accessibilityLabel={`${option.label} theme`}
        >
          {option.icon}
          <Text
            style={[
              styles.themeOptionLabel,
              { color: value === option.mode ? colors.brand : colors.textMuted },
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SetupScreen() {
  const { colors, mode, setMode, tokens } = useRedesignTheme();
  const { settings, updateSettings, convertDistance } = useSettings();
  const { clubs, removeClub } = useClubSettings();
  const insets = useSafeAreaInsets();

  // Handlers
  const handleDeleteClub = useCallback((clubId: string, clubName: string) => {
    Alert.alert(
      'Delete Club',
      `Are you sure you want to remove ${clubName} from your bag?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeClub(clubId);
          },
        },
      ]
    );
  }, [removeClub]);

  const handleUnitChange = useCallback((type: 'imperial' | 'metric') => {
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
  }, [updateSettings]);

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
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            Setup
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your bag & preferences
          </Text>
        </View>

        {/* My Bag Section */}
        <Animated.View entering={FadeIn}>
          <SectionHeader
            title="MY BAG"
            action="Add Club"
            onAction={() => {
              // TODO: Open add club modal
              Alert.alert('Add Club', 'Club editor coming soon!');
            }}
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
                  onPress={() => Alert.alert('Add Club', 'Club editor coming soon!')}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              clubs.map((club, index) => {
                const displayDistance = isMetric
                  ? convertDistance(club.normalYardage, 'meters')
                  : club.normalYardage;

                return (
                  <ClubRow
                    key={`${club.name}-${index}`}
                    club={club}
                    distance={displayDistance}
                    unit={unit}
                    onEdit={() => Alert.alert('Edit Club', 'Club editor coming soon!')}
                    onDelete={() => handleDeleteClub(club.id ?? '', club.name)}
                  />
                );
              })
            )}
          </View>
        </Animated.View>

        {/* Appearance Section */}
        <Animated.View entering={FadeInDown.delay(100)}>
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
          </View>
        </Animated.View>

        {/* Units Section */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <SectionHeader title="UNITS" />

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View
              style={styles.unitSelector}
              accessibilityRole="radiogroup"
              accessibilityLabel="Unit system selection"
            >
              <Pressable
                onPress={() => handleUnitChange('imperial')}
                style={[
                  styles.unitOption,
                  {
                    backgroundColor: !isMetric ? colors.brandMuted : 'transparent',
                    borderColor: !isMetric ? colors.brand : colors.border,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: !isMetric }}
                accessibilityLabel="Imperial units: Yards, Fahrenheit, miles per hour"
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
                accessibilityRole="radio"
                accessibilityState={{ selected: isMetric }}
                accessibilityLabel="Metric units: Meters, Celsius, kilometers per hour"
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
          </View>
        </Animated.View>

        {/* Permissions Section */}
        <Animated.View entering={FadeInDown.delay(300)}>
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
                  accessibilityLabel="Enable location access"
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
                  accessibilityLabel="Enable compass"
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
                  accessibilityLabel="Enable notifications"
                />
              }
            />
          </View>
        </Animated.View>

        {/* Premium Section */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <SectionHeader title="PREMIUM" />

          <Pressable
            style={[
              styles.premiumCard,
              {
                backgroundColor: colors.brandMuted,
                borderColor: colors.brand,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Premium"
            onPress={() => Alert.alert('Premium', 'Premium features coming soon!')}
          >
            <View style={styles.premiumCardLeft}>
              <Crown size={24} color={colors.brand} />
              <View>
                <Text style={[styles.premiumTitle, { color: colors.textPrimary }]}>
                  Upgrade to Premium
                </Text>
                <Text style={[styles.premiumSubtitle, { color: colors.textMuted }]}>
                  Unlock advanced analytics & features
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.brand} />
          </Pressable>
        </Animated.View>

        {/* Support Section */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <SectionHeader title="SUPPORT" />

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingRow
              icon={<HelpCircle size={18} color={colors.brand} />}
              label="Help Center"
              onPress={() => Alert.alert('Help', 'Help center coming soon!')}
            />
            <SettingRow
              icon={<MessageSquare size={18} color={colors.brand} />}
              label="Send Feedback"
              onPress={() => Alert.alert('Feedback', 'Feedback form coming soon!')}
            />
            <SettingRow
              icon={<Shield size={18} color={colors.brand} />}
              label="Privacy Policy"
              onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon!')}
            />
          </View>
        </Animated.View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>
          AICaddy Pro v2.0.0
        </Text>
      </ScrollView>
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
    width: 44,
    height: 44,
    borderRadius: 10,
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
    gap: 8,
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
    gap: 8,
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
});

export default SetupScreen;
