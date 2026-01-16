/**
 * ResultTakeoverModal.tsx
 *
 * Full-screen modal overlay that displays wind calculation results
 * with prominent, easy-to-read formatting for on-course use.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTokens } from '@/src/theme/useTokens';
import type { WindCalculatorResult } from '../hooks/useWindCalculator';
import { DualResultCard } from './results/DualResultCard';
import { PrimaryRecommendation } from './results/PrimaryRecommendation';
import { LateralAdjustment } from './results/LateralAdjustment';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { safeScaledFontSize } from '@/src/utils/responsive';

interface ResultTakeoverModalProps {
  visible: boolean;
  result: WindCalculatorResult | null;
  onDismiss: () => void;
}

export function ResultTakeoverModal({ visible, result, onDismiss }: ResultTakeoverModalProps) {
  const t = useTokens();

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  if (!result) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <BlurView intensity={40} style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.content, { backgroundColor: t.colors.surface }]}
        >
          {/* Hero Result Display */}
          {result.gustResult ? (
            <DualResultCard
              sustainedDistance={result.effectivePlayingDistance}
              gustDistance={result.gustResult.effectivePlayingDistance}
              unit="yds"
            />
          ) : (
            <PrimaryRecommendation effectiveDistance={result.effectivePlayingDistance} />
          )}

          {/* Aim Direction - Prominent */}
          <LateralAdjustment lateralEffect={result.lateralEffect} />

          {/* Club Recommendation - Hero Style */}
          <View style={[styles.clubContainer, { backgroundColor: t.colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="golf" size={32} color={t.colors.brand} />
            <Text style={[styles.clubName, { color: t.colors.brand }]}>
              {result.recommendedClub}
            </Text>
            {result.clubChange && (
              <Text style={[styles.clubChangeNote, { color: t.colors.textMuted }]}>
                (adjusted from {result.initialClub})
              </Text>
            )}
          </View>

          {/* Dismiss Button */}
          <Pressable
            style={[styles.dismissButton, { backgroundColor: t.colors.surfaceAlt }]}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss results"
          >
            <Text style={[styles.dismissText, { color: t.colors.textMuted }]}>
              Tap anywhere to dismiss
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  clubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 16,
    width: '100%',
    flexWrap: 'wrap',
  },
  clubName: {
    fontSize: safeScaledFontSize(24),
    fontWeight: '700',
  },
  clubChangeNote: {
    fontSize: safeScaledFontSize(12),
    fontStyle: 'italic',
    width: '100%',
    textAlign: 'center',
    marginTop: 4,
  },
  dismissButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  dismissText: {
    fontSize: safeScaledFontSize(14),
    fontWeight: '500',
  },
});

export default ResultTakeoverModal;
