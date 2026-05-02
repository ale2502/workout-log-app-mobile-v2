import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

export default function LogSetScreen() {
  const params = useLocalSearchParams<{
    workoutId: string;
    muscleGroup: string;
    exerciseId: string;
  }>();
  const workoutId = params.workoutId;
  const muscleGroup = params.muscleGroup;
  const exerciseId = params.exerciseId;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        const response = await fetch('http://192.168.1.207:3001/exercises');

        if (!response.ok) {
          throw new Error('Failed to load exercise');
        }

        const data = await response.json();
        setExercises(data);
      } catch {
        setError('Could not load exercise');
      } finally {
        setIsLoading(false);
      }
    }
    loadExercises();
  }, []);

  const chosenExercise = exercises.find(
    (exercise) => exercise.id.toString() === exerciseId,
  );
}
