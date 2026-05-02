import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

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

  useEffect(() => {
    async function loadExercises() {
      try {
        const response = await fetch('http://192.168.1.207:3001/exercises');

        if (!response.ok) {
          throw new Error('Failed to load exercises');
        }

        const data = await response.json();
        setExercises(data);
      } catch (error) {
        setError('Could not load exercises');
      } finally {
        setIsLoading(false);
      }
    }
    loadExercises();
  }, []);
}
