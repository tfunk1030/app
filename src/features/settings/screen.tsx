import { Button } from '@/src/core/components/ui/button';
import { GlassCard } from '@/src/core/components/ui/GlassCard';
import { PremiumCard } from '@/src/core/components/ui/PremiumCard';
import { useSettings } from '@/src/core/context/settings';
import { ClubData } from '@/src/core/models/YardageModel';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { usePremium } from '@/src/features/settings/context/premium';
import { useSubscription } from '@/src/stores/subscription';
import { useCustomerCenter } from '@/src/core/components/ui/CustomerCenter';
import { useAccessibleAnimations } from '@/src/hooks/useAccessibility';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { Tokens } from '@/src/theme/tokens';
import { useTokens } from '@/src/theme/useTokens';
import { safeScaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Crown,
  Moon,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Ruler,
  Settings,
  Sun,
  Trash2,
} from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, ViewStyle, TextStyle } from 'react-native';
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
  tokens: Tokens;
}

const SegmentedControl = React.memo<SegmentedControlProps>(({
  options,
  value,
  onChange,
  tokens: t,
}) => {
  const segmentStyles = React.useMemo(() => ({
    container: {
      flexDirection: 'row' as const,
      borderRadius: t.borderRadius.lg,
      padding: t.spacing.xs,
      gap: t.spacing.xs,
      backgroundColor: t.colors.surfaceAlt,
    },
    option: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: t.spacing.sm - 2, // 6px for icon-text gap
      paddingVertical: t.spacing.sm + 2, // 10px
      paddingHorizontal: t.spacing.base,
      borderRadius: t.borderRadius.md + 2, // 10px for inner segments
      borderWidth: t.borderWidth.thin,
      borderColor: 'transparent',
    },
    optionSelected: {
      backgroundColor: t.colors.surface,
      borderColor: t.colors.brand,
    },
    text: {
      fontSize: safeScaledFontSize(t.fontSize.sm),
      fontWeight: t.fontWeight.semibold,
    },
  }), [t]);

  return (
    <View style={segmentStyles.container} accessibilityRole="radiogroup">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              segmentStyles.option,
              isSelected && segmentStyles.optionSelected,
            ]}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected }}
          >
            {option.icon && (
              <View accessibilityElementsHidden={true}>
                {option.icon}
              </View>
            )}
            <Text
              style={[
                segmentStyles.text,
                { color: isSelected ? t.colors.textPrimary : t.colors.textMuted },
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
  tokens: Tokens;
  showChevron?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  value,
  onPress,
  tokens: t,
  showChevron = true,
}) => {
  const rowStyles = React.useMemo(() => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: t.spacing.base,
      paddingHorizontal: t.spacing.xs,
      borderRadius: t.borderRadius.md,
    },
    left: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.base,
    },
    iconContainer: {
      width: t.containerSize.icon.md, // 44px
      height: t.containerSize.icon.md,
      borderRadius: t.borderRadius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: t.colors.brandBackgroundAlpha,
    },
    label: {
      fontSize: safeScaledFontSize(t.fontSize.sm + 1), // 15px
      fontWeight: t.fontWeight.medium,
    },
    right: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
    },
    value: {
      fontSize: safeScaledFontSize(t.fontSize.sm),
    },
  }), [t]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rowStyles.container,
        { backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}
    >
      <View style={rowStyles.left}>
        <View style={rowStyles.iconContainer} accessibilityElementsHidden={true}>
          {icon}
        </View>
        <Text style={[rowStyles.label, { color: t.colors.textPrimary }]}>{label}</Text>
      </View>
      <View style={rowStyles.right}>
        {value && (
          <Text style={[rowStyles.value, { color: t.colors.textMuted }]}>{value}</Text>
        )}
        {showChevron && <ChevronRight size={18} color={t.colors.textMuted} accessibilityElementsHidden={true} />}
      </View>
    </Pressable>
  );
};

// Club Item Component
interface ClubItemProps {
  club: ClubData;
  displayYardage: number;
  unit: string;
  onEdit: () => void;
  onDelete: () => void;
  tokens: Tokens;
}

const ClubItem = React.memo<ClubItemProps>(({
  club,
  displayYardage,
  unit,
  onEdit,
  onDelete,
  tokens: t,
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

  const clubStyles = React.useMemo(() => ({
    item: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: t.spacing.base + 2, // 14px
      borderBottomWidth: t.borderWidth.thin,
      borderBottomColor: t.colors.border,
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: safeScaledFontSize(t.fontSize.base),
      fontWeight: t.fontWeight.semibold,
      marginBottom: 2,
    },
    distance: {
      fontSize: safeScaledFontSize(t.fontSize.xs + 1), // 13px
    },
    distanceValue: {
      fontWeight: t.fontWeight.semibold,
      ...Platform.select({
        ios: { fontFamily: 'Menlo' },
        android: { fontFamily: 'monospace' },
      }),
    },
    actions: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
    },
    actionButton: {
      width: t.containerSize.icon.md, // 44px
      height: t.containerSize.icon.md,
      borderRadius: t.borderRadius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  }), [t]);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[clubStyles.item, animatedStyle]}
      accessibilityLabel={`${club.name}, ${Math.round(displayYardage)} ${unit}`}
    >
      <View style={clubStyles.info}>
        <Text style={[clubStyles.name, { color: t.colors.textPrimary }]}>{club.name}</Text>
        <Text style={[clubStyles.distance, { color: t.colors.textMuted }]}>
          <Text style={clubStyles.distanceValue}>{Math.round(displayYardage)}</Text> {unit}
        </Text>
      </View>
      <View style={clubStyles.actions}>
        <Pressable
          onPress={onEdit}
          style={[clubStyles.actionButton, { backgroundColor: t.colors.brandBackgroundAlpha }]}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${club.name}`}
        >
          <Pencil size={16} color={t.colors.brand} accessibilityElementsHidden={true} />
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={[clubStyles.actionButton, { backgroundColor: t.colors.dangerBackgroundAlpha }]}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${club.name}`}
        >
          <Trash2 size={16} color={t.colors.danger} accessibilityElementsHidden={true} />
        </Pressable>
      </View>
    </AnimatedPressable>
  );
});

// Create memoized styles function
const createStyles = (t: Tokens) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  } as ViewStyle,
  contentContainer: {
    paddingBottom: t.spacing['5xl'],
  } as ViewStyle,
  title: {
    fontSize: safeScaledFontSize(t.fontSize['4xl'] - 4), // 32px
    fontWeight: t.fontWeight.bold,
    letterSpacing: t.letterSpacing.tight,
    marginBottom: t.spacing.xs,
  } as TextStyle,
  subtitle: {
    fontSize: safeScaledFontSize(t.fontSize.sm + 1), // 15px
    fontWeight: t.fontWeight.medium,
    marginBottom: t.spacing.lg,
  } as TextStyle,
  sectionCard: {
    marginBottom: t.spacing.md,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.sm + 2, // 10px
    marginBottom: t.spacing.md,
  } as ViewStyle,
  sectionHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  } as ViewStyle,
  sectionTitle: {
    fontSize: safeScaledFontSize(t.fontSize.lg - 1), // 17px
    fontWeight: t.fontWeight.semibold,
  } as TextStyle,
  iconContainer: {
    width: t.containerSize.icon.sm,
    height: t.containerSize.icon.sm,
    borderRadius: t.borderRadius.md,
    overflow: 'hidden' as const,
  } as ViewStyle,
  iconGradient: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  clubIconText: {
    color: t.colors.onBrand, // Fix: was hardcoded #fff
    fontSize: safeScaledFontSize(t.fontSize.base),
    fontWeight: t.fontWeight.bold,
  } as TextStyle,
  unitHint: {
    fontSize: safeScaledFontSize(t.fontSize.xs),
    textAlign: 'center' as const,
    marginTop: t.spacing.base,
  } as TextStyle,
  addButton: {
    width: t.containerSize.icon.md,
    height: t.containerSize.icon.md,
    borderRadius: t.borderRadius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.colors.brandBackgroundAlpha,
  } as ViewStyle,
  formContainer: {
    marginTop: t.spacing.md,
    paddingTop: t.spacing.md,
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: t.colors.border, // Fix: was hardcoded rgba(255,255,255,0.1)
    gap: t.spacing.base,
  } as ViewStyle,
  input: {
    height: t.containerSize.input.lg,
    borderWidth: t.borderWidth.thin,
    borderRadius: t.borderRadius.lg,
    paddingHorizontal: t.spacing.md,
    fontSize: safeScaledFontSize(t.fontSize.sm + 1), // 15px
  } as TextStyle,
  formButtons: {
    flexDirection: 'row' as const,
    gap: t.spacing.base,
    marginTop: t.spacing.xs,
  } as ViewStyle,
  formButton: {
    flex: 1,
  } as ViewStyle,
  clubList: {
    marginTop: t.spacing.sm,
  } as ViewStyle,
  emptyText: {
    fontSize: safeScaledFontSize(t.fontSize.sm),
    textAlign: 'center' as const,
    paddingVertical: t.spacing.lg,
  } as TextStyle,
  versionText: {
    fontSize: safeScaledFontSize(t.fontSize.xs),
    textAlign: 'center' as const,
    marginTop: t.spacing.sm,
  } as TextStyle,
  trialBadge: {
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xs - 2,
    borderRadius: t.borderRadius.sm,
    marginLeft: 'auto' as const,
  } as ViewStyle,
  trialBadgeText: {
    fontSize: safeScaledFontSize(t.fontSize.xs - 1),
    fontWeight: t.fontWeight.bold,
    letterSpacing: 0.5,
  } as TextStyle,
  subscriptionInfo: {
    marginTop: t.spacing.xs,
  } as ViewStyle,
  subscriptionStatus: {
    fontSize: safeScaledFontSize(t.fontSize.base),
    fontWeight: t.fontWeight.semibold,
  } as TextStyle,
  subscriptionExpiry: {
    fontSize: safeScaledFontSize(t.fontSize.sm),
    marginTop: t.spacing.xs - 2,
  } as TextStyle,
  restoreRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: t.spacing.sm,
  } as ViewStyle,
  restoreContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.base,
  } as ViewStyle,
  restoreText: {
    fontSize: safeScaledFontSize(t.fontSize.sm + 1),
    fontWeight: t.fontWeight.medium,
  } as TextStyle,
});

export default function SettingsScreen() {
  const tokens = useTokens();
  const { mode, setMode } = useThemeMode();
  const { settings, updateSettings, convertDistance } = useSettings();
  const { clubs, addClub, updateClub, removeClub } = useClubSettings();
  const { isPremium, isTrialActive, isLifetime, planType, expirationDate, setShowUpgradeModal, setShowRevenueCatPaywall } = usePremium();
  const { restorePurchases, isLoading: isRestoring } = useSubscription();
  const { openCustomerCenter } = useCustomerCenter();
  const insets = useSafeAreaInsets();
  const { headerEntering, cardEntering, quickFade } = useAccessibleAnimations();
  const [editingClubId, setEditingClubId] = React.useState<string | null>(null);
  const [newClub, setNewClub] = React.useState({ name: '', normalYardage: '', loft: '' });
  const [showAddForm, setShowAddForm] = React.useState(false);

  // Memoized styles
  const styles = React.useMemo(() => createStyles(tokens), [tokens]);
  const padding = getScrollPadding(tokens.spacing.md, { minPadding: tokens.spacing.base, maxPadding: 20 });

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

    if (editingClubId !== null) {
      updateClub(editingClubId, clubData as ClubData);
    } else {
      addClub(clubData as ClubData);
    }

    setNewClub({ name: '', normalYardage: '', loft: '' });
    setEditingClubId(null);
    setShowAddForm(false);
  };

  const handleEdit = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    if (!club) return;

    const displayYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(club.normalYardage, 'meters')
        : club.normalYardage;

    setNewClub({
      name: club.name,
      normalYardage: displayYardage.toString(),
      loft: '',
    });
    setEditingClubId(clubId);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setNewClub({ name: '', normalYardage: '', loft: '' });
    setEditingClubId(null);
    setShowAddForm(false);
  };

  // Determine current unit preset
  const isImperial =
    settings.distanceUnit === 'yards' &&
    settings.temperatureUnit === 'fahrenheit' &&
    settings.altitudeUnit === 'feet';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + tokens.spacing.md, paddingHorizontal: padding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={headerEntering}>
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]} accessibilityRole="header">
          Settings
        </Text>
        <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
          Customize your experience
        </Text>
      </Animated.View>

      {/* Theme Selection */}
      <Animated.View entering={cardEntering(0)}>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={tokens.colors.brand} accessibilityElementsHidden={true} />
            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]} accessibilityRole="header">
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
            <Ruler size={20} color={tokens.colors.brand} accessibilityElementsHidden={true} />
            <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]} accessibilityRole="header">
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
              <View style={[styles.iconContainer, { backgroundColor: tokens.colors.brandBackgroundAlpha }]}>
                <LinearGradient
                  colors={tokens.gradients.primary as [string, string, ...string[]]}
                  style={styles.iconGradient}
                >
                  <Text style={styles.clubIconText}>G</Text>
                </LinearGradient>
              </View>
              <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]} accessibilityRole="header">
                My Clubs
              </Text>
            </View>
            {!showAddForm && (
              <Pressable
                onPress={() => setShowAddForm(true)}
                style={styles.addButton}
                accessibilityRole="button"
                accessibilityLabel="Add new club"
              >
                <Plus size={20} color={tokens.colors.brand} accessibilityElementsHidden={true} />
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
                accessibilityLabel="Club name"
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
                accessibilityLabel={`Club distance in ${settings.distanceUnit}`}
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
                  {editingClubId !== null ? 'Update' : 'Add Club'}
                </Button>
              </View>
            </Animated.View>
          )}

          {/* Club List */}
          <View style={styles.clubList}>
            {clubs.map((club, index) => {
              const clubId = club.id || `fallback-${club.name}-${index}`;
              const displayYardage =
                settings.distanceUnit === 'meters'
                  ? convertDistance(club.normalYardage, 'meters')
                  : club.normalYardage;

              return (
                <ClubItem
                  key={clubId}
                  club={club}
                  displayYardage={displayYardage}
                  unit={settings.distanceUnit === 'yards' ? 'yds' : 'm'}
                  onEdit={() => handleEdit(clubId)}
                  onDelete={() => removeClub(clubId)}
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

      {/* Premium Status (for premium users) */}
      {isPremium && !__DEV__ && (
        <Animated.View entering={cardEntering(3)}>
          <GlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Crown size={20} color={tokens.colors.brand} accessibilityElementsHidden={true} />
              <Text style={[styles.sectionTitle, { color: tokens.colors.textPrimary }]} accessibilityRole="header">
                Premium
              </Text>
              {isTrialActive && (
                <View style={[styles.trialBadge, { backgroundColor: `${tokens.colors.success}20` }]}>
                  <Text style={[styles.trialBadgeText, { color: tokens.colors.success }]}>
                    FREE TRIAL
                  </Text>
                </View>
              )}
              {isLifetime && (
                <View style={[styles.trialBadge, { backgroundColor: `${tokens.colors.brand}20` }]}>
                  <Text style={[styles.trialBadgeText, { color: tokens.colors.brand }]}>
                    LIFETIME
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={[styles.subscriptionStatus, { color: tokens.colors.textPrimary }]}>
                {isLifetime ? 'Lifetime Access' : isTrialActive ? 'Trial Active' : `${planType === 'yearly' ? 'Annual' : 'Monthly'} Premium`}
              </Text>
              {expirationDate && !isLifetime && (
                <Text style={[styles.subscriptionExpiry, { color: tokens.colors.textMuted }]}>
                  {isTrialActive ? 'Trial ends' : 'Renews'}:{' '}
                  {new Date(expirationDate).toLocaleDateString()}
                </Text>
              )}
            </View>

            {/* Manage Subscription Button */}
            <Pressable
              onPress={openCustomerCenter}
              style={[
                styles.restoreRow,
                { marginTop: tokens.spacing.base, borderTopWidth: tokens.borderWidth.thin, borderTopColor: tokens.colors.border },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Manage subscription"
            >
              <View style={styles.restoreContent}>
                <Settings size={20} color={tokens.colors.brand} />
                <Text style={[styles.restoreText, { color: tokens.colors.textPrimary }]}>
                  Manage Subscription
                </Text>
              </View>
              <ChevronRight size={18} color={tokens.colors.textMuted} />
            </Pressable>
          </GlassCard>
        </Animated.View>
      )}

      {/* Premium Upsell (for free users) */}
      {!isPremium && (
        <Animated.View entering={cardEntering(3)}>
          <PremiumCard onUpgrade={() => setShowUpgradeModal(true)} />
        </Animated.View>
      )}

      {/* Restore Purchases */}
      <Animated.View entering={cardEntering(4)}>
        <GlassCard style={styles.sectionCard}>
          <Pressable
            onPress={restorePurchases}
            disabled={isRestoring}
            style={[
              styles.restoreRow,
              { opacity: isRestoring ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
          >
            <View style={styles.restoreContent}>
              <RefreshCw
                size={20}
                color={tokens.colors.brand}
                style={isRestoring ? { transform: [{ rotate: '45deg' }] } : undefined}
              />
              <Text style={[styles.restoreText, { color: tokens.colors.textPrimary }]}>
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </View>
            <ChevronRight size={18} color={tokens.colors.textMuted} />
          </Pressable>
        </GlassCard>
      </Animated.View>

      {/* Version Info */}
      <Animated.View entering={cardEntering(5)}>
        <Text style={[styles.versionText, { color: tokens.colors.textMuted }]}>
          AICaddy Pro v1.0.0
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

