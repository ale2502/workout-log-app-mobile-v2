import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
} from 'react-native';
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
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
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

  function handleAddExercise() {
    router.push({
      pathname: '/workout/muscle-groups',
      params: {
        workoutId,
      },
    });
  }

  function handlePressExercise(exerciseId: number, exerciseName: string) {
    if (selectedExerciseId !== null) {
      if (selectedExerciseId === exerciseId) {
        setSelectedExerciseId(null);
        return;
      }

      setSelectedExerciseId(exerciseId);
      return;
    }

    router.push({
      pathname: '/workout/log-set',
      params: {
        workoutId: String(workoutId),
        exerciseId: String(exerciseId),
      },
    });
  }

  function handleLongPressExercise(exerciseId: number, exerciseName: string) {
    setSelectedExerciseId(exerciseId);
    setSelectedExerciseName(exerciseName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleCancelDeleteExercise() {
    setIsDeleteModalVisible(false);
    setSelectedExerciseId(null);
  }

  async function handleDeleteExercise() {
    // Prevent action when no exercise is selected
    if (selectedExerciseId === null) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/workouts/${workoutId}/exercises/${selectedExerciseId}/sets`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete exercise');
      }

      setSelectedExerciseId(null);
      setIsDeleteModalVisible(false);
      await loadWorkout();
    } catch {
      setError('Could not delete exercise');
    }
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
    <>
      <View style={styles.container}>
        <Pressable style={styles.addButton} onPress={handleAddExercise}>
          <Text style={styles.addButtonText}>Add exercise</Text>
        </Pressable>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {workoutSets.length === 0 ? (
            <Text>No sets found for this workout.</Text>
          ) : (
            Object.entries(groupedSets).map(([exerciseName, sets]) => {
              const exerciseId = sets[0].exerciseId;
              const isSelected = selectedExerciseId === exerciseId;

              return (
                <Pressable
                  key={exerciseName}
                  style={[
                    styles.exerciseSection,
                    isSelected && styles.selectedExerciseContainer,
                  ]}
                  onPress={() => handlePressExercise(exerciseId, exerciseName)}
                  onLongPress={() =>
                    handleLongPressExercise(exerciseId, exerciseName)
                  }
                >
                  <View style={styles.exerciseTitleContainer}>
                    <Text style={styles.exerciseTitle}>{exerciseName}</Text>

                    {isSelected ? (
                      <Pressable onPress={() => setIsDeleteModalVisible(true)}>
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color="#dc2626"
                        />
                      </Pressable>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color="#6b7280"
                      />
                    )}
                  </View>

                  <SavedSetsTable
                    sets={sets}
                    onLongPressSet={() =>
                      handleLongPressExercise(exerciseId, exerciseName)
                    }
                    selectedSetId={null}
                    onPressSet={() =>
                      handlePressExercise(exerciseId, exerciseName)
                    }
                  />
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
      {/* Modal for confirming deletion of exercise */}
      <Modal transparent visible={isDeleteModalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Delete {selectedExerciseName}?
            </Text>
            <Text style={styles.modalMessage}>
              This will delete the exercise and its saved sets for this workout.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={handleCancelDeleteExercise}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalDeleteButton}
                onPress={handleDeleteExercise}
              >
                <Text style={styles.modalDeleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    gap: 20,
  },
  scrollContent: {
    gap: 20,
  },
  errorText: {
    color: '#dc2626',
  },
  exerciseSection: {
    gap: 5,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
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
  selectedExerciseContainer: {
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  modalCancelButtonText: {
    fontWeight: '700',
    color: '#374151',
  },
  modalDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  modalDeleteButtonText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  // Add exercise button
  addButton: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
