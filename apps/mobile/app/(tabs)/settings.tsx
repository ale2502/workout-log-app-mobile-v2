import { useRouter } from 'expo-router';
import { Pressable, Switch, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const router = useRouter();
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

      <Pressable
        style={[
          styles.settingCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => router.push('/settings/manage-gyms')}
      >
        <View style={styles.settingCopy}>
          <ThemedText type="defaultSemiBold">
            Manage gyms and machines
          </ThemedText>
        </View>

        <Ionicons name="chevron-forward" size={22} color={colors.mutedText} />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
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
