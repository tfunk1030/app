import { Button } from '@/src/core/components/ui/button';
import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { PremiumCard } from '@/src/core/components/ui/PremiumCard';
import { useSettings } from '@/src/core/context/settings';
import { ClubData } from '@/src/core/models/YardageModel';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { usePremium } from '@/src/features/settings/context/premium';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { useTokens } from '@/src/theme/useTokens';
import { safeScaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Moon,
  Palette,
  Pencil,
  Plus,
  Ruler,
  Sun,
  Trash2,
} from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Segmented Control Component
interface SegmentedControlProps {
  options: { label: string; value: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  tokens: ReturnType<typeof useTokens>;
}

const SegmentedControl = React.memo<SegmentedControlProps>(({
  options,
  value,
  onChange,
  tokens,
}) => {
  return (
    <View style={[styles.segmentedControl, { backgroundColor: tokens.colors.surfaceAlt }]}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.segmentOption,
              isSelected && {
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.brand,
              },
            ]}
          >
            {option.icon}
            <Text
              style={[
                styles.segmentText,
                {
                  color: isSelected ? tokens.colors.textPrimary : tokens.colors.textMuted,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

// Settings Row Component
interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  tokens: ReturnType<typeof useTokens>;
  showChevron?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  value,
  onPress,
  tokens,
  showChevron = true,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.settingsRow,
      { backgroundColor: pressed ? tokens.colors.surfaceAlt : 'transparent' },
    ]}
  >
    <View style={styles.settingsRowLeft}>
      <View style={[styles.settingsRowIcon, { backgroundColor: `${tokens.colors.brand}15` }]}>
        {icon}
      </View>
      <Text style={[styles.settingsRowLabel, { color: tokens.colors.textPrimary }]}>{label}</Text>
    </View>
    <View style={styles.settingsRowRight}>
      {value && (
        <Text style={[styles.settingsRowValue, { color: tokens.colors.textMuted }]}>{value}</Text>
      )}
      {showChevron && <ChevronRight size={18} color={tokens.colors.textMuted} />}
    </View>
  </Pressable>
);

// Club Item Component
interface ClubItemProps {
  club: ClubData;
  displayYardage: number;
  unit: string;
  onEdit: () => void;
  onDelete: () => void;
  tokens: ReturnType<typeof useTokens>;
}

const ClubItem = React.memo<ClubItemProps>(({
  club,
  displayYardage,
  unit,
  onEdit,
  onDelete,
  tokens,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = React.useCallback(() => {
    scale.value = withSpring(0.98);
  }, [scale]);

  const handlePressOut = React.useCallback(() => {
    scale.value = withSpring(1);
  }, [scale]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.clubItem, { borderBottomColor: tokens.colors.border }, animatedStyle]}
    >
      <View style={styles.clubInfo}>
        <Text style={[styles.clubName, { color: tokens.colors.textPrimary }]}>{club.name}</Text>
        <Text style={[styles.clubDistance, { color: tokens.colors.textMuted }]}>
          <Text style={styles.clubDistanceValue}>{Math.round(displayYardage)}</Text> {unit}
        </Text>
      </View>
      <View style={styles.clubActions}>
        <Pressable
          onPress={onEdit}
          style={[styles.clubActionButton, { backgroundColor: `${tokens.colors.brand}15` }]}
        >
          <Pencil size={16} color={tokens.colors.brand} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={[styles.clubActionButton, { backgroundColor: `${tokens.colors.danger}15` }]}
        >
          <Trash2 size={16} color={tokens.colors.danger} />
        </Pressable>
      </View>
    </AnimatedPressable>
  );
});

export default function SettingsScreen() {
  const tokens = useTokens();
  const { mode, setMode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const { settings, updateSettings, convertDistance } = useSettings();
  const { clubs, addClub, updateClub, removeClub } = useClubSettings();
  const { isPremium, setShowUpgradeModal } = usePremium();
  const insets = useSafeAreaInsets();
  const { headerEntering, cardEntering, quickFade } = useAccessibleAnimations();
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [newClub, setNewClub] = React.useState({ name: '', normalYardage: '', loft: '' });
  const [showAddForm, setShowAddForm] = React.useState(false);

  const padding = getScrollPadding(16, { minPadding: 12, maxPadding: 20 });

  const handleSave = () => {
    const numericYardage = parseInt(newClub.normalYardage) || 0;
    const processedYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(numericYardage, 'yards')
        : numericYardage;

    const clubData: Partial<ClubData> = {
      name: newClub.name,
      normalYardage: processedYardage,
      ball_speed: 0,
      launch_angle: 0,
      spin_rate: 0,
      max_height: 0,
      land_angle: 0,
      spin_decay: 0,
      wind_sensitivity: 0,
    };

    if (editingIndex !== null) {
      updateClub(editingIndex, clubData as ClubData);
    } else {
      addClub(clubData as ClubData);
    }

    setNewClub({ name: '', normalYardage: '', loft: '' });
    setEditingIndex(null);
    setShowAddForm(false);
  };

  const handleEdit = (index: number) => {
    const club = clubs[index];
    const displayYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(club.normalYardage, 'meters')
        : club.normalYardage;

    setNewClub({
      name: club.name,
      normalYardage: displayYardage.toString(),
      loft: '',
    });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setNewClub({ name: '', normalYardage: '', loft: '' });
    setEditingIndex(null);
    setShowAddForm(false);
  };

  // Determine current unit preset
  const isImperial =
    settings.distanceUnit === 'yards' &&
    settings.temperatureUnit === 'fahrenheit' &&
    settings.altitudeUnit === 'feet';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + 16, paddingHorizontal: padding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={headerEntering}>
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
          Customize your experience
        </Text>
      </Animated.View>

      {/* Theme Selection */}
      <Animated.View entering={cardEntering(0)}>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={tokens.colors.brand} />
            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>
              Appearance
            </Text>
          </View>
          <SegmentedControl
            options={[
              { label: 'Light', value: 'light', icon: <Sun size={16} color={tokens.colors.textMuted} /> },
              { label: 'Dark', value: 'dark', icon: <Moon size={16} color={tokens.colors.textMuted} /> },
              { label: 'System', value: 'system' },
            ]}
            value={mode}
            onChange={(value) => setMode(value as 'light' | 'dark' | 'system')}
            tokens={tokens}
          />
        </GlassCard>
      </Animated.View>

      {/* Unit Preferences */}
      <Animated.View entering={cardEntering(1)}>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ruler size={20} color={tokens.colors.brand} />
            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>
              Unit System
            </Text>
          </View>
          <SegmentedControl
            options={[
              { label: 'Imperial', value: 'imperial' },
              { label: 'Metric', value: 'metric' },
            ]}
            value={isImperial ? 'imperial' : 'metric'}
            onChange={(value) => {
              if (value === 'imperial') {
                updateSettings({
                  distanceUnit: 'yards',
                  temperatureUnit: 'fahrenheit',
                  altitudeUnit: 'feet',
                  speedUnit: 'mph',
                });
              } else {
                updateSettings({
                  distanceUnit: 'meters',
                  temperatureUnit: 'celsius',
                  altitudeUnit: 'meters',
                  speedUnit: 'kph',
                });
              }
            }}
            tokens={tokens}
          />
          <Text style={[styles.unitHint, { color: tokens.colors.textMuted }]}>
            {isImperial ? 'Yards, Fahrenheit, Feet, MPH' : 'Meters, Celsius, Meters, KPH'}
          </Text>
        </GlassCard>
      </Animated.View>

      {/* Club Management */}
      <Animated.View entering={cardEntering(2)}>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.brandAlt}15` }]}>
                <LinearGradient
                  colors={tokens.gradients.primary as [string, string, ...string[]]}
                  style={styles.iconGradient}
                >
                  <Text style={styles.clubIconText}>G</Text>
                </LinearGradient>
              </View>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]}>
                My Clubs
              </Text>
            </View>
            {!showAddForm && (
              <Pressable
                onPress={() => setShowAddForm(true)}
                style={[styles.addButton, { backgroundColor: `${tokens.colors.brand}15` }]}
              >
                <Plus size={20} color={tokens.colors.brand} />
              </Pressable>
            )}
          </View>

          {/* Add/Edit Form */}
          {showAddForm && (
            <Animated.View entering={quickFade} style={styles.formContainer}>
              <TextInput
                placeholder="Club Name (e.g., 7 Iron)"
                value={newClub.name}
                onChangeText={(text) => setNewClub({ ...newClub, name: text })}
                style={[
                  styles.input,
                  {
                    backgroundColor: tokens.colors.surfaceAlt,
                    borderColor: tokens.colors.border,
                    color: tokens.colors.textPrimary,
                  },
                ]}
                placeholderTextColor={tokens.colors.textMuted}
              />
              <TextInput
                placeholder={`Distance (${settings.distanceUnit})`}
                value={newClub.normalYardage}
                onChangeText={(text) => setNewClub({ ...newClub, normalYardage: text })}
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    backgroundColor: tokens.colors.surfaceAlt,
                    borderColor: tokens.colors.border,
                    color: tokens.colors.textPrimary,
                  },
                ]}
                placeholderTextColor={tokens.colors.textMuted}
              />
              <View style={styles.formButtons}>
                <Button variant="ghost" onPress={handleCancel} style={styles.formButton}>
                  Cancel
                </Button>
                <Button
                  variant="neon"
                  onPress={handleSave}
                  style={styles.formButton}
                  disabled={!newClub.name || !newClub.normalYardage}
                >
                  {editingIndex !== null ? 'Update' : 'Add Club'}
                </Button>
              </View>
            </Animated.View>
          )}

          {/* Club List */}
          <View style={styles.clubList}>
            {clubs.map((club, index) => {
              const displayYardage =
                settings.distanceUnit === 'meters'
                  ? convertDistance(club.normalYardage, 'meters')
                  : club.normalYardage;

              return (
                <ClubItem
                  key={index}
                  club={club}
                  displayYardage={displayYardage}
                  unit={settings.distanceUnit === 'yards' ? 'yds' : 'm'}
                  onEdit={() => handleEdit(index)}
                  onDelete={() => removeClub(index)}
                  tokens={tokens}
                />
              );
            })}
            {clubs.length === 0 && (
              <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                No clubs added yet
              </Text>
            )}
          </View>
        </GlassCard>
      </Animated.View>

      {/* Premium Upsell */}
      {!isPremium && (
        <Animated.View entering={cardEntering(3)}>
          <PremiumCard onUpgrade={() => setShowUpgradeModal(true)} />
        </Animated.View>
      )}

      {/* Version Info */}
      <Animated.View entering={cardEntering(4)}>
        <Text style={[styles.versionText, { color: tokens.colors.textMuted }]}>
          AICaddy Pro v1.0.0
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  title: {
    fontSize: safeScaledFontSize(32),
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: safeScaledFontSize(15),
    fontWeight: '500',
    marginBottom: 24,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: safeScaledFontSize(17),
    fontWeight: '600',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubIconText: {
    color: '#fff',
    fontSize: safeScaledFontSize(16),
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '600',
  },
  unitHint: {
    fontSize: safeScaledFontSize(12),
    textAlign: 'center',
    marginTop: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: safeScaledFontSize(15),
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  formButton: {
    flex: 1,
  },
  clubList: {
    marginTop: 8,
  },
  clubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: safeScaledFontSize(16),
    fontWeight: '600',
    marginBottom: 2,
  },
  clubDistance: {
    fontSize: safeScaledFontSize(13),
  },
  clubDistanceValue: {
    fontWeight: '600',
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
    }),
  },
  clubActions: {
    flexDirection: 'row',
    gap: 8,
  },
  clubActionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: safeScaledFontSize(14),
    textAlign: 'center',
    paddingVertical: 24,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowLabel: {
    fontSize: safeScaledFontSize(15),
    fontWeight: '500',
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsRowValue: {
    fontSize: safeScaledFontSize(14),
  },
  versionText: {
    fontSize: safeScaledFontSize(12),
    textAlign: 'center',
    marginTop: 8,
  },
});
