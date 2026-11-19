import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
  Stack,
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
} from 'expo-router';
import { Pressable, StyleSheet, View, Modal } from 'react-native';
import { SetDisplay } from '../../../api/server/models/set';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SavedSetsTable } from '@/components/workout/SavedSetsTable';
import { Ionicons } from '@expo/vector-icons';
import { SetNotesModal } from '@/components/workout/SetNotesModal';
import { useSetNotes } from '@/hooks/useSetNotes';
import { Colors, Spacing } from '@/constants/theme';

// "YYYY-MM-DD HH:MM:SS" is a UTC timestamp from SQLite, so it becomes local time.
function parseApiDate(value: string) {
  return new Date(value.replace(' ', 'T') + 'Z');
}

// "Tue 30 Jun" (the title variant uppercases it; built from parts so there is no comma).
function formatWorkoutDate(date: Date) {
  const weekday = date.toLocaleDateString('en-NZ', { weekday: 'short' });
  const month = date.toLocaleDateString('en-NZ', { month: 'short' });
  return `${weekday} ${date.getDate()} ${month}`;
}

export default function WorkoutDetailScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    workoutId: string;
  }>();
  const workoutId = params.workoutId;

  const [workoutSets, setWorkoutSets] = useState<SetDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExerciseVariantId, setSelectedExerciseVariantId] = useState<
    number | null
  >(null);
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

  const {
    notesModalSetId,
    notesDraft,
    isSavingNote,
    setNotesDraft,
    openNotes,
    closeNotes,
    clearNotes,
    saveNotes,
  } = useSetNotes({
    sets: workoutSets,
    onSaved: loadWorkout,
    onError: setError,
  });

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
      const groupKey = `${currentSet.exerciseName} - ${currentSet.exerciseVariantLabel}`;

      if (groups[groupKey] === undefined) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(currentSet);

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

  function handlePressExercise(
    exerciseId: number,
    exerciseVariantId: number,
    exerciseName: string,
  ) {
    if (selectedExerciseVariantId !== null) {
      if (selectedExerciseVariantId === exerciseVariantId) {
        setSelectedExerciseVariantId(null);
        setSelectedExerciseName('');
        return;
      }

      setSelectedExerciseVariantId(exerciseVariantId);
      setSelectedExerciseName(exerciseName);
      return;
    }

    router.push({
      pathname: '/workout/log-set',
      params: {
        workoutId: String(workoutId),
        exerciseId: String(exerciseId),
        exerciseVariantId: String(exerciseVariantId),
      },
    });
  }

  function handleLongPressExercise(
    exerciseVariantId: number,
    exerciseName: string,
  ) {
    setSelectedExerciseVariantId(exerciseVariantId);
    setSelectedExerciseName(exerciseName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleCancelDeleteExercise() {
    setIsDeleteModalVisible(false);
    setSelectedExerciseVariantId(null);
    setSelectedExerciseName('');
  }

  async function handleDeleteExercise() {
    // Prevent action when no exercise is selected
    if (selectedExerciseVariantId === null) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/workouts/${workoutId}/exercise-variants/${selectedExerciseVariantId}/sets`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete exercise');
      }

      setSelectedExerciseVariantId(null);
      setSelectedExerciseName('');
      setIsDeleteModalVisible(false);
      await loadWorkout();
    } catch {
      setError('Could not delete exercise');
    }
  }

  // The screen only loads sets, and each set carries its workout's performedOn.
  const gymName = workoutSets[0]?.gymName;
  const performedOn = workoutSets[0]
    ? parseApiDate(workoutSets[0].performedOn)
    : null;
  const timeLabel = performedOn?.toLocaleTimeString('en-NZ', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const subtitle = [gymName, timeLabel].filter(Boolean).join(' · ');

  const backButton = (
    <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
      <Ionicons name="chevron-back" size={22} color={Colors.dark.text} />
    </IconButton>
  );

  // The stack header is hidden on every state, so loading and error keep a back button.
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentStyle={styles.content}>
          {backButton}
          <AppText color="mutedText">Loading workout...</AppText>
        </Screen>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentStyle={styles.content}>
          {backButton}
          <AppText color="destructive">{error}</AppText>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen scroll contentStyle={styles.content}>
        {backButton}

        <View style={styles.titleBlock}>
          <AppText variant="title">
            {performedOn ? formatWorkoutDate(performedOn) : 'Workout'}
          </AppText>
          {subtitle !== '' && (
            <AppText variant="caption" color="mutedText">
              {subtitle}
            </AppText>
          )}
        </View>

        <Button
          title="Add exercise"
          size="md"
          icon={<Ionicons name="add" size={22} color={Colors.dark.onAccent} />}
          onPress={handleAddExercise}
        />

        {workoutSets.length === 0 ? (
          <AppText color="mutedText">No sets found for this workout.</AppText>
        ) : (
          Object.entries(groupedSets).map(([sectionTitle, sets]) => {
            const exerciseId = sets[0].exerciseId;
            const exerciseVariantId = sets[0].exerciseVariantId;
            const exerciseName = sets[0].exerciseName;
            const exerciseVariantLabel = sets[0].exerciseVariantLabel;
            const isSelected = selectedExerciseVariantId === exerciseVariantId;

            return (
              <Pressable
                key={sectionTitle}
                onPress={() =>
                  handlePressExercise(
                    exerciseId,
                    exerciseVariantId,
                    exerciseName,
                  )
                }
                onLongPress={() =>
                  handleLongPressExercise(exerciseVariantId, exerciseName)
                }
              >
                <Card
                  style={[
                    styles.exerciseSection,
                    isSelected && styles.exerciseSectionSelected,
                  ]}
                >
                  <View style={styles.exerciseTitleContainer}>
                    <View style={styles.exerciseTitleTextContainer}>
                      <AppText variant="title" style={styles.exerciseTitle}>
                        {exerciseName}
                      </AppText>
                      <AppText variant="caption" color="mutedText">
                        {exerciseVariantLabel}
                      </AppText>
                    </View>

                    {isSelected ? (
                      <Pressable
                        accessibilityLabel={`Delete ${exerciseName}`}
                        onPress={() => setIsDeleteModalVisible(true)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color={Colors.dark.destructive}
                        />
                      </Pressable>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={Colors.dark.mutedText}
                      />
                    )}
                  </View>

                  <SavedSetsTable
                    sets={sets}
                    onLongPressSet={() =>
                      handleLongPressExercise(exerciseVariantId, exerciseName)
                    }
                    selectedSetId={null}
                    onPressNotes={openNotes}
                    onPressSet={() =>
                      handlePressExercise(
                        exerciseId,
                        exerciseVariantId,
                        exerciseName,
                      )
                    }
                  />
                </Card>
              </Pressable>
            );
          })
        )}
      </Screen>
      {/* Modal for confirming deletion of exercise */}
      <Modal transparent visible={isDeleteModalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <AppText variant="cell">Delete {selectedExerciseName}?</AppText>
            <AppText variant="caption" color="mutedText">
              This will delete the exercise and its saved sets for this workout.
            </AppText>

            <View style={styles.modalActions}>
              <View style={styles.modalAction}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={handleCancelDeleteExercise}
                />
              </View>
              <View style={styles.modalAction}>
                <Button
                  title="Delete"
                  variant="destructive"
                  size="md"
                  onPress={handleDeleteExercise}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>
      <SetNotesModal
        visible={notesModalSetId !== null}
        note={notesDraft}
        isSaving={isSavingNote}
        onChangeNote={setNotesDraft}
        onClose={closeNotes}
        onSave={saveNotes}
        onDelete={clearNotes}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  titleBlock: {
    gap: Spacing.xs,
  },
  // The 1px border is always there (transparent) so selecting a section doesn't shift it.
  exerciseSection: {
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exerciseSectionSelected: {
    borderColor: Colors.dark.destructive,
  },
  exerciseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  exerciseTitleTextContainer: {
    flex: 1,
    gap: 2,
  },
  exerciseTitle: {
    fontSize: 22,
    lineHeight: 24,
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalAction: {
    flex: 1,
  },
});
