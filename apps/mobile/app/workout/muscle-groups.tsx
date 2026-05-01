import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        const response = await fetch('http://172.20.10.180:3001/exercises');

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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading muscle groups...</Text>
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
      <Text style={styles.title}>Choose a muscle group</Text>

      <View style={styles.muscleGroupList}>
        {muscleGroups.map((muscleGroup) => (
          <Pressable
            key={muscleGroup}
            style={styles.muscleGroupButton}
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
            <Text>{muscleGroup}</Text>
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
  muscleGroupButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  muscleGroupList: {
    gap: 8,
  },
  errorText: {
    color: '#dc2626',
  },
});
