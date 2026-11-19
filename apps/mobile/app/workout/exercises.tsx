import { useCallback, useState } from 'react';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../../api/server/models/exercise';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function ExercisesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    workoutId: string;
    muscleGroup: string;
  }>();
  const workoutId = params.workoutId;
  const muscleGroup = params.muscleGroup;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/exercises`,
      );

      if (!response.ok) {
        throw new Error('Failed to load exercises');
      }

      const data = await response.json();
      setExercises(data);
    } catch {
      setError('Could not load exercises');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reload exercises whenever this screen comes back into focus so newly created exercises appear.
      loadExercises();
    }, [loadExercises]),
  );

  const filteredExercises = exercises.filter(
    (exercise) => exercise.muscleGroup === muscleGroup,
  );

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
          <AppText color="mutedText">Loading exercises...</AppText>
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

        <AppText variant="title">{muscleGroup || 'Exercise'}</AppText>

        <Button
          title="Add exercise"
          size="md"
          icon={<Ionicons name="add" size={22} color={Colors.onAccent} />}
          onPress={() => {
            router.push({
              pathname: '/workout/add-exercise',
              params: {
                workoutId,
                muscleGroup,
              },
            });
          }}
        />

        <View style={styles.list}>
          {filteredExercises.map((exercise) => (
            <Pressable
              key={exercise.id}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => {
                router.push({
                  // "workout" refers to the folder inside of apps and "log-set" it's the set recording screen. The last path (log-set) is where you're navigating to.
                  pathname: '/workout/log-set',
                  params: {
                    workoutId,
                    muscleGroup,
                    exerciseId: String(exercise.id),
                  },
                });
              }}
            >
              <AppText variant="body" style={styles.rowLabel}>
                {exercise.name}
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
