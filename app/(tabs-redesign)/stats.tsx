/**
 * Stats Tab - Performance Analytics with Visualizations
 *
 * Enhanced stats screen with:
 * - Club distance chart
 * - Accuracy visualization
 * - Recent rounds summary
 * - Strokes gained preview
 */

import React, { useState, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  ChevronRight,
  BarChart3,
  Crosshair,
  Zap,
  Flag,
  Circle,
} from 'lucide-react-native';

import { useRedesignTheme } from '@/src/theme/redesign';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { useSettings } from '@/src/core/context/settings';

// =============================================================================
// TYPES
// =============================================================================

interface ClubChartData {
  name: string;
  distance: number;
  maxDistance: number;
}

// =============================================================================
// MINI BAR CHART COMPONENT
// =============================================================================

interface BarChartProps {
  data: ClubChartData[];
  maxValue: number;
}

const MiniBarChart = memo(function MiniBarChart({ data, maxValue }: BarChartProps) {
  const { colors } = useRedesignTheme();

  return (
    <View style={chartStyles.container}>
      {data.map((item, index) => {
        const barWidth = (item.distance / maxValue) * 100;

        return (
          <View key={item.name} style={chartStyles.barRow}>
            <Text style={[chartStyles.barLabel, { color: colors.textMuted }]}>
              {item.name}
            </Text>
            <View style={chartStyles.barContainer}>
              <Animated.View
                entering={FadeIn.delay(index * 50)}
                style={[
                  chartStyles.bar,
                  {
                    width: `${barWidth}%`,
                    backgroundColor: colors.brand,
                  },
                ]}
              />
            </View>
            <Text style={[chartStyles.barValue, { color: colors.textPrimary }]}>
              {item.distance}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

const chartStyles = StyleSheet.create({
  container: {
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 60,
    fontSize: 12,
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
    opacity: 0.8,
  },
  barValue: {
    width: 40,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
});

// =============================================================================
// ACCURACY RING COMPONENT
// =============================================================================

interface AccuracyRingProps {
  percentage: number;
  label: string;
  size?: number;
}

const AccuracyRing = memo(function AccuracyRing({
  percentage,
  label,
  size = 80,
}: AccuracyRingProps) {
  const { colors } = useRedesignTheme();
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 70) return colors.success;
    if (percentage >= 50) return colors.warning;
    return colors.error;
  };

  return (
    <View style={[ringStyles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          ringStyles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.divider,
          },
        ]}
      />
      {/* Progress ring - simplified without SVG */}
      <View
        style={[
          ringStyles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: getColor(),
            borderRightColor: 'transparent',
            borderBottomColor: percentage > 50 ? getColor() : 'transparent',
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      {/* Center content */}
      <View style={ringStyles.center}>
        <Text style={[ringStyles.percentage, { color: colors.textPrimary }]}>
          {percentage}%
        </Text>
        <Text style={[ringStyles.label, { color: colors.textMuted }]}>
          {label}
        </Text>
      </View>
    </View>
  );
});

const ringStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  size = 'medium',
}: StatCardProps) {
  const { colors } = useRedesignTheme();

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return colors.success;
      case 'down':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <View
      style={[
        statStyles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        size === 'small' && statStyles.cardSmall,
        size === 'large' && statStyles.cardLarge,
      ]}
    >
      <View style={statStyles.header}>
        {icon && <View style={statStyles.icon}>{icon}</View>}
        <Text style={[statStyles.title, { color: colors.textMuted }]}>
          {title}
        </Text>
      </View>

      <Text
        style={[
          statStyles.value,
          size === 'large' && statStyles.valueLarge,
          { color: colors.textPrimary },
        ]}
      >
        {value}
      </Text>

      {(subtitle || trendValue) && (
        <View style={statStyles.footer}>
          {subtitle && (
            <Text style={[statStyles.subtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
          {trendValue && TrendIcon && (
            <View style={statStyles.trendContainer}>
              <TrendIcon size={12} color={getTrendColor()} />
              <Text style={[statStyles.trendValue, { color: getTrendColor() }]}>
                {trendValue}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

const statStyles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardSmall: {
    flex: 1,
    minHeight: 100,
  },
  cardLarge: {
    minHeight: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  valueLarge: {
    fontSize: 40,
    letterSpacing: -1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});

// =============================================================================
// MAIN SCREEN
// =============================================================================

export default function StatsScreen() {
  const { colors, tokens } = useRedesignTheme();
  const { clubs } = useClubSettings();
  const { settings, convertDistance } = useSettings();
  const insets = useSafeAreaInsets();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'clubs' | 'rounds'>('overview');

  // Prepare club chart data
  const clubChartData = useMemo((): ClubChartData[] => {
    if (clubs.length === 0) {
      // Mock data if no clubs
      return [
        { name: 'Driver', distance: 265, maxDistance: 300 },
        { name: '3-Wood', distance: 235, maxDistance: 300 },
        { name: '5-Iron', distance: 195, maxDistance: 300 },
        { name: '7-Iron', distance: 168, maxDistance: 300 },
        { name: 'PW', distance: 125, maxDistance: 300 },
      ];
    }

    const sortedClubs = [...clubs]
      .sort((a, b) => b.normalYardage - a.normalYardage)
      .slice(0, 6);

    const maxDistance = Math.max(...sortedClubs.map((c) => c.normalYardage), 300);

    return sortedClubs.map((club) => ({
      name: club.name,
      distance: Math.round(
        settings.distanceUnit === 'meters'
          ? convertDistance(club.normalYardage, 'meters')
          : club.normalYardage
      ),
      maxDistance,
    }));
  }, [clubs, settings.distanceUnit, convertDistance]);

  const maxClubDistance = Math.max(...clubChartData.map((c) => c.distance), 300);
  const unit = settings.distanceUnit === 'meters' ? 'm' : 'yds';

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
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Stats
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your performance insights
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabSelector, { backgroundColor: colors.surface }]}>
          {(['overview', 'clubs', 'rounds'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTab(tab);
              }}
              style={[
                styles.tab,
                selectedTab === tab && { backgroundColor: colors.brandMuted },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === tab ? colors.brand : colors.textMuted },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <>
            {/* Summary Stats */}
            <Animated.View entering={FadeIn} style={styles.statsGrid}>
              <StatCard
                title="Avg Score"
                value="78.4"
                subtitle="Last 10 rounds"
                trend="up"
                trendValue="-2.1"
                icon={<Award size={18} color={colors.brand} />}
                size="large"
              />

              <View style={styles.statsRow}>
                <StatCard
                  title="Fairways"
                  value="62%"
                  trend="up"
                  trendValue="+4%"
                  icon={<Target size={16} color={colors.success} />}
                  size="small"
                />
                <StatCard
                  title="GIR"
                  value="48%"
                  trend="neutral"
                  icon={<Flag size={16} color={colors.info} />}
                  size="small"
                />
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  title="Putts"
                  value="32.1"
                  subtitle="per round"
                  trend="down"
                  trendValue="-0.8"
                  size="small"
                />
                <StatCard
                  title="Rounds"
                  value="18"
                  subtitle="this season"
                  icon={<Clock size={16} color={colors.textMuted} />}
                  size="small"
                />
              </View>
            </Animated.View>

            {/* Accuracy Visualization */}
            <Animated.View
              entering={FadeInDown.delay(200)}
              style={[styles.accuracyCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Accuracy Breakdown
              </Text>
              <View style={styles.accuracyRings}>
                <AccuracyRing percentage={62} label="Fairways" />
                <AccuracyRing percentage={48} label="GIR" />
                <AccuracyRing percentage={71} label="Up & Down" />
              </View>
            </Animated.View>

            {/* Premium CTA */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <Pressable
                style={[
                  styles.premiumBanner,
                  { backgroundColor: colors.brandMuted, borderColor: colors.brand },
                ]}
              >
                <View style={styles.premiumLeft}>
                  <Zap size={20} color={colors.brand} />
                  <View>
                    <Text style={[styles.premiumTitle, { color: colors.textPrimary }]}>
                      Strokes Gained Analysis
                    </Text>
                    <Text style={[styles.premiumSubtitle, { color: colors.textMuted }]}>
                      Unlock with Premium
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.brand} />
              </Pressable>
            </Animated.View>
          </>
        )}

        {/* Clubs Tab */}
        {selectedTab === 'clubs' && (
          <Animated.View entering={FadeIn}>
            {/* Club Distance Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Club Distances
                </Text>
                <Text style={[styles.chartUnit, { color: colors.textMuted }]}>
                  {unit}
                </Text>
              </View>
              <MiniBarChart data={clubChartData} maxValue={maxClubDistance} />
            </View>

            {/* Club List */}
            <View style={[styles.clubList, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                My Bag ({clubs.length} clubs)
              </Text>

              {clubs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Add clubs in Setup to see your bag
                  </Text>
                </View>
              ) : (
                clubs.map((club, index) => {
                  const distance = Math.round(
                    settings.distanceUnit === 'meters'
                      ? convertDistance(club.normalYardage, 'meters')
                      : club.normalYardage
                  );

                  return (
                    <View
                      key={`${club.name}-${index}`}
                      style={[styles.clubRow, { borderBottomColor: colors.divider }]}
                    >
                      <Text style={[styles.clubName, { color: colors.textPrimary }]}>
                        {club.name}
                      </Text>
                      <Text style={[styles.clubDistance, { color: colors.textMuted }]}>
                        {distance} {unit}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </Animated.View>
        )}

        {/* Rounds Tab */}
        {selectedTab === 'rounds' && (
          <Animated.View entering={FadeIn}>
            <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
              <Clock size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Rounds Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Round tracking coming in a future update
              </Text>
            </View>
          </Animated.View>
        )}
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
    marginBottom: 20,
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

  // Tab Selector
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Stats Grid
  statsGrid: {
    gap: 10,
    marginBottom: 16,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Cards
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  accuracyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  accuracyRings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  chartUnit: {
    fontSize: 14,
    fontWeight: '500',
  },

  clubList: {
    borderRadius: 16,
    padding: 16,
  },

  clubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  clubName: {
    fontSize: 16,
    fontWeight: '500',
  },

  clubDistance: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },

  // Premium Banner
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },

  premiumLeft: {
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

  // Empty States
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,
  },

  emptyCard: {
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },

  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
