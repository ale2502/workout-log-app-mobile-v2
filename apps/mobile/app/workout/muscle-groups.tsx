import { useEffect, useState } from 'react';
// useRouter is only for navigation and useLocalSearchParams is for reading the existing params
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

export default function MuscleGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ workoutId: string }>();
  const workoutId = params.workoutId;
  // Same as:
  // const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/exercises`,
        );

        if (!response.ok) {
          throw new Error('Failed to load muscle groups');
        }

        const data = await response.json();
        setExercises(data);
      } catch {
        setError('Could not load muscle groups');
      } finally {
        setIsLoading(false);
      }
    }
    loadExercises();
    // [] is a dependency array, []: run once, [someValue]: run once then again if someValue changes, no array: run after every render
  }, []);

  const muscleGroups = [
    ...new Set(exercises.map((exercise) => exercise.muscleGroup)),
  ];

  const backButton = (
    <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
      <Ionicons name="chevron-back" size={22} color={Colors.text} />
    </IconButton>
  );

  // The stack header is hidden on every state, so loading and error keep a back button.
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentStyle={styles.content}>
          {backButton}
          <AppText color="mutedText">Loading muscle groups...</AppText>
        </Screen>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentStyle={styles.content}>
          {backButton}
          <AppText color="destructive">{error}</AppText>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen scroll contentStyle={styles.content}>
        {backButton}

        <AppText variant="title">Muscle group</AppText>

        <View style={styles.list}>
          {muscleGroups.map((muscleGroup) => (
            <Pressable
              key={muscleGroup}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => {
                router.push({
                  pathname: '/workout/exercises',
                  params: {
                    workoutId,
                    muscleGroup,
                  },
                });
              }}
            >
              <AppText variant="body" style={styles.rowLabel}>
                {muscleGroup}
              </AppText>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.mutedText}
              />
            </Pressable>
          ))}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  list: {
    gap: Spacing.sm,
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
