import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Exercise } from '../../../api/server/models/exercise';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ExercisesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading exercises...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.titleButtonContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Choose an exercise</Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            router.push({
              pathname: '/workout/add-exercise',
              params: {
                workoutId,
                muscleGroup,
              },
            });
          }}
        >
          <Text style={[styles.addText, { color: colors.onPrimary }]}>Add +</Text>
        </Pressable>
      </View>

      <View style={styles.exerciseList}>
        {filteredExercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            style={[
              styles.exerciseButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
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
            <Text style={{ color: colors.text }}>{exercise.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  // Add+ button
  titleButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    padding: 10,
    paddingRight: 20,
    paddingLeft: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  addText: {
    fontWeight: '700',
  },
  // Exercises list
  exerciseButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  exerciseList: {
    gap: 8,
  },
  errorText: {
  },
});
