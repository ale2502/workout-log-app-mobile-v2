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
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

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
        setSelectedExerciseName('');
        return;
      }

      setSelectedExerciseId(exerciseId);
      setSelectedExerciseName(exerciseName);
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
    setSelectedExerciseName('');
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading workout...</Text>
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
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddExercise}>
          <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>Add exercise</Text>
        </Pressable>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {workoutSets.length === 0 ? (
            <Text style={{ color: colors.text }}>No sets found for this workout.</Text>
          ) : (
            Object.entries(groupedSets).map(([exerciseName, sets]) => {
              const exerciseId = sets[0].exerciseId;
              const isSelected = selectedExerciseId === exerciseId;

              return (
                <Pressable
                  key={exerciseName}
                  style={[
                    styles.exerciseSection,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && { borderColor: colors.destructive },
                  ]}
                  onPress={() => handlePressExercise(exerciseId, exerciseName)}
                  onLongPress={() =>
                    handleLongPressExercise(exerciseId, exerciseName)
                  }
                >
                  <View style={styles.exerciseTitleContainer}>
                    <Text style={[styles.exerciseTitle, { color: colors.text }]}>{exerciseName}</Text>

                    {isSelected ? (
                      <Pressable onPress={() => setIsDeleteModalVisible(true)}>
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color={colors.destructive}
                        />
                      </Pressable>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={colors.mutedText}
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
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Delete {selectedExerciseName}?
            </Text>
            <Text style={[styles.modalMessage, { color: colors.mutedText }]}>
              This will delete the exercise and its saved sets for this workout.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: colors.surfaceMuted }]}
                onPress={handleCancelDeleteExercise}
              >
                <Text style={[styles.modalCancelButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalDeleteButton, { backgroundColor: colors.destructive }]}
                onPress={handleDeleteExercise}
              >
                <Text style={[styles.modalDeleteButtonText, { color: colors.onPrimary }]}>Delete</Text>
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
    padding: 24,
    gap: 20,
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 24,
    paddingHorizontal: 3,
    paddingTop: 3,
  },
  errorText: {
  },
  exerciseSection: {
    gap: 5,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
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
  },
  modalCancelButtonText: {
    fontWeight: '700',
  },
  modalDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalDeleteButtonText: {
    fontWeight: '700',
  },
  // Add exercise button
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontWeight: '700',
  },
});
