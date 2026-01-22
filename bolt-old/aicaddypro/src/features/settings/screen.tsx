import { useThemeTokens } from '@/src/theme/ThemeProvider';
import { tokens } from '@/src/theme/tokens';
import { scaledFontSize } from '@/src/utils/responsive';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSettings } from '../../../src/core/context/settings';
import { useClubSettings } from '../../../src/features/settings/context/clubs';
import { usePremium } from '../../../src/features/settings/context/premium';
import { Button } from '../../core/components/ui/button';
import { Card } from '../../core/components/ui/card';
import { ClubData } from '../../core/models/YardageModel';

export default function SettingsScreen() {
  const palette = useThemeTokens();
  const { settings, updateSettings, convertDistance } = useSettings();
  const { clubs, addClub, updateClub, removeClub } = useClubSettings();
  const { isPremium, setShowUpgradeModal } = usePremium();
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [newClub, setNewClub] = React.useState({ name: '', normalYardage: '', loft: '' });

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

    if (editingIndex !== null) {
      updateClub(editingIndex, clubData as ClubData);
    } else {
      addClub(clubData as ClubData);
    }

    setNewClub({ name: '', normalYardage: '', loft: '' });
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    const club = clubs[index];
    const displayYardage =
      settings.distanceUnit === 'meters'
        ? convertDistance(club.normalYardage, 'meters')
        : club.normalYardage;

    setNewClub({
      name: club.name,
      normalYardage: displayYardage.toString(),
      loft: '',
    });
    setEditingIndex(index);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: palette.colors.background }]}
    >
      <Text style={[styles.title, { color: palette.colors.textPrimary }]}>Settings</Text>

      {/* Unit Preferences Card */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.colors.textPrimary }]}>
          Unit Preferences
        </Text>
        <View style={styles.unitGroup}>
          <Text style={[styles.unitLabel, { color: palette.colors.textMuted }]}>Choose Units</Text>
          <View style={styles.unitButtons}>
            <Button
              title="Imperial"
              variant={
                settings.distanceUnit === 'yards' &&
                settings.temperatureUnit === 'fahrenheit' &&
                settings.altitudeUnit === 'feet' &&
                settings.speedUnit === 'mph'
                  ? 'primary'
                  : 'secondary'
              }
              onPress={() =>
                updateSettings({
                  distanceUnit: 'yards',
                  temperatureUnit: 'fahrenheit',
                  altitudeUnit: 'feet',
                  speedUnit: 'mph',
                })
              }
            />
            <Button
              title="Metric (kph)"
              variant={
                settings.distanceUnit === 'meters' &&
                settings.temperatureUnit === 'celsius' &&
                settings.altitudeUnit === 'meters' &&
                settings.speedUnit === 'kph'
                  ? 'primary'
                  : 'secondary'
              }
              onPress={() =>
                updateSettings({
                  distanceUnit: 'meters',
                  temperatureUnit: 'celsius',
                  altitudeUnit: 'meters',
                  speedUnit: 'kph',
                })
              }
            />
          </View>
        </View>
      </Card>

      {/* Forecast Provider */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.colors.textPrimary }]}>
          Forecast Provider
        </Text>
        <View style={styles.unitButtons}>
          <Button
            title="Auto"
            variant={settings.forecastProvider === 'auto' ? 'primary' : 'secondary'}
            onPress={() => updateSettings({ forecastProvider: 'auto', forceOpenMeteo: false })}
          />
          <Button
            title="Stormglass"
            variant={settings.forecastProvider === 'stormglass' ? 'primary' : 'secondary'}
            onPress={() =>
              updateSettings({ forecastProvider: 'stormglass', forceOpenMeteo: false })
            }
          />
          <Button
            title="Open‑Meteo"
            variant={settings.forecastProvider === 'openmeteo' ? 'primary' : 'secondary'}
            onPress={() => updateSettings({ forecastProvider: 'openmeteo', forceOpenMeteo: true })}
          />
        </View>
        <View style={styles.providerHelp}>
          <Text style={[styles.providerHelpText, { color: palette.colors.textMuted }]}>
            Auto (Recommended): Balances consistency and freshness by choosing the most reliable
            source available and falling back seamlessly if needed.
          </Text>
          <Text style={[styles.providerHelpText, { color: palette.colors.textMuted }]}>
            Stormglass: NOAA‑based modeled forecasts with steady wind/gust relationships. Often more
            consistent near coasts and large water bodies; great if you value stability
            round‑to‑round.
          </Text>
          <Text style={[styles.providerHelpText, { color: palette.colors.textMuted }]}>
            Open‑Meteo: Multi‑model global forecasts with quick coverage everywhere. Good for travel
            and broad availability; can vary more by region versus NOAA.
          </Text>
          <Text style={[styles.providerHelpText, { color: palette.colors.textMuted }]}>
            Tip: Different sources may yield slightly different wind values due to model inputs and
            update cadence. A small shift after switching is normal.
          </Text>
        </View>
      </Card>

      {/* Club Management Card */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Club Management</Text>

        <View style={styles.formGroup}>
          <TextInput
            placeholder="Club Name"
            value={newClub.name}
            onChangeText={text => setNewClub({ ...newClub, name: text })}
            style={styles.input}
            placeholderTextColor={palette.colors.textMuted}
          />
          <TextInput
            placeholder={`Normal Distance (${settings.distanceUnit})`}
            value={newClub.normalYardage}
            onChangeText={text => setNewClub({ ...newClub, normalYardage: text })}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor={palette.colors.textMuted}
          />
          <TextInput
            style={styles.input}
            placeholder="Loft (optional)"
            value={newClub.loft}
            onChangeText={text => setNewClub({ ...newClub, loft: text })}
            keyboardType="numeric"
            placeholderTextColor={palette.colors.textMuted}
          />

          <Button title={editingIndex !== null ? 'Update Club' : 'Add Club'} onPress={handleSave} />
        </View>

        {clubs.map((club, index) => {
          const displayYardage =
            settings.distanceUnit === 'meters'
              ? convertDistance(club.normalYardage, 'meters')
              : club.normalYardage;

          return (
            <View key={index} style={styles.clubItem}>
              <View>
                <Text style={[styles.clubName, { color: palette.colors.textPrimary }]}>
                  {club.name}
                </Text>
                <Text style={[styles.clubDetails, { color: palette.colors.textMuted }]}>
                  {Math.round(displayYardage)} {settings.distanceUnit}
                </Text>
              </View>
              <View style={styles.clubActions}>
                <Pressable onPress={() => handleEdit(index)}>
                  <Text style={[styles.actionText, { color: palette.colors.brand }]}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => removeClub(index)}>
                  <Text style={[styles.actionText, { color: palette.colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </Card>

      {!isPremium && (
        <Card style={styles.premiumCard}>
          <Text style={[styles.premiumText, { color: palette.colors.textMuted }]}>
            Premium Features Locked
          </Text>
          <Button title="Upgrade Now" variant="premium" onPress={() => setShowUpgradeModal(true)} />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: tokens.colors.background,
  },
  title: {
    fontSize: scaledFontSize(28),
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: scaledFontSize(22),
    fontWeight: '600',
    color: tokens.colors.textPrimary,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  unitGroup: {
    marginBottom: 16,
  },
  unitLabel: {
    fontSize: scaledFontSize(14),
    color: tokens.colors.textMuted,
    marginBottom: 8,
  },
  unitButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  providerHelp: {
    marginTop: 8,
    gap: 6,
  },
  providerHelpText: {
    fontSize: scaledFontSize(12),
    color: tokens.colors.textMuted,
    lineHeight: 18,
  },
  formGroup: {
    gap: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: tokens.colors.surface,
  },
  clubItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clubName: {
    fontSize: scaledFontSize(16),
    fontWeight: '600',
    color: tokens.colors.textPrimary,
  },
  clubDetails: {
    fontSize: scaledFontSize(12),
    color: tokens.colors.textMuted,
  },
  clubActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionText: {
    color: tokens.colors.brand,
    fontWeight: '600',
  },
  deleteText: {
    color: tokens.colors.danger,
  },
  premiumCard: {
    marginTop: 16,
    alignItems: 'center',
  },
  premiumText: {
    fontSize: scaledFontSize(14),
    color: tokens.colors.textMuted,
    marginBottom: 8,
  },
});
