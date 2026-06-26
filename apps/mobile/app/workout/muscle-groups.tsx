import { useEffect, useState } from 'react';
// useRouter is only for navigation and useLocalSearchParams is for reading the existing params
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

export default function MuscleGroupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading muscle groups...</Text>
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
      <Text style={[styles.title, { color: colors.text }]}>Choose a muscle group</Text>

      <View style={styles.muscleGroupList}>
        {muscleGroups.map((muscleGroup) => (
          <Pressable
            key={muscleGroup}
            style={[
              styles.muscleGroupButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
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
            <Text style={{ color: colors.text }}>{muscleGroup}</Text>
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
  muscleGroupButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  muscleGroupList: {
    gap: 8,
  },
  errorText: {
  },
});
