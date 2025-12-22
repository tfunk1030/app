import { useTokens } from '@/src/theme/useTokens';
import * as React from 'react';
import { Linking, Modal, StyleSheet, Text, View } from 'react-native';
import { usePremium } from '../../../features/settings/context/premium';
import { Button } from './button';

export function UpgradeModal() {
  const { showUpgradeModal, setShowUpgradeModal } = usePremium();
  const t = useTokens();

  const handleUpgrade = async () => {
    try {
      await Linking.openURL('https://example.com/upgrade');
    } catch (error) {
      console.error('Failed to open upgrade URL:', error);
    }
  };

  return (
    <Modal
      visible={showUpgradeModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowUpgradeModal(false)}
    >
      <View style={[styles.overlay, { backgroundColor: t.colors.overlay }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: t.colors.surfaceAlt,
              borderColor: t.colors.border,
              shadowColor: t.colors.shadow,
            },
          ]}
        >
          <Text style={[styles.title, { color: t.colors.textPrimary }]}>Upgrade to Premium</Text>
          <Text style={[styles.description, { color: t.colors.textMuted }]}>
            Get access to advanced features and analytics with our premium plan.
          </Text>

          <View style={styles.featuresContainer}>
            <Text style={[styles.featuresTitle, { color: t.colors.textPrimary }]}>
              Premium Features:
            </Text>
            <Text style={[styles.feature, { color: t.colors.textMuted }]}>
              • Advanced shot analysis
            </Text>
            <Text style={[styles.feature, { color: t.colors.textMuted }]}>
              • Club comparison tools
            </Text>
            <Text style={[styles.feature, { color: t.colors.textMuted }]}>
              • Detailed statistics
            </Text>
            <Text style={[styles.feature, { color: t.colors.textMuted }]}>
              • Custom club settings
            </Text>
            <Text style={[styles.feature, { color: t.colors.textMuted }]}>
              • Shot pattern visualization
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              variant="secondary"
              onPress={() => setShowUpgradeModal(false)}
              style={{ flex: 1 }}
            >
              Maybe Later
            </Button>
            <Button variant="premium" onPress={handleUpgrade} style={{ flex: 1 }}>
              Upgrade Now
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// NOTE: overlay backgroundColor is applied inline via tokens
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 560,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8, // Modal elevation 6–8
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
