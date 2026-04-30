import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

export default function MuscleGroupScreen() {
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
        const response = await fetch('http://192.168.1.205:3001/exercises');

        if (!response.ok) {
          throw new Error('Failed to load muscle-groups');
        }

        const data = await response.json();
        setExercises(data);
      } catch (error) {
        setError('Could not load muscle-groups');
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
}
