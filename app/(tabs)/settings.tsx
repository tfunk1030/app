/**
 * Settings Screen
 *
 * Optimized implementation using:
 * - Progressive loading
 * - Memoization
 * - Component splitting
 */

import { LoadPriority, ProgressiveLoader } from '@/src/components/ui/ProgressiveLoader';
import { SkeletonLoader } from '@/src/components/ui/SkeletonLoader';
import { Button } from '@/src/core/components/ui/button';
import { BoldCard } from '@/src/core/components/ui/BoldCard';
import { PageTitle } from '@/src/core/components/ui/page-title';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { Settings, useSettings } from '@/src/core/context/settings';
import { ClubData } from '@/src/core/models/YardageModel';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { usePremium } from '@/src/features/settings/context/premium';
import { useThemeMode, useThemeTokens } from '@/src/theme/ThemeProvider';
import { useNavigationPreference } from '@/src/stores/navigationPreference';
import { moderateScale, scaledFontSize, getScrollPadding, getBottomPadding } from '@/src/utils/responsive';
import React, { memo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
/** Props for settings components */
interface SettingsComponentProps {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
}

// Memoized unit preferences component (Imperial vs Metric)
const UnitPreferences = memo(
  ({ settings, updateSettings }: SettingsComponentProps) => {
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
    const isMetric =
      settings.distanceUnit === 'meters' &&
      settings.temperatureUnit === 'celsius' &&
      settings.altitudeUnit === 'meters' &&
      settings.speedUnit === 'kph';
    const isImperial =
      settings.distanceUnit === 'yards' &&
      settings.temperatureUnit === 'fahrenheit' &&
      settings.altitudeUnit === 'feet' &&
      settings.speedUnit === 'mph';

    const setMetric = () =>
      updateSettings({
        distanceUnit: 'meters',
        temperatureUnit: 'celsius',
        altitudeUnit: 'meters',
        speedUnit: 'kph',
      });

    const setImperial = () =>
      updateSettings({
        distanceUnit: 'yards',
        temperatureUnit: 'fahrenheit',
        altitudeUnit: 'feet',
        speedUnit: 'mph',
      });

    return (
      <BoldCard style={styles.section} accent>
        <SectionHeader title="Unit Preferences" />
        <View style={styles.unitGroup}>
          <Text style={styles.unitLabel}>Choose Units</Text>
          <View style={styles.buttonGroup}>
            <Button
              variant={isImperial ? 'default' : 'secondary'}
              onPress={setImperial}
              style={{ flex: 1, minWidth: 0 }}
            >
              Imperial
            </Button>
            <Button
              variant={isMetric ? 'default' : 'secondary'}
              onPress={setMetric}
              style={{ flex: 1, minWidth: 0 }}
            >
              Metric (kph)
            </Button>
          </View>
        </View>
      </BoldCard>
    );
  }
);

UnitPreferences.displayName = 'UnitPreferences';

// Memoized app permissions component
const AppPermissions = memo(
  ({ settings, updateSettings }: SettingsComponentProps) => {
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
    return (
      <BoldCard style={styles.section} accent>
        <SectionHeader title="App Permissions" />

        <View style={styles.unitGroup}>
          <View style={styles.clubHeader}>
            <Text style={styles.unitLabel}>Location Access</Text>
            <Switch
              value={settings.locationEnabled}
              onValueChange={value => updateSettings({ locationEnabled: value })}
              trackColor={{ false: palette.colors.border, true: palette.colors.brand }}
              thumbColor={
                settings.locationEnabled ? palette.colors.textPrimary : palette.colors.textMuted
              }
              accessibilityLabel="Toggle location access"
            />
          </View>

          <View style={styles.clubHeader}>
            <Text style={styles.unitLabel}>Compass Access</Text>
            <Switch
              value={settings.compassEnabled}
              onValueChange={value => updateSettings({ compassEnabled: value })}
              trackColor={{ false: palette.colors.border, true: palette.colors.brand }}
              thumbColor={
                settings.compassEnabled ? palette.colors.textPrimary : palette.colors.textMuted
              }
              accessibilityLabel="Toggle compass access"
            />
          </View>

          <View style={styles.clubHeader}>
            <Text style={styles.unitLabel}>Notifications</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={value => updateSettings({ notificationsEnabled: value })}
              trackColor={{ false: palette.colors.border, true: palette.colors.brand }}
              thumbColor={
                settings.notificationsEnabled
                  ? palette.colors.textPrimary
                  : palette.colors.textMuted
              }
              accessibilityLabel="Toggle notifications"
            />
          </View>

          <View style={styles.clubHeader}>
            <Text style={styles.unitLabel}>Activity Tracking</Text>
            <Switch
              value={settings.activityTrackingEnabled}
              onValueChange={value => updateSettings({ activityTrackingEnabled: value })}
              trackColor={{ false: palette.colors.border, true: palette.colors.brand }}
              thumbColor={
                settings.activityTrackingEnabled
                  ? palette.colors.textPrimary
                  : palette.colors.textMuted
              }
              accessibilityLabel="Toggle activity tracking"
            />
          </View>
        </View>
      </BoldCard>
    );
  }
);

AppPermissions.displayName = 'AppPermissions';

// Memoized add club form component
const AddClubForm = memo(
  ({
    newClub,
    handleNameChange,
    setNewClub,
    handleAddClub,
    settings,
  }: {
    newClub: { name: string; normalYardage: string };
    handleNameChange: (text: string) => void;
    setNewClub: (club: { name: string; normalYardage: string }) => void;
    handleAddClub: () => void;
    settings: Settings;
  }) => {
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
    return (
      <View style={styles.formGroup}>
        <TextInput
          placeholder="Club Name"
          value={newClub.name}
          onChangeText={handleNameChange}
          style={styles.input}
          placeholderTextColor={palette.colors.textMuted}
          accessibilityLabel="Club name"
        />
        <TextInput
          placeholder={`Normal Distance (${settings.distanceUnit})`}
          value={newClub.normalYardage}
          onChangeText={text => setNewClub({ ...newClub, normalYardage: text })}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={palette.colors.textMuted}
          accessibilityLabel={`Normal distance in ${settings.distanceUnit}`}
        />

        <Button variant="default" onPress={handleAddClub}>
          Add Club
        </Button>
      </View>
    );
  }
);

AddClubForm.displayName = 'AddClubForm';

// Memoized club item component
const ClubItem = memo(
  ({
    club,
    index,
    isEditing,
    editingValues,
    setEditingValues,
    handleSaveEdit,
    handleCancelEdit,
    handleEdit,
    removeClub,
    displayYardage,
    settings,
  }: {
    club: ClubData;
    index: number;
    isEditing: boolean;
    editingValues: { name: string; normalYardage: string };
    setEditingValues: (values: { name: string; normalYardage: string }) => void;
    handleSaveEdit: (index: number) => void;
    handleCancelEdit: () => void;
    handleEdit: (index: number) => void;
    removeClub: (index: number) => void;
    displayYardage: number;
    settings: Settings;
  }) => {
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
    return (
      <View style={styles.clubItem}>
        <View style={styles.clubContent}>
          <View style={styles.clubHeader}>
            {isEditing ? (
              <TextInput
                value={editingValues.name}
                onChangeText={text => setEditingValues({ ...editingValues, name: text })}
                style={[styles.input, styles.editInput]}
                placeholder="Club Name"
                placeholderTextColor={palette.colors.textMuted}
                accessibilityLabel="Edit club name"
              />
            ) : (
              <Text style={styles.clubName}>{club.name}</Text>
            )}
            <View style={styles.clubActions}>
              {isEditing ? (
                <>
                  <Button variant="default" onPress={() => handleSaveEdit(index)} size="sm">
                    Save
                  </Button>
                  <Button variant="secondary" onPress={handleCancelEdit} size="sm">
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Pressable onPress={() => handleEdit(index)}>
                    <Text style={styles.actionText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => removeClub(index)}>
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
          {isEditing ? (
            <TextInput
              value={editingValues.normalYardage}
              onChangeText={text => setEditingValues({ ...editingValues, normalYardage: text })}
              keyboardType="numeric"
              style={[styles.input, styles.editInput]}
              placeholder={`Distance (${settings.distanceUnit})`}
              placeholderTextColor={palette.colors.textMuted}
              accessibilityLabel={`Edit distance in ${settings.distanceUnit}`}
            />
          ) : (
            <Text style={styles.clubDetails}>
              {Math.round(displayYardage)} {settings.distanceUnit}
            </Text>
          )}
        </View>
      </View>
    );
  }
);

ClubItem.displayName = 'ClubItem';

// Memoized club management component
const ClubManagement = memo(
  ({
    clubs,
    newClub,
    handleNameChange,
    setNewClub,
    handleAddClub,
    editingIndex,
    editingValues,
    setEditingValues,
    handleSaveEdit,
    handleCancelEdit,
    handleEdit,
    removeClub,
    settings,
    convertDistance,
  }: {
    clubs: ClubData[];
    newClub: { name: string; normalYardage: string };
    handleNameChange: (text: string) => void;
    setNewClub: (club: { name: string; normalYardage: string }) => void;
    handleAddClub: () => void;
    editingIndex: number | null;
    editingValues: { name: string; normalYardage: string };
    setEditingValues: (values: { name: string; normalYardage: string }) => void;
    handleSaveEdit: (index: number) => void;
    handleCancelEdit: () => void;
    handleEdit: (index: number) => void;
    removeClub: (index: number) => void;
    settings: Settings;
    convertDistance: (value: number, unit: 'meters' | 'yards') => number;
  }) => {
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
    return (
      <BoldCard style={styles.section} accent>
        <SectionHeader title="Club Management" />

        {/* Add New Club Form */}
        <AddClubForm
          newClub={newClub}
          handleNameChange={handleNameChange}
          setNewClub={setNewClub}
          handleAddClub={handleAddClub}
          settings={settings}
        />

        {clubs.map((club, index) => {
          const isEditing = editingIndex === index;
          const displayYardage =
            settings.distanceUnit === 'meters'
              ? convertDistance(club.normalYardage, 'meters')
              : club.normalYardage;

          return (
            <ClubItem
              key={`club-${club.name}-${index}`}
              club={club}
              index={index}
              isEditing={isEditing}
              editingValues={editingValues}
              setEditingValues={setEditingValues}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
              handleEdit={handleEdit}
              removeClub={removeClub}
              displayYardage={displayYardage}
              settings={settings}
            />
          );
        })}
      </BoldCard>
    );
  }
);

ClubManagement.displayName = 'ClubManagement';

// Memoized premium upgrade component
const PremiumUpgrade = memo(
  ({ setShowUpgradeModal }: { setShowUpgradeModal: (show: boolean) => void }) => {
    const palette = useThemeTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
    return (
      <BoldCard style={styles.premiumCard} variant="premium" glow glowColor="amber">
        <SectionHeader title="Premium" />
        <Text style={styles.premiumText}>Premium Features Locked</Text>
        <Button variant="default" size="lg" onPress={() => setShowUpgradeModal(true)}>
          Upgrade Now
        </Button>
      </BoldCard>
    );
  }
);

PremiumUpgrade.displayName = 'PremiumUpgrade';

// Memoized navigation style toggle component
const NavigationStyleToggle = memo(() => {
  const palette = useThemeTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);
  const { style: navStyle, setStyle } = useNavigationPreference();

  const handleToggle = async (newStyle: 'classic' | 'redesign') => {
    await setStyle(newStyle);
    Alert.alert(
      'Navigation Changed',
      `Switched to ${newStyle === 'redesign' ? 'New 3-Tab' : 'Classic 5-Tab'} navigation. The app will reload to apply changes.`,
      [
        {
          text: 'Reload Now',
          onPress: async () => {
            try {
              await Updates.reloadAsync();
            } catch {
              // Fallback for development mode where Updates isn't available
              Alert.alert('Please restart the app to see the changes.');
            }
          },
        },
        { text: 'Later', style: 'cancel' },
      ]
    );
  };

  return (
    <BoldCard style={styles.section} accent>
      <SectionHeader title="Navigation Style" />
      <View style={styles.unitGroup}>
        <Text style={styles.unitLabel}>Choose Layout</Text>
        <View style={styles.buttonGroup}>
          <Button
            variant={navStyle === 'classic' ? 'default' : 'secondary'}
            onPress={() => handleToggle('classic')}
            style={{ flex: 1, minWidth: 0 }}
          >
            Classic (5 tabs)
          </Button>
          <Button
            variant={navStyle === 'redesign' ? 'default' : 'secondary'}
            onPress={() => handleToggle('redesign')}
            style={{ flex: 1, minWidth: 0 }}
          >
            New (3 tabs)
          </Button>
        </View>
        <Text style={[styles.clubDetails, { marginTop: 8 }]}>
          {navStyle === 'redesign'
            ? 'Streamlined 3-tab layout: Play, Stats, Setup'
            : 'Classic 5-tab layout: Weather, Shot, Wind, Clubs, Settings'}
        </Text>
      </View>
    </BoldCard>
  );
});

NavigationStyleToggle.displayName = 'NavigationStyleToggle';

// Main settings screen component
export default function SettingsScreen() {
  const { settings, updateSettings, convertDistance } = useSettings();
  const { clubs, addClub, updateClub, removeClub } = useClubSettings();
  const { isPremium, setShowUpgradeModal } = usePremium();
  const palette = useThemeTokens();
  const { mode, setMode } = useThemeMode();
  const insets = useSafeAreaInsets();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newClub, setNewClub] = useState({ name: '', normalYardage: '' });
  const [editingValues, setEditingValues] = useState({ name: '', normalYardage: '' });
  const [isLoading, setIsLoading] = useState(false);
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);

  // Calculate bottom padding to account for FloatingTabBar and safe area
  const bottomPadding = getBottomPadding(insets.bottom);

  // Default club yardages from clubs.tsx
  const defaultYardages: Record<string, number> = {
    Driver: 300,
    '3-Wood': 260,
    '5-Wood': 235,
    Hybrid: 235,
    '3-Iron': 235,
    '4-Iron': 220,
    '5-Iron': 205,
    '6-Iron': 192,
    '7-Iron': 180,
    '8-Iron': 165,
    '9-Iron': 153,
    PW: 138,
    GW: 125,
    SW: 110,
    LW: 90,
  };

  // Auto-fill yardage when club name is entered
  const handleNameChange = (text: string) => {
    const yardage = defaultYardages[text] || '';
    setNewClub({
      name: text,
      normalYardage: yardage ? yardage.toString() : '',
    });
  };

  const handleAddClub = () => {
    if (!newClub.name || !newClub.normalYardage) return;

    const numericYardage = parseFloat(newClub.normalYardage) || 0;
    const processedYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(numericYardage, 'yards')
        : numericYardage;

    const clubData: ClubData = {
      name: newClub.name,
      normalYardage: processedYardage,
      ball_speed: 0,
      launch_angle: 0,
      spin_rate: 0,
      max_height: 0,
      land_angle: 0,
      spin_decay: 0,
      wind_sensitivity: 1.0,
    };

    setIsLoading(true);

    // Simulate a short loading state for better UX
    setTimeout(() => {
      addClub(clubData);
      setNewClub({ name: '', normalYardage: '' });
      setIsLoading(false);
    }, 300);
  };

  const handleEdit = (index: number) => {
    const club = clubs[index];
    // When editing, convert the stored yardage to the current unit system for display
    const displayYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(club.normalYardage, 'meters')
        : club.normalYardage;

    setEditingValues({
      name: club.name,
      normalYardage: Math.round(displayYardage).toString(),
    });
    setEditingIndex(index);
  };

  const handleSaveEdit = (index: number) => {
    const numericYardage = parseFloat(editingValues.normalYardage) || 0;
    const processedYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(numericYardage, 'yards')
        : numericYardage;

    const updatedClub: ClubData = {
      ...clubs[index],
      name: editingValues.name,
      normalYardage: processedYardage,
    };

    setIsLoading(true);

    // Simulate a short loading state for better UX
    setTimeout(() => {
      updateClub(index, updatedClub);
      setEditingIndex(null);
      setIsLoading(false);
    }, 300);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  // Utilities handlers
  const resetToDefaults = async () => {
    try {
      setIsLoading(true);
      await updateSettings({
        distanceUnit: 'yards',
        temperatureUnit: 'fahrenheit',
        altitudeUnit: 'feet',
        speedUnit: 'mph',
        locationEnabled: false,
        compassEnabled: false,
        notificationsEnabled: false,
        activityTrackingEnabled: false,
      } as any);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'AICaddy Pro',
          body: 'This is a test notification.',
          sound: true,
        },
        // Fire immediately to ensure cross-platform behavior and avoid type mismatch
        trigger: null,
      });
    } catch (e) {
      console.error('Failed to schedule test notification', e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: palette.colors.background, paddingBottom: bottomPadding }]}
      >
        <PageTitle title="Settings" showGlow={true} showGradient={true} />

        {/* Theme Toggle */}
        <BoldCard style={styles.section} accent>
          <SectionHeader title="Appearance" />
          <View style={styles.unitGroup}>
            <Text style={styles.unitLabel}>Theme</Text>
            <View style={styles.buttonGroup}>
              <Button
                variant={mode === 'light' ? 'default' : 'secondary'}
                onPress={() => setMode('light')}
              >
                Light
              </Button>
              <Button
                variant={mode === 'dark' ? 'default' : 'secondary'}
                onPress={() => setMode('dark')}
              >
                Dark
              </Button>
              <Button
                variant={mode === 'system' ? 'default' : 'secondary'}
                onPress={() => setMode('system')}
              >
                System
              </Button>
            </View>
          </View>
        </BoldCard>

        {/* Navigation Style Toggle */}
        <NavigationStyleToggle />

        {/* Unit Preferences with Progressive Loading */}
        <ProgressiveLoader
          priority={LoadPriority.HIGH}
          isLoading={isLoading}
          skeleton={<SkeletonLoader type="card" height={200} />}
        >
          <UnitPreferences settings={settings} updateSettings={updateSettings} />
        </ProgressiveLoader>

        {/* App Permissions with Progressive Loading */}
        <ProgressiveLoader
          priority={LoadPriority.MEDIUM}
          isLoading={isLoading}
          skeleton={<SkeletonLoader type="card" height={180} />}
        >
          <AppPermissions settings={settings} updateSettings={updateSettings} />
        </ProgressiveLoader>

        {/* Club Management with Progressive Loading */}
        <ProgressiveLoader
          priority={LoadPriority.LOW}
          isLoading={isLoading}
          skeleton={<SkeletonLoader type="card" height={300} />}
        >
          <ClubManagement
            clubs={clubs}
            newClub={newClub}
            handleNameChange={handleNameChange}
            setNewClub={setNewClub}
            handleAddClub={handleAddClub}
            editingIndex={editingIndex}
            editingValues={editingValues}
            setEditingValues={setEditingValues}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
            handleEdit={handleEdit}
            removeClub={removeClub}
            settings={settings}
            convertDistance={convertDistance}
          />
        </ProgressiveLoader>

        {/* Utilities */}
        <BoldCard style={styles.section} accent>
          <SectionHeader title="Utilities" />
          <View style={styles.buttonGroup}>
            <Button variant="secondary" onPress={resetToDefaults}>
              Restore Defaults
            </Button>
            <Button variant="default" onPress={testNotification}>
              Test Notification
            </Button>
          </View>
        </BoldCard>

        {/* Premium Upgrade Card */}
        {!isPremium && (
          <ProgressiveLoader
            priority={LoadPriority.LOW}
            isLoading={isLoading}
            skeleton={<SkeletonLoader type="card" height={100} />}
          >
            <PremiumUpgrade setShowUpgradeModal={setShowUpgradeModal} />
          </ProgressiveLoader>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Spacing values aligned with token system:
// t.spacing.xs = 4, t.spacing.sm = 8, t.spacing.base = 12, t.spacing.md = 16, t.spacing.lg = 24
function getThemedStyles(palette: ReturnType<typeof useThemeTokens>) {
  const scrollPadding = getScrollPadding(16);
  return StyleSheet.create({
    container: {
      paddingHorizontal: scrollPadding,
      paddingTop: 16, // t.spacing.md
      backgroundColor: 'transparent',
      minHeight: '100%',
      alignItems: 'stretch',
    },
    title: {
      fontSize: scaledFontSize(24),
      fontWeight: '700',
      color: palette.colors.textPrimary,
      marginBottom: 24, // t.spacing.lg
    },
    section: {
      marginBottom: 16, // t.spacing.md - section gap
      backgroundColor: 'transparent',
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: scaledFontSize(18),
      fontWeight: '600',
      color: palette.colors.textPrimary,
      marginBottom: 16, // t.spacing.md
    },
    unitGroup: {
      marginBottom: 16, // t.spacing.md
      backgroundColor: 'transparent',
      padding: 12, // t.spacing.base
      borderRadius: 8,
    },
    unitLabel: {
      color: palette.colors.textPrimary,
      fontSize: scaledFontSize(16),
      marginBottom: 8, // t.spacing.sm
      fontWeight: '600',
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: 8, // t.spacing.sm
      justifyContent: 'space-between',
    },
    formGroup: {
      gap: 12, // t.spacing.base
      marginBottom: 16, // t.spacing.md
      backgroundColor: 'transparent',
      padding: 12, // t.spacing.base
      borderRadius: 8,
    },
    input: {
      backgroundColor: palette.colors.surface,
      color: palette.colors.textPrimary,
      borderRadius: 8,
      padding: 12, // t.spacing.base
      fontSize: scaledFontSize(16),
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    editInput: {
      marginBottom: 4, // t.spacing.xs
      paddingVertical: 8, // t.spacing.sm
    },
    clubItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12, // t.spacing.base
      backgroundColor: 'transparent',
      borderRadius: 8,
      marginBottom: 8, // t.spacing.sm
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    clubName: {
      color: palette.colors.textPrimary,
      fontSize: scaledFontSize(16),
      fontWeight: '600',
    },
    clubDetails: {
      color: palette.colors.textMuted,
      fontSize: scaledFontSize(14),
    },
    clubContent: {
      flex: 1,
      width: '100%',
    },
    clubHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8, // t.spacing.sm
    },
    clubActions: {
      flexDirection: 'row',
      gap: 16, // t.spacing.md
      alignItems: 'center',
    },
    actionText: {
      color: palette.colors.brand,
      fontSize: scaledFontSize(14),
      fontWeight: '600',
    },
    dropdown: {
      marginTop: 8, // t.spacing.sm
      backgroundColor: 'transparent',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: palette.colors.border,
      overflow: 'hidden',
    },
    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 12, // t.spacing.base
      borderBottomWidth: 1,
      borderBottomColor: palette.colors.border,
    },
    dropdownItemText: {
      color: palette.colors.textPrimary,
      fontSize: scaledFontSize(14),
    },
    deleteText: {
      color: palette.colors.danger,
      fontWeight: '600',
    },
    yardageInput: {
      marginTop: 4, // t.spacing.xs
      marginBottom: 4, // t.spacing.xs
      paddingVertical: 8, // t.spacing.sm
    },
    premiumCard: {
      marginTop: 24, // t.spacing.lg
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: 12,
    },
    premiumText: {
      color: palette.colors.textPrimary,
      fontSize: scaledFontSize(18),
      fontWeight: '700',
      marginBottom: 16, // t.spacing.md
    },
  });
}
