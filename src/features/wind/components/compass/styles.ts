/**
 * Shared styles for compass components
 */
import { StyleSheet } from 'react-native';
import { scaledFontSize } from '@/src/utils/responsive';

export const compassStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 8,
  },
  headingDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
    marginBottom: 16,
  },
  headingText: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  headingDisplaySubtle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
    marginBottom: 8,
  },
  headingTextSubtle: {
    fontSize: scaledFontSize(11),
    fontWeight: '500',
    opacity: 0.7,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compassBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  compassGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
  },
  gradientRingContainer: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  gradientRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  gradientRingInner: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 999,
  },
  innerRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  centerDot: {
    position: 'absolute',
  },
  windLabelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  windLabel: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  windLabelText: {
    fontSize: scaledFontSize(14),
    fontWeight: '700',
    letterSpacing: 1,
  },
  windInfoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
  },
  windSpeedText: {
    fontSize: scaledFontSize(18),
    fontWeight: '700',
  },
  windDirectionText: {
    fontSize: scaledFontSize(11),
    marginTop: 2,
  },
  lockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  lockedChipText: {
    fontSize: scaledFontSize(12),
    fontWeight: '600',
  },
});

export const degreeMarkStyles = StyleSheet.create({
  degreeMark: {
    position: 'absolute',
    width: 1,
    left: '50%',
    marginLeft: -0.5,
  },
  degreeLabel: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 5,
    overflow: 'visible' as const,
  },
  degreeLabelText: {
    textAlign: 'center' as const,
    fontWeight: '500' as const,
    includeFontPadding: false,
  },
});

export const cardinalDirectionStyles = StyleSheet.create({
  cardinalDirection: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardinalBackground: {
    borderRadius: 4,
    padding: 2,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinalTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardinalText: {
    fontWeight: '700',
  },
  northCardinalText: {
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardinalText: {
    fontWeight: '600',
  },
  degreeText: {
    fontWeight: '500',
    marginTop: 1,
  },
});

export const arrowStyles = StyleSheet.create({
  arrowContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    width: 2,
    height: '50%',
    top: 0,
  },
  arrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    top: 0,
    borderTopWidth: 0,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  windArrow: {
    position: 'absolute',
    width: 3,
    height: '7%',
    left: '50%',
    marginLeft: -1.5,
  },
  windArrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  windOriginIndicator: {
    position: 'absolute',
    zIndex: 20,
    borderWidth: 2,
  },
  smallWindArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
    alignSelf: 'center',
    zIndex: 15,
  },
});

export const lockButtonStyles = StyleSheet.create({
  lockButtonContainer: {
    position: 'absolute',
    zIndex: 20,
  },
  lockedChipTopContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25,
  },
  lockButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    overflow: 'hidden',
  },
  lockPulse: {
    position: 'absolute',
    borderRadius: 999,
  },
});
