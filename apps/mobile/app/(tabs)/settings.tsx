import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <Screen scroll contentStyle={styles.content}>
      <AppText variant="hero">Settings</AppText>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => router.push('/settings/manage-gyms')}
      >
        <AppText variant="body" style={styles.rowLabel}>
          Manage gyms and machines
        </AppText>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.mutedText}
        />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowLabel: {
    flex: 1,
  },
});
