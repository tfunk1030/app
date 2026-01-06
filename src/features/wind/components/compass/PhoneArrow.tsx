/**
 * PhoneArrow Component
 *
 * Static arrow showing the phone/shot direction (pointing up).
 * Memoized for performance - never re-renders once mounted.
 */
import React from 'react';
import { View } from 'react-native';
import { PhoneArrowProps } from './types';
import { arrowStyles as styles } from './styles';

const PhoneArrow: React.FC<PhoneArrowProps> = ({ success }) => (
  <View style={styles.arrowContainer}>
    <View style={[styles.arrow, { backgroundColor: success }]} />
    <View style={[styles.arrowHead, { borderBottomColor: success }]} />
  </View>
);

export default React.memo(PhoneArrow, () => true);
