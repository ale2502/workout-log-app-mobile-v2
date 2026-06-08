import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SetDisplay } from '../../../api/server/models/set';

export default function WorkoutDetailScreen() {
  const params = useLocalSearchParams<{ workoutId: string }>();
  const workoutId = params.workoutId;

  const [workoutSets, setWorkoutSets] = useState<SetDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkout() {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/workouts/${workoutId}/sets`,
        );

        if (!response.ok) {
          throw new Error('Failed to load workout');
        }

        const data = await response.json();
        setWorkoutSets(data);
      } catch {
        setError('Could not load workout');
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkout();
  }, [workoutId]);

  const groupedSets = workoutSets.reduce<Record<string, SetDisplay[]>>(
    // groups is the accumulator, is the thing we are building up over time. It starts as {}.
    (groups, currentSet) => {
      const exerciseName = currentSet.exerciseName;

      if (groups[exerciseName] === undefined) {
        groups[exerciseName] = [];
      }

      groups[exerciseName].push(currentSet);

      return groups;
    },
    {},
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading exercises...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#dc2626',
  },
});
