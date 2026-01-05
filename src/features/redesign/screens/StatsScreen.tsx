/**
 * StatsScreen - Performance Analytics
 *
 * Data-focused screen for users who want deeper insights:
 * - Club performance tracking
 * - Round history
 * - Environmental conditions log
 * - Strokes gained analysis (premium)
 *
 * Design: Bento grid layout with modular stat cards
 */

import React, { useState, useCallback, memo } from 'react';
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
} from 'lucide-react-native';

import { useRedesignTheme } from '@/src/theme/redesign';
import { MetricPill } from '@/src/components/redesign/MetricPill';

// =============================================================================
// TYPES
// =============================================================================

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

interface ClubStat {
  name: string;
  avgDistance: number;
  accuracy: number;
  uses: number;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_CLUB_STATS: ClubStat[] = [
  { name: '7-Iron', avgDistance: 168, accuracy: 78, uses: 45 },
  { name: 'Driver', avgDistance: 265, accuracy: 62, uses: 38 },
  { name: 'PW', avgDistance: 125, accuracy: 85, uses: 52 },
  { name: '5-Iron', avgDistance: 195, accuracy: 71, uses: 28 },
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Stat Card - Bento grid item
 */
const StatCard = memo(function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  size = 'medium',
  onPress,
}: StatCardProps) {
  const { colors, tokens } = useRedesignTheme();

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

  const cardStyle = [
    styles.statCard,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    size === 'small' && styles.statCardSmall,
    size === 'large' && styles.statCardLarge,
  ];

  const content = (
    <>
      <View style={styles.statCardHeader}>
        {icon && <View style={styles.statCardIcon}>{icon}</View>}
        <Text
          style={[styles.statCardTitle, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <Text
        style={[
          styles.statCardValue,
          size === 'large' && styles.statCardValueLarge,
          { color: colors.textPrimary },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      {(subtitle || trendValue) && (
        <View style={styles.statCardFooter}>
          {subtitle && (
            <Text style={[styles.statCardSubtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
          {trendValue && TrendIcon && (
            <View style={styles.trendContainer}>
              <TrendIcon size={12} color={getTrendColor()} />
              <Text style={[styles.trendValue, { color: getTrendColor() }]}>
                {trendValue}
              </Text>
            </View>
          )}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={cardStyle}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${value}`}
      >
        {content}
        <ChevronRight
          size={16}
          color={colors.textMuted}
          style={styles.cardChevron}
        />
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} accessibilityRole="text" accessibilityLabel={`${title}: ${value}`}>
      {content}
    </View>
  );
});

/**
 * Club Performance Row
 */
const ClubPerformanceRow = memo(function ClubPerformanceRow({
  club,
}: {
  club: ClubStat;
}) {
  const { colors } = useRedesignTheme();

  return (
    <View style={[styles.clubRow, { borderBottomColor: colors.divider }]}>
      <View style={styles.clubNameContainer}>
        <Text style={[styles.clubName, { color: colors.textPrimary }]}>
          {club.name}
        </Text>
        <Text style={[styles.clubUses, { color: colors.textMuted }]}>
          {club.uses} shots
        </Text>
      </View>

      <View style={styles.clubStats}>
        <View style={styles.clubStatItem}>
          <Text style={[styles.clubStatValue, { color: colors.textPrimary }]}>
            {club.avgDistance}
          </Text>
          <Text style={[styles.clubStatLabel, { color: colors.textMuted }]}>
            avg yds
          </Text>
        </View>

        <View style={styles.clubStatItem}>
          <Text
            style={[
              styles.clubStatValue,
              {
                color:
                  club.accuracy >= 75
                    ? colors.success
                    : club.accuracy >= 60
                    ? colors.warning
                    : colors.error,
              },
            ]}
          >
            {club.accuracy}%
          </Text>
          <Text style={[styles.clubStatLabel, { color: colors.textMuted }]}>
            accuracy
          </Text>
        </View>
      </View>
    </View>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StatsScreen() {
  const { colors, tokens, isDark } = useRedesignTheme();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'clubs' | 'rounds'>('overview');

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
              onPress={() => setSelectedTab(tab)}
              style={[
                styles.tab,
                selectedTab === tab && {
                  backgroundColor: colors.brandMuted,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedTab === tab }}
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
            {/* Bento Grid */}
            <Animated.View entering={FadeIn} style={styles.bentoGrid}>
              {/* Large Card - Overall Score */}
              <StatCard
                title="Overall Score"
                value="76.2"
                subtitle="Last 10 rounds"
                trend="up"
                trendValue="-2.4"
                icon={<Award size={18} color={colors.brand} />}
                size="large"
              />

              {/* Row of small cards */}
              <View style={styles.bentoRow}>
                <StatCard
                  title="Fairways"
                  value="64%"
                  trend="up"
                  trendValue="+5%"
                  icon={<Target size={16} color={colors.success} />}
                  size="small"
                />
                <StatCard
                  title="GIR"
                  value="52%"
                  trend="neutral"
                  icon={<Crosshair size={16} color={colors.info} />}
                  size="small"
                />
              </View>

              <View style={styles.bentoRow}>
                <StatCard
                  title="Putts/Round"
                  value="31.4"
                  trend="down"
                  trendValue="-1.2"
                  size="small"
                />
                <StatCard
                  title="Rounds"
                  value="24"
                  subtitle="This season"
                  icon={<Clock size={16} color={colors.textMuted} />}
                  size="small"
                />
              </View>
            </Animated.View>

            {/* Strokes Gained Teaser */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <Pressable
                style={[
                  styles.premiumBanner,
                  {
                    backgroundColor: colors.brandMuted,
                    borderColor: colors.brand,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Unlock Strokes Gained Analysis with Premium"
              >
                <View style={styles.premiumBannerLeft}>
                  <Zap size={20} color={colors.brand} />
                  <View>
                    <Text style={[styles.premiumBannerTitle, { color: colors.textPrimary }]}>
                      Strokes Gained Analysis
                    </Text>
                    <Text style={[styles.premiumBannerSubtitle, { color: colors.textMuted }]}>
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
          <Animated.View
            entering={FadeIn}
            style={[styles.clubsContainer, { backgroundColor: colors.surface }]}
          >
            <View style={styles.clubsHeader}>
              <Text style={[styles.clubsTitle, { color: colors.textPrimary }]}>
                Club Performance
              </Text>
              <BarChart3 size={20} color={colors.textMuted} />
            </View>

            {MOCK_CLUB_STATS.map((club, index) => (
              <ClubPerformanceRow key={club.name} club={club} />
            ))}

            <Pressable
              style={[styles.viewAllButton, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="View all clubs"
            >
              <Text style={[styles.viewAllText, { color: colors.brand }]}>
                View All Clubs
              </Text>
              <ChevronRight size={16} color={colors.brand} />
            </Pressable>
          </Animated.View>
        )}

        {/* Rounds Tab */}
        {selectedTab === 'rounds' && (
          <Animated.View entering={FadeIn} style={styles.roundsContainer}>
            <View
              style={[styles.emptyState, { backgroundColor: colors.surface }]}
            >
              <Clock size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Rounds Yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Track your rounds to see history and trends
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const SMALL_CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

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

  // Bento Grid
  bentoGrid: {
    gap: CARD_GAP,
    marginBottom: 16,
  },

  bentoRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },

  // Stat Card
  statCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
  },

  statCardSmall: {
    flex: 1,
    minHeight: 100,
  },

  statCardLarge: {
    minHeight: 140,
  },

  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  statCardIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  statCardValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  statCardValueLarge: {
    fontSize: 40,
    letterSpacing: -1,
  },

  statCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  statCardSubtitle: {
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

  cardChevron: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  // Premium Banner
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  premiumBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  premiumBannerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Clubs Container
  clubsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  clubsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },

  clubsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },

  clubNameContainer: {
    flex: 1,
  },

  clubName: {
    fontSize: 16,
    fontWeight: '600',
  },

  clubUses: {
    fontSize: 13,
    marginTop: 2,
  },

  clubStats: {
    flexDirection: 'row',
    gap: 24,
  },

  clubStatItem: {
    alignItems: 'flex-end',
  },

  clubStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },

  clubStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 4,
  },

  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Rounds / Empty State
  roundsContainer: {
    flex: 1,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    borderRadius: 16,
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

export default StatsScreen;
