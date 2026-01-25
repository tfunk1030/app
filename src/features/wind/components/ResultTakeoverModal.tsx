/**
 * ResultTakeoverModal.tsx
 *
 * Full-screen modal overlay that displays wind calculation results
 * with prominent, easy-to-read formatting for on-course use.
 *
 * Per interview decision GPT #10: Combined message format "Play 186 yards, aim 4 left"
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTokens } from '@/src/theme/useTokens';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import type { WindCalculatorResult } from '../hooks/useWindCalculator';
import { DualResultCard } from './results/DualResultCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { safeScaledFontSize } from '@/src/utils/responsive';

/**
 * HeroMessage - The "north star" combined play+aim message
 * Per interview: "Play 186 yards, aim 4 left"
 */
function HeroMessage({
  playDistance,
  lateralEffect,
  unit = 'yds',
}: {
  playDistance: number;
  lateralEffect: number;
  unit?: string;
}) {
  const t = useTokens();

  // Format the aim part
  const roundedLateral = Math.abs(Math.round(lateralEffect));
  const aimDirection = lateralEffect > 0 ? 'right' : 'left';
  const hasAim = lateralEffect !== 0;

  // Accessibility label with full description
  const accessibilityLabel = hasAim
    ? `Play ${Math.round(playDistance)} ${unit}, aim ${roundedLateral} ${aimDirection}`
    : `Play ${Math.round(playDistance)} ${unit}`;

  return (
    <View
      style={[styles.heroMessage, { backgroundColor: t.colors.surfaceAlt }]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.heroText, { color: t.colors.textPrimary }]}>
        Play{' '}
        <Text style={[styles.heroValue, { color: t.colors.brand }]}>
          {Math.round(playDistance)}
        </Text>
        {' '}{unit}
        {hasAim && (
          <>
            , aim{' '}
            <Text style={[styles.heroValue, { color: t.colors.warning }]}>
              {roundedLateral}
            </Text>
            {' '}{aimDirection}
          </>
        )}
      </Text>
    </View>
  );
}

interface ResultTakeoverModalProps {
  visible: boolean;
  result: WindCalculatorResult | null;
  onDismiss: () => void;
}

export function ResultTakeoverModal({ visible, result, onDismiss }: ResultTakeoverModalProps) {
  const t = useTokens();
  const { getEnteringAnimation, getExitingAnimation } = useReduceMotion();

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  if (!result) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        entering={getEnteringAnimation(FadeIn.duration(200))}
        exiting={getExitingAnimation(FadeOut.duration(200))}
        style={styles.overlay}
      >
        <BlurView intensity={40} style={StyleSheet.absoluteFill} />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal"
        />

        <Animated.View
          entering={getEnteringAnimation(SlideInDown.springify().damping(20))}
          exiting={getExitingAnimation(SlideOutDown.duration(200))}
          style={[styles.content, { backgroundColor: t.colors.surface }]}
        >
          {/* North Star Message - "Play X yards, aim Y left/right" */}
          <HeroMessage
            playDistance={result.effectivePlayingDistance}
            lateralEffect={result.lateralEffect}
            unit="yds"
          />

          {/* Gust Result - Show if significantly different */}
          {result.gustResult && result.gustResult.effectivePlayingDistance !== result.effectivePlayingDistance && (
            <DualResultCard
              sustainedDistance={result.effectivePlayingDistance}
              gustDistance={result.gustResult.effectivePlayingDistance}
              unit="yds"
            />
          )}

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
  // North star hero message - "Play X, aim Y"
  heroMessage: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  heroText: {
    fontSize: safeScaledFontSize(22),
    fontWeight: '500',
    textAlign: 'center',
  },
  heroValue: {
    fontSize: safeScaledFontSize(28),
    fontWeight: '700',
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
