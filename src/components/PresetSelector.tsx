/**
 * PresetSelector.tsx
 *
 * A component for managing presets with save, load, and delete functionality.
 * Uses the Bold & Colorful design language with gradients and glow effects.
 */

import { BoldCard } from '@/src/core/components/ui/BoldCard';
import { Button } from '@/src/core/components/ui/button';
import { Input } from '@/src/core/components/ui/Input';
import { SectionHeader } from '@/src/core/components/ui/SectionHeader';
import {
  usePresets,
  PresetType,
  PresetData,
  Preset,
} from '@/src/hooks/usePresets';
import { useTokens } from '@/src/theme/useTokens';
import { useThemeMode } from '@/src/theme/ThemeProvider';
import { gradients, boldColors } from '@/src/theme/gradients';
import { scaledFontSize, moderateScale, getScrollPadding } from '@/src/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Save,
  FolderOpen,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react-native';
import React, { memo, useCallback, useState, useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

// ============================================================================
// Types
// ============================================================================

interface PresetSelectorProps {
  /** The type of preset to filter by */
  presetType: PresetType;
  /** Current data to save as preset */
  currentData: PresetData;
  /** Callback when a preset is loaded */
  onLoadPreset: (data: PresetData) => void;
  /** Optional style */
  style?: ViewStyle;
}

interface PresetItemProps {
  preset: Preset;
  onLoad: (preset: Preset) => void;
  onDelete: (preset: Preset) => void;
  isSelected: boolean;
}

// ============================================================================
// PresetItem Component
// ============================================================================

const PresetItem = memo(({ preset, onLoad, onDelete, isSelected }: PresetItemProps) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
    });
  }, [scale, t.animation.spring]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: t.animation.spring.damping,
      stiffness: t.animation.spring.stiffness,
    });
  }, [scale, t.animation.spring]);

  const formattedDate = useMemo(() => {
    const date = new Date(preset.updatedAt);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [preset.updatedAt]);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => onLoad(preset)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.presetItem,
          {
            backgroundColor: isSelected
              ? isDark
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(16, 185, 129, 0.1)'
              : isDark
              ? t.colors.surfaceAlt
              : t.colors.surface,
            borderColor: isSelected
              ? boldColors.emerald
              : t.colors.border,
          },
        ]}
        accessibilityLabel={`Load preset: ${preset.name}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.presetItemContent}>
          <View style={styles.presetItemLeft}>
            {isSelected && (
              <View style={[styles.selectedIndicator, { backgroundColor: boldColors.emerald }]}>
                <Check size={12} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.presetItemText}>
              <Text
                style={[styles.presetName, { color: t.colors.textPrimary }]}
                numberOfLines={1}
              >
                {preset.name}
              </Text>
              <Text
                style={[styles.presetDate, { color: t.colors.textMuted }]}
                numberOfLines={1}
              >
                {formattedDate}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => onDelete(preset)}
            style={[styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Delete preset: ${preset.name}`}
            accessibilityRole="button"
          >
            <Trash2 size={16} color={t.colors.danger} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
});

PresetItem.displayName = 'PresetItem';

// ============================================================================
// SavePresetModal Component
// ============================================================================

interface SavePresetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  existingNames: string[];
}

const SavePresetModal = memo(({
  visible,
  onClose,
  onSave,
  existingNames,
}: SavePresetModalProps) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter a name for your preset');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Name cannot exceed 50 characters');
      return;
    }

    if (existingNames.includes(trimmedName)) {
      setError('A preset with this name already exists');
      return;
    }

    onSave(trimmedName);
    setName('');
    setError(null);
    onClose();
  }, [name, existingNames, onSave, onClose]);

  const handleClose = useCallback(() => {
    setName('');
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? t.colors.surface : t.colors.background,
              shadowColor: t.colors.shadow,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: t.colors.textPrimary }]}>
              Save Preset
            </Text>
            <Pressable
              onPress={handleClose}
              hitSlop={8}
              accessibilityLabel="Close save preset dialog"
              accessibilityRole="button"
            >
              <X size={24} color={t.colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.inputLabel, { color: t.colors.textMuted }]}>
              Preset Name
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g., My Favorite Course"
              autoFocus
              maxLength={50}
            />
            {error && (
              <Text style={[styles.errorText, { color: t.colors.danger }]}>
                {error}
              </Text>
            )}
          </View>

          <View style={styles.modalFooter}>
            <Button
              variant="secondary"
              title="Cancel"
              onPress={handleClose}
              style={styles.modalButton}
            />
            <Button
              variant="primary"
              title="Save"
              onPress={handleSave}
              style={styles.modalButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

SavePresetModal.displayName = 'SavePresetModal';

// ============================================================================
// PresetSelector Component
// ============================================================================

export const PresetSelector = memo(({
  presetType,
  currentData,
  onLoadPreset,
  style,
}: PresetSelectorProps) => {
  const t = useTokens();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark' || mode === 'system';
  const {
    presets,
    isLoading,
    error,
    createPreset,
    deletePreset,
    getPresetsByType,
  } = usePresets();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Filter presets by type
  const filteredPresets = useMemo(() => {
    return getPresetsByType(presetType);
  }, [presetType, getPresetsByType]);

  // Get existing preset names for validation
  const existingNames = useMemo(() => {
    return presets.map((p) => p.name);
  }, [presets]);

  // Animation for expand/collapse
  const expandRotation = useSharedValue(0);
  const expandedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${expandRotation.value}deg` }],
  }));

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => {
      expandRotation.value = withTiming(!prev ? 180 : 0, { duration: 200 });
      return !prev;
    });
  }, [expandRotation]);

  // Handle save preset
  const handleSavePreset = useCallback(
    async (name: string) => {
      const result = await createPreset({
        name,
        type: presetType,
        data: currentData,
      });

      if (result) {
        setSelectedPresetId(result.id);
        // Show success feedback
        if (Platform.OS !== 'web') {
          Alert.alert('Success', `Preset "${name}" saved successfully`);
        }
      }
    },
    [createPreset, presetType, currentData]
  );

  // Handle load preset
  const handleLoadPreset = useCallback(
    (preset: Preset) => {
      setSelectedPresetId(preset.id);
      onLoadPreset(preset.data);
    },
    [onLoadPreset]
  );

  // Handle delete preset
  const handleDeletePreset = useCallback(
    (preset: Preset) => {
      const confirmDelete = () => {
        deletePreset(preset.id);
        if (selectedPresetId === preset.id) {
          setSelectedPresetId(null);
        }
      };

      if (Platform.OS === 'web') {
        if (window.confirm(`Delete preset "${preset.name}"?`)) {
          confirmDelete();
        }
      } else {
        Alert.alert(
          'Delete Preset',
          `Are you sure you want to delete "${preset.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: confirmDelete },
          ]
        );
      }
    },
    [deletePreset, selectedPresetId]
  );

  return (
    <BoldCard style={style} variant="default">
      <SectionHeader title="Presets" variant="violet" />

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Button
          variant="outline"
          size="sm"
          onPress={() => setShowSaveModal(true)}
          style={styles.actionButton}
        >
          <View style={styles.buttonContent}>
            <Save size={16} color={t.colors.brand} />
            <Text style={[styles.buttonText, { color: t.colors.brand }]}>Save</Text>
          </View>
        </Button>

        <Pressable
          onPress={toggleExpanded}
          style={[
            styles.expandButton,
            {
              backgroundColor: isDark
                ? t.colors.surfaceAlt
                : t.colors.surface,
              borderColor: t.colors.border,
            },
          ]}
          accessibilityLabel={`${isExpanded ? 'Hide' : 'Show'} saved presets, ${filteredPresets.length} available`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
        >
          <View style={styles.buttonContent}>
            <FolderOpen size={16} color={t.colors.textPrimary} />
            <Text style={[styles.expandButtonText, { color: t.colors.textPrimary }]}>
              Load ({filteredPresets.length})
            </Text>
            <Animated.View style={expandedAnimatedStyle}>
              <ChevronDown size={16} color={t.colors.textMuted} />
            </Animated.View>
          </View>
        </Pressable>
      </View>

      {/* Expandable Preset List */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.presetListContainer}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: t.colors.textMuted }]}>
                Loading presets...
              </Text>
            </View>
          ) : filteredPresets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: t.colors.textMuted }]}>
                No saved presets yet
              </Text>
              <Text style={[styles.emptySubtext, { color: t.colors.textMuted }]}>
                Save your current settings to quickly load them later
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.presetList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {filteredPresets.map((preset) => (
                <PresetItem
                  key={preset.id}
                  preset={preset}
                  onLoad={handleLoadPreset}
                  onDelete={handleDeletePreset}
                  isSelected={selectedPresetId === preset.id}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: t.colors.danger }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Save Preset Modal */}
      <SavePresetModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSavePreset}
        existingNames={existingNames}
      />
    </BoldCard>
  );
});

PresetSelector.displayName = 'PresetSelector';

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginTop: moderateScale(8),
  },
  actionButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  expandButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  expandButtonText: {
    fontSize: scaledFontSize(14),
    fontWeight: '500',
    marginHorizontal: 4,
  },
  presetListContainer: {
    marginTop: moderateScale(12),
    maxHeight: 200,
  },
  presetList: {
    maxHeight: 200,
  },
  presetItem: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  presetItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  presetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  presetItemText: {
    flex: 1,
  },
  presetName: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
    marginBottom: 2,
  },
  presetDate: {
    fontSize: scaledFontSize(11),
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaledFontSize(14),
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scaledFontSize(14),
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: scaledFontSize(12),
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: scaledFontSize(12),
    marginTop: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  inputLabel: {
    fontSize: scaledFontSize(13),
    fontWeight: '500',
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});

export type { PresetSelectorProps };
