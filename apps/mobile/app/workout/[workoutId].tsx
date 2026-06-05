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
}
