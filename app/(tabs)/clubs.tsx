/**
 * Club Library Screen
 *
 * Modern Bold & Colorful design with:
 * - BoldCard for club items with gradient accents
 * - Dense scrollless layout for common cases
 * - Empty state design
 * - Progressive loading
 */

import { EmptyState } from '@/src/components/EmptyState';
import { LoadPriority, ProgressiveLoader } from '@/src/components/ui/ProgressiveLoader';
import { SkeletonLoader } from '@/src/components/ui/SkeletonLoader';
import { BoldCard } from '@/src/core/components/ui/BoldCard';
import { Button } from '@/src/core/components/ui/button';
import { GradientHero } from '@/src/core/components/ui/GradientHero';
import { PageTitle } from '@/src/core/components/ui/page-title';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import { useSettings } from '@/src/core/context/settings';
import { ClubData } from '@/src/core/models/YardageModel';
import { useClubSettings } from '@/src/features/settings/context/clubs';
import { useTokens } from '@/src/theme/useTokens';
import { PerformanceMonitor } from '@/src/utils/PerformanceMonitor';
import { moderateScale, scaledFontSize, getScrollPadding } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Target, Trash2, Edit3, Package } from 'lucide-react-native';
import React, { memo, useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { gradients, boldColors } from '@/src/theme/gradients';

// Themed styles factory
// Spacing values aligned with token system:
// t.spacing.xs = 4, t.spacing.sm = 8, t.spacing.base = 12, t.spacing.md = 16, t.spacing.lg = 24
function getThemedStyles(palette: ReturnType<typeof useTokens>) {
  const scrollPadding = getScrollPadding(16);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.colors.background },
    contentContainer: {
      paddingHorizontal: scrollPadding,
      paddingTop: 16, // t.spacing.md
      paddingBottom: moderateScale(100), // Space for floating tab bar
    },
    clubCard: {
      marginBottom: 16, // t.spacing.md - card spacing
    },
    clubCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    clubInfo: {
      flex: 1,
    },
    clubName: {
      fontSize: scaledFontSize(18),
      fontWeight: '700',
      color: palette.colors.textPrimary,
      marginBottom: 4, // t.spacing.xs
    },
    clubDistance: {
      fontSize: scaledFontSize(14),
      color: palette.colors.textMuted,
    },
    clubActions: {
      flexDirection: 'row',
      gap: 12, // t.spacing.base
    },
    actionButton: {
      padding: 8, // t.spacing.sm
      borderRadius: 8,
      backgroundColor: palette.colors.surfaceAlt,
    },
    // Add club modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: palette.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24, // t.spacing.lg
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24, // t.spacing.lg
    },
    modalTitle: {
      fontSize: scaledFontSize(20),
      fontWeight: '700',
      color: palette.colors.textPrimary,
    },
    modalClose: {
      padding: 8, // t.spacing.sm
    },
    input: {
      backgroundColor: palette.colors.surfaceAlt,
      color: palette.colors.textPrimary,
      borderRadius: 12,
      padding: 16, // t.spacing.md
      fontSize: scaledFontSize(16),
      borderWidth: 1,
      borderColor: palette.colors.border,
      marginBottom: 16, // t.spacing.md
    },
    // Quick add section
    quickAddContainer: {
      marginBottom: 16, // t.spacing.md
    },
    quickAddTitle: {
      fontSize: scaledFontSize(14),
      fontWeight: '600',
      color: palette.colors.textMuted,
      marginBottom: 12, // t.spacing.base
    },
    quickAddGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8, // t.spacing.sm
    },
    quickAddChip: {
      paddingHorizontal: 14,
      paddingVertical: 8, // t.spacing.sm
      borderRadius: 20,
      backgroundColor: palette.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: palette.colors.border,
    },
    quickAddChipText: {
      fontSize: scaledFontSize(13),
      color: palette.colors.textPrimary,
      fontWeight: '500',
    },
    // Header actions
    headerActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 16, // t.spacing.md
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // t.spacing.sm
      paddingVertical: 10,
      paddingHorizontal: 16, // t.spacing.md
      borderRadius: 12,
      overflow: 'hidden',
    },
    addButtonText: {
      fontSize: scaledFontSize(14),
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // Stats bar
    statsBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16, // t.spacing.md
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: scaledFontSize(24),
      fontWeight: '700',
      color: palette.colors.textPrimary,
    },
    statLabel: {
      fontSize: scaledFontSize(12),
      color: palette.colors.textMuted,
      marginTop: 4, // t.spacing.xs
    },
  });
}

// Get glow color for club type
const getClubGlowColor = (clubName: string): 'primary' | 'cyan' | 'amber' | 'violet' => {
  const name = clubName.toLowerCase();
  if (name.includes('driver') || name.includes('wood')) return 'primary';
  if (name.includes('iron')) return 'cyan';
  if (name.includes('wedge') || name.includes('pw') || name.includes('gw') || name.includes('sw') || name.includes('lw')) return 'amber';
  return 'violet';
};

// Memoized club card component
const ClubCard = memo(
  ({
    club,
    index,
    onEdit,
    onDelete,
    distanceUnit,
    convertDistance,
  }: {
    club: ClubData;
    index: number;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
    distanceUnit: string;
    convertDistance: (value: number, unit: 'meters' | 'yards') => number;
  }) => {
    const palette = useTokens();
    const styles = React.useMemo(() => getThemedStyles(palette), [palette]);

    const displayYardage =
      distanceUnit === 'meters'
        ? Math.round(convertDistance(club.normalYardage, 'meters'))
        : Math.round(club.normalYardage);

    const handleEdit = useCallback(async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics not available
      }
      onEdit(index);
    }, [index, onEdit]);

    const handleDelete = useCallback(async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Haptics not available
      }
      Alert.alert(
        'Delete Club',
        `Are you sure you want to delete ${club.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(index),
          },
        ]
      );
    }, [club.name, index, onDelete]);

    const glowColor = getClubGlowColor(club.name);

    return (
      <Animated.View entering={FadeIn.delay(index * 50).duration(300)}>
        <BoldCard
          style={styles.clubCard}
          variant="elevated"
          glow
          glowColor={glowColor}
          accent
        >
          <View style={styles.clubCardContent}>
            <View style={styles.clubInfo}>
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubDistance}>
                {displayYardage} {distanceUnit}
              </Text>
            </View>
            <View style={styles.clubActions}>
              <Pressable
                style={styles.actionButton}
                onPress={handleEdit}
                accessibilityLabel={`Edit ${club.name}`}
                accessibilityRole="button"
              >
                <Edit3 size={18} color={palette.colors.brand} />
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={handleDelete}
                accessibilityLabel={`Delete ${club.name}`}
                accessibilityRole="button"
              >
                <Trash2 size={18} color={palette.colors.danger} />
              </Pressable>
            </View>
          </View>
        </BoldCard>
      </Animated.View>
    );
  }
);

ClubCard.displayName = 'ClubCard';

// Quick add club options (common club names with typical distances)
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

// Main club library screen
export default function ClubLibraryScreen() {
  const { settings, convertDistance } = useSettings();
  const { clubs, addClub, updateClub, removeClub } = useClubSettings();
  const palette = useTokens();
  const styles = React.useMemo(() => getThemedStyles(palette), [palette]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [clubName, setClubName] = useState('');
  const [clubDistance, setClubDistance] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle add club
  const handleOpenAddModal = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics not available
    }
    setEditingIndex(null);
    setClubName('');
    setClubDistance('');
    setModalVisible(true);
  }, []);

  // Handle edit club
  const handleEdit = useCallback(
    (index: number) => {
      const club = clubs[index];
      const displayYardage =
        settings.distanceUnit === 'meters'
          ? Math.round(convertDistance(club.normalYardage, 'meters'))
          : Math.round(club.normalYardage);

      setEditingIndex(index);
      setClubName(club.name);
      setClubDistance(displayYardage.toString());
      setModalVisible(true);
    },
    [clubs, settings.distanceUnit, convertDistance]
  );

  // Handle delete club
  const handleDelete = useCallback(
    async (index: number) => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics not available
      }
      removeClub(index);
    },
    [removeClub]
  );

  // Handle save club (add or update)
  const handleSaveClub = useCallback(async () => {
    if (!clubName.trim() || !clubDistance.trim()) return;

    setIsLoading(true);

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics not available
    }

    const numericYardage = parseFloat(clubDistance) || 0;
    const processedYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(numericYardage, 'yards')
        : numericYardage;

    const clubData: ClubData = {
      name: clubName.trim(),
      normalYardage: processedYardage,
      ball_speed: 0,
      launch_angle: 0,
      spin_rate: 0,
      max_height: 0,
      land_angle: 0,
      spin_decay: 0,
      wind_sensitivity: 1.0,
    };

    setTimeout(() => {
      if (editingIndex !== null) {
        updateClub(editingIndex, clubData);
      } else {
        addClub(clubData);
      }
      setModalVisible(false);
      setIsLoading(false);
    }, 300);
  }, [
    clubName,
    clubDistance,
    settings.distanceUnit,
    convertDistance,
    editingIndex,
    updateClub,
    addClub,
  ]);

  // Handle quick add
  const handleQuickAdd = useCallback(
    async (name: string, yardage: number) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics not available
      }
      setClubName(name);
      const displayYardage =
        settings.distanceUnit === 'meters'
          ? Math.round(yardage * 0.9144)
          : yardage;
      setClubDistance(displayYardage.toString());
    },
    [settings.distanceUnit]
  );

  // Render club item
  const renderClubItem = useCallback(
    ({ item, index }: { item: ClubData; index: number }) => (
      <ClubCard
        club={item}
        index={index}
        onEdit={handleEdit}
        onDelete={handleDelete}
        distanceUnit={settings.distanceUnit}
        convertDistance={convertDistance}
      />
    ),
    [handleEdit, handleDelete, settings.distanceUnit, convertDistance]
  );

  // Calculate stats
  const longestClub = clubs.length > 0 ? clubs[0] : null;
  const shortestClub = clubs.length > 0 ? clubs[clubs.length - 1] : null;

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient Hero Background */}
      <GradientHero variant="clubs" height="compact" safeAreaTop paddingBottom={0}>
        <PageTitle title="Club Library" showGlow={true} showGradient={true} />
      </GradientHero>

      {/* Main Content */}
      <View style={styles.container}>
        <ProgressiveLoader
          priority={LoadPriority.HIGH}
          isLoading={false}
          skeleton={<SkeletonLoader type="card" count={3} />}
        >
          {clubs.length === 0 ? (
            <EmptyState
              title="No Clubs Yet"
              message="Add your clubs to get personalized recommendations based on your actual distances."
              icon={Package}
              actionLabel="Add Your First Club"
              onAction={handleOpenAddModal}
            />
          ) : (
            <>
              {/* Stats Bar */}
              <BoldCard style={{ marginHorizontal: getScrollPadding(16), marginTop: 16, marginBottom: 16 }} variant="highlight">
                <View style={styles.statsBar}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{clubs.length}</Text>
                    <Text style={styles.statLabel}>Clubs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {longestClub
                        ? settings.distanceUnit === 'meters'
                          ? Math.round(convertDistance(longestClub.normalYardage, 'meters'))
                          : Math.round(longestClub.normalYardage)
                        : '-'}
                    </Text>
                    <Text style={styles.statLabel}>Longest ({settings.distanceUnit})</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {shortestClub
                        ? settings.distanceUnit === 'meters'
                          ? Math.round(convertDistance(shortestClub.normalYardage, 'meters'))
                          : Math.round(shortestClub.normalYardage)
                        : '-'}
                    </Text>
                    <Text style={styles.statLabel}>Shortest ({settings.distanceUnit})</Text>
                  </View>
                </View>
              </BoldCard>

              {/* Add Button */}
              <View style={[styles.headerActions, { paddingHorizontal: getScrollPadding(16) }]}>
                <Pressable onPress={handleOpenAddModal} accessibilityLabel="Add new club" accessibilityRole="button">
                  <LinearGradient
                    colors={gradients.primary as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addButton}
                  >
                    <Plus size={18} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add Club</Text>
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Club List */}
              <FlatList
                data={clubs}
                keyExtractor={(item, index) => `club-${item.name}-${index}`}
                renderItem={renderClubItem}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
              />
            </>
          )}
        </ProgressiveLoader>
      </View>

      {/* Add/Edit Club Modal */}
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
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIndex !== null ? 'Edit Club' : 'Add Club'}
              </Text>
              <Pressable
                style={styles.modalClose}
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <Text style={{ color: palette.colors.brand, fontSize: scaledFontSize(16) }}>
                  Cancel
                </Text>
              </Pressable>
            </View>

            {/* Quick Add Section */}
            {editingIndex === null && (
              <View style={styles.quickAddContainer}>
                <Text style={styles.quickAddTitle}>Quick Add</Text>
                <View style={styles.quickAddGrid}>
                  {QUICK_ADD_CLUBS.map((club) => (
                    <Pressable
                      key={club.name}
                      style={styles.quickAddChip}
                      onPress={() => handleQuickAdd(club.name, club.yardage)}
                      accessibilityLabel={`Quick add ${club.name}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.quickAddChipText}>{club.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Club Name Input */}
            <TextInput
              style={styles.input}
              placeholder="Club Name"
              placeholderTextColor={palette.colors.textMuted}
              value={clubName}
              onChangeText={setClubName}
              accessibilityLabel="Club name input"
            />

            {/* Distance Input */}
            <TextInput
              style={styles.input}
              placeholder={`Distance (${settings.distanceUnit})`}
              placeholderTextColor={palette.colors.textMuted}
              value={clubDistance}
              onChangeText={setClubDistance}
              keyboardType="numeric"
              accessibilityLabel={`Club distance in ${settings.distanceUnit}`}
            />

            {/* Save Button */}
            <Button
              variant="default"
              onPress={handleSaveClub}
              disabled={!clubName.trim() || !clubDistance.trim() || isLoading}
            >
              {isLoading ? 'Saving...' : editingIndex !== null ? 'Update Club' : 'Add Club'}
            </Button>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Performance Monitor - Development only */}
      <PerformanceMonitor visible={__DEV__} position="top-right" detailed />
    </View>
  );
}
