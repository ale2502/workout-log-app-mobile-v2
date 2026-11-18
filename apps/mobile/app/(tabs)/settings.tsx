import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme } = useThemeMode();
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>

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
});
