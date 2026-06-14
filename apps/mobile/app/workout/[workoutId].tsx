import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SetDisplay } from '../../../api/server/models/set';
import { SavedSetsTable } from '@/components/workout/SavedSetsTable';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutDetailScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    workoutId: string;
  }>();
  const workoutId = params.workoutId;

  const [workoutSets, setWorkoutSets] = useState<SetDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(
    null,
  );
  const [selectExerciseName, setSelectExerciseName] = useState<string>('');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const loadWorkout = useCallback(async () => {
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
  }, [workoutId]);

  useFocusEffect(
    useCallback(() => {
      loadWorkout();
    }, [loadWorkout]),
  );

  // Record<string, SetDisplay[]> means an object where the keys are strings, and the values are arrays of SetDisplay.
  const groupedSets = workoutSets.reduce<Record<string, SetDisplay[]>>(
    // groups is the accumulator, is the thing we are building up over time. It starts as {}.
    // currentSet is the current item from the array.
    (groups, currentSet) => {
      const exerciseName = currentSet.exerciseName;

      // ex: if groups['Bench Press'] === undefined, the key in the obj doesn't exist yet and will be created
      if (groups[exerciseName] === undefined) {
        groups[exerciseName] = [];
      }

      groups[exerciseName].push(currentSet);

      return groups;
    },
    // {} is the starting value for the accumulator (groups)
    {},
  );

  function handleLongPressExercise(exerciseId: number, exerciseName: string) {
    setSelectedExerciseId(exerciseId);
    setSelectExerciseName(exerciseName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading workout...</Text>
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

  if (workoutSets.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No sets found for this workout.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Object.entries(groupedSets).map(([exerciseName, sets]) => {
        const exerciseId = sets[0].exerciseId;

        return (
          <Pressable
            key={exerciseName}
            style={styles.exerciseSection}
            onPress={() =>
              router.push({
                pathname: '/workout/log-set',
                params: {
                  workoutId: String(workoutId),
                  exerciseId: String(exerciseId),
                },
              })
            }
          >
            <View style={styles.exerciseTitleContainer}>
              <Text style={styles.exerciseTitle}>{exerciseName}</Text>
              <Ionicons name="chevron-forward" size={22} color="#6b7280" />
            </View>
            <SavedSetsTable
              sets={sets}
              // Pass placeholder props for now since they are not needed for display only
              onLongPressSet={() => {}}
              selectedSetId={null}
              onPressSet={(set) => {
                router.push({
                  pathname: '/workout/log-set',
                  params: {
                    workoutId: String(workoutId),
                    exerciseId: String(exerciseId),
                  },
                });
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#dc2626',
  },
  exerciseSection: {
    gap: 5,
    padding: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'transparent',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  exerciseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 5,
  },
});
