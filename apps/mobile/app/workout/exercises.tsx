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
    }
    loadExercises();
  }, []);

  const filteredExercises = exercises.filter(
    (exercise) => exercise.muscleGroup === muscleGroup,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose an exercise</Text>

      <View style={styles.exerciseList}>
        {filteredExercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            style={styles.exerciseButton}
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
            <Text>{exercise.name}</Text>
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
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  exerciseButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  exerciseList: {
    gap: 8,
  },
  errorText: {
    color: '#dc2626',
  },
});
