import { Switch, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const { colorScheme, isDarkModeEnabled, setIsDarkModeEnabled } =
    useThemeMode();
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>

      <View
        style={[
          styles.settingCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.settingCopy}>
          <ThemedText type="defaultSemiBold">Dark mode</ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedText }]}>
            Use the darker app palette across the workout screens.
          </ThemedText>
        </View>

        <Switch
          value={isDarkModeEnabled}
          onValueChange={setIsDarkModeEnabled}
          trackColor={{
            false: colors.border,
            true: colors.tint,
          }}
          thumbColor={isDarkModeEnabled ? '#f8fafc' : '#f4f4f5'}
          ios_backgroundColor={colors.border}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  settingCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  description: {
    lineHeight: 20,
  },
});
