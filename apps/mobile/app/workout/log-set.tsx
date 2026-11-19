import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Exercise } from '../../../api/server/models/exercise';
import { SetDisplay } from '../../../api/server/models/set';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SavedSetsTable } from '@/components/workout/SavedSetsTable';
import { SetForm } from '@/components/workout/SetForm';
import { SetNotesModal } from '@/components/workout/SetNotesModal';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useSetNotes } from '@/hooks/useSetNotes';

interface Workout {
  id: number;
  performedOn: string;
  createdAt: string;
  gymId: number;
  gymName: string;
}

interface ExerciseVariant {
  id: number;
  exerciseId: number;
  gymId: number;
  label: string;
}

export default function LogSetScreen() {
  const params = useLocalSearchParams<{
    workoutId: string;
    exerciseId: string;
    exerciseVariantId?: string;
  }>();
  const router = useRouter();
  const workoutId = params.workoutId;
  const exerciseId = params.exerciseId;
  const initialExerciseVariantId =
    params.exerciseVariantId === undefined
      ? null
      : Number(params.exerciseVariantId);

  const [sets, setSets] = useState<SetDisplay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseVariants, setExerciseVariants] = useState<ExerciseVariant[]>(
    [],
  );
  const [selectedExerciseVariantId, setSelectedExerciseVariantId] = useState<
    number | null
  >(null);
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [isMachineDropdownOpen, setIsMachineDropdownOpen] = useState(false);
  // isLoading is only for the first load of the screen; isSaving is for save/update/delete.
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // They start as a string because React Native inputs give text
  const [reps, setReps] = useState('');
  const [load, setLoad] = useState('');
  // RIR comes from the slider, so it is already a number (null = not recorded).
  const [rir, setRir] = useState<number | null>(null);
  // The note for the next set. The modal edits a separate draft so Close can throw it away.
  const [pendingNote, setPendingNote] = useState('');
  const [pendingNoteDraft, setPendingNoteDraft] = useState('');
  const [isPendingNoteModalVisible, setIsPendingNoteModalVisible] =
    useState(false);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);

  function changeNumberValue(
    value: string,
    // This is the state setter function. For reps, it would be setReps. For load, setLoad.
    // This lets the helper update whichever input you pass in.
    setValue: (newValue: string) => void,
    amount: number,
    maxValue?: number,
  ) {
    const currentValue = value === '' ? 0 : Number(value);
    // Round to 2 decimals: floating point makes 2.2 - 1 = 1.2000000000000002.
    const increasedValue = Math.round((currentValue + amount) * 100) / 100;
    const valueNotBelowZero = Math.max(0, increasedValue);
    const nextValue =
      maxValue === undefined
        ? valueNotBelowZero
        : Math.min(maxValue, valueNotBelowZero);

    // State setter changes back the number into string and add that value to it.
    setValue(String(nextValue));
  }

  const loadWorkout = useCallback(async () => {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/workouts/${workoutId}`,
    );

    if (!response.ok) {
      throw new Error('Could not load workout');
    }

    const data: Workout = await response.json();
    setWorkout(data);
    return data;
  }, [workoutId]);

  const loadExerciseVariants = useCallback(
    async (gymId: number) => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/exercise-variants?exerciseId=${exerciseId}&gymId=${gymId}`,
      );

      if (!response.ok) {
        throw new Error('Could not load machines');
      }

      const data: ExerciseVariant[] = await response.json();
      setExerciseVariants(data);
      const routeVariant = data.find(
        (variant) => variant.id === initialExerciseVariantId,
      );
      setSelectedExerciseVariantId((currentValue) => {
        if (currentValue !== null) {
          return currentValue;
        }

        return routeVariant?.id ?? data[0]?.id ?? null;
      });
    },
    [exerciseId, initialExerciseVariantId],
  );

  async function handleAddExerciseVariant() {
    if (workout === null) {
      setError('Could not find workout gym');
      return;
    }

    if (newVariantLabel.trim() === '') {
      setError('Machine label is required');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/exercise-variants`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: Number(exerciseId),
            gymId: workout.gymId,
            label: newVariantLabel,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to add machine');
      }

      const variant: ExerciseVariant = await response.json();
      setExerciseVariants((currentVariants) => [...currentVariants, variant]);
      setSelectedExerciseVariantId(variant.id);
      setNewVariantLabel('');
      setIsAddingVariant(false);
      setIsMachineDropdownOpen(false);
    } catch {
      setError('Could not add machine');
    }
  }

  function handleSelectExerciseVariant(variantId: number) {
    if (selectedExerciseVariantId !== variantId) {
      handleCancelEdit();
      setSelectedExerciseVariantId(variantId);
    }

    setIsMachineDropdownOpen(false);
  }

  // Save set function
  async function handleSaveSet() {
    setError(null);
    setIsSaving(true);

    if (selectedExerciseVariantId === null) {
      setError('Choose or add a machine before saving');
      setIsSaving(false);
      return;
    }

    const setsForSelectedVariant = sets.filter(
      (set) => set.exerciseVariantId === selectedExerciseVariantId,
    );
    const nextSetNumber = setsForSelectedVariant.length + 1;

    const requestBody = {
      workoutId: Number(workoutId),
      exerciseId: Number(exerciseId),
      exerciseVariantId: selectedExerciseVariantId,
      setNumber: nextSetNumber,
      reps: Number(reps),
      load: load === '' ? null : Number(load),
      rir,
      note: pendingNote === '' ? null : pendingNote,
    };

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to save set');
      }

      // Only clear the note once it's saved, so a failed save keeps it.
      setPendingNote('');
      await loadSets();
      // later: navigate somewhere or clear the form
    } catch {
      setError('Could not save set');
    } finally {
      setIsSaving(false);
    }
  }

  // Update set function
  async function handleUpdateSet() {
    // Prevent action when no set is selected
    if (selectedSetId === null) {
      return;
    }

    // Find the selected set
    const selectedSet = sets.find((set) => set.id === selectedSetId);

    // Prevent action when selectedSetId is not present on sets list
    if (selectedSet === undefined) {
      setError('Could not find selected set');
      return;
    }

    setError(null);
    setIsSaving(true);

    const requestBody = {
      workoutId: Number(workoutId),
      exerciseId: Number(exerciseId),
      exerciseVariantId: selectedSet.exerciseVariantId,
      setNumber: selectedSet.setNumber,
      reps: Number(reps),
      load: load === '' ? null : Number(load),
      rir,
      // Read the note from the set as it is now: it may have been changed
      // through the note cell after edit mode started.
      note: selectedSet.note ?? null,
    };

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/sets/${selectedSetId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update set');
      }

      await loadSets();
      // Turn off editing mode and clear the form
      handleCancelEdit();
    } catch {
      setError('Could not update set');
    } finally {
      setIsSaving(false);
    }
  }

  // Delete set function
  async function handleDeleteSet() {
    // Prevent action when no set is selected
    if (selectedSetId === null) {
      return;
    }

    // Find the selected set
    const selectedSet = sets.find((set) => set.id === selectedSetId);

    // Prevent action when selectedSetId is not present on sets list
    if (selectedSet === undefined) {
      setError('Could not find selected set');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/sets/${selectedSetId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete set');
      }

      await loadSets();
      handleCancelEdit();
    } catch {
      setError('Could not delete set');
    } finally {
      setIsSaving(false);
    }
  }

  // Load sets function
  const loadSets = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/sets?workoutId=${workoutId}&exerciseId=${exerciseId}`,
      );

      if (!response.ok) {
        throw new Error('Could not load sets');
      }

      const data = await response.json();
      setSets(data);
    } catch {
      setError('Could not load sets');
    }
  }, [exerciseId, workoutId]);

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
    sets,
    onSaved: loadSets,
    onError: setError,
  });

  // Selecting sets and populate the set data into the text fields (ready for update)
  function handleLongPressSet(selectedSet: SetDisplay) {
    selectSetForEditing(selectedSet);
    // Add light vibration to long press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Reset input fields and cancel edit mode
  function handleCancelEdit() {
    setSelectedSetId(null);
    setReps('');
    setLoad('');
    setRir(null);
  }

  function selectSetForEditing(selectedSet: SetDisplay) {
    setSelectedSetId(selectedSet.id);
    setReps(String(selectedSet.reps));
    setLoad(selectedSet.load === null ? '' : String(selectedSet.load));
    // The slider only has 0-4+, so older values above 4 load as 4 (and save back as 4).
    setRir(
      selectedSet.rir === null ? null : Math.min(4, Math.round(selectedSet.rir)),
    );
    setSelectedExerciseVariantId(selectedSet.exerciseVariantId);
  }

  function handlePressSet(selectedSet: SetDisplay) {
    // Outside edit mode, tapping a row opens its note
    if (selectedSetId === null) {
      openNotes(selectedSet);
      return;
    }

    // If selected set is equal the one tapped, deselect it and return
    if (selectedSetId === selectedSet.id) {
      handleCancelEdit();
      return;
    }

    // If there's a selected which is not the one tapped, selected this one
    selectSetForEditing(selectedSet);
  }

  function openPendingNote() {
    setPendingNoteDraft(pendingNote);
    setIsPendingNoteModalVisible(true);
  }

  // Saving only stores the note on the screen; it's sent with the next set.
  function savePendingNote() {
    setPendingNote(pendingNoteDraft.trim());
    setIsPendingNoteModalVisible(false);
  }

  useEffect(() => {
    async function loadExercises() {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/exercises`,
      );

      if (!response.ok) {
        throw new Error('Failed to load exercise');
      }

      const data = await response.json();
      setExercises(data);
    }

    async function loadScreen() {
      setError(null);
      setIsLoading(true);

      try {
        const workoutData = await loadWorkout();
        await Promise.all([
          loadExercises(),
          loadExerciseVariants(workoutData.gymId),
          loadSets(),
        ]);
      } catch {
        setError('Could not load workout data');
      } finally {
        setIsLoading(false);
      }
    }

    loadScreen();
  }, [loadExerciseVariants, loadSets, loadWorkout]);

  const chosenExercise = exercises.find(
    (exercise) => exercise.id.toString() === exerciseId,
  );
  const setsForSelectedVariant = sets.filter(
    (set) => set.exerciseVariantId === selectedExerciseVariantId,
  );
  const selectedExerciseVariant = exerciseVariants.find(
    (variant) => variant.id === selectedExerciseVariantId,
  );
  const nextSetNumber = setsForSelectedVariant.length + 1;
  const editingSetNumber =
    sets.find((set) => set.id === selectedSetId)?.setNumber ?? null;

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
          <AppText color="mutedText">Loading exercises...</AppText>
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
        <View style={styles.headerRow}>
          {backButton}
          <View style={styles.setPill}>
            <AppText variant="label" color="accent" style={styles.setPillText}>
              {editingSetNumber === null
                ? `Set ${nextSetNumber}`
                : `Editing set ${editingSetNumber}`}
            </AppText>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <AppText variant="title">{chosenExercise?.name}</AppText>
          {/* Tapping the machine name opens the machine picker below. */}
          <AppText variant="caption" color="mutedText">
            {chosenExercise?.muscleGroup} · {workout?.gymName} ·{' '}
            <AppText
              variant="caption"
              color="accent"
              accessibilityRole="button"
              accessibilityLabel="Choose machine"
              onPress={() =>
                setIsMachineDropdownOpen((currentValue) => !currentValue)
              }
            >
              {selectedExerciseVariant?.label ?? 'Choose machine'}{' '}
              {isMachineDropdownOpen ? '▴' : '▾'}
            </AppText>
          </AppText>
        </View>

        {isMachineDropdownOpen && (
          <View style={styles.machinePanel}>
            <AppText
              variant="caption"
              color="mutedText"
              style={styles.machinePanelRow}
            >
              A gym might have different machines for the same exercise and it
              can change the movement, load feel, and effort, so tracking the
              exact machine keeps your history accurate.
            </AppText>

            {exerciseVariants.map((variant) => {
              const isSelected = variant.id === selectedExerciseVariantId;

              return (
                <Pressable
                  key={variant.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.machinePanelRow,
                    styles.machineOption,
                    isSelected && styles.machineOptionSelected,
                  ]}
                  onPress={() => handleSelectExerciseVariant(variant.id)}
                >
                  <AppText variant="body">{variant.label}</AppText>
                </Pressable>
              );
            })}

            <View style={[styles.machinePanelRow, styles.machineOption]}>
              {isAddingVariant ? (
                <View style={styles.addMachine}>
                  <TextInput
                    style={styles.machineInput}
                    placeholder="Machine label"
                    placeholderTextColor={Colors.dark.placeholder}
                    value={newVariantLabel}
                    onChangeText={setNewVariantLabel}
                  />
                  <View style={styles.addMachineActions}>
                    <Pressable onPress={() => setIsAddingVariant(false)}>
                      <AppText color="mutedText">Cancel</AppText>
                    </Pressable>
                    <Pressable onPress={handleAddExerciseVariant}>
                      <AppText color="accent">Add</AppText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => setIsAddingVariant(true)}>
                  <AppText color="accent">+ Add machine</AppText>
                </Pressable>
              )}
            </View>
          </View>
        )}

        <SetForm
          reps={reps}
          load={load}
          rir={rir}
          onChangeReps={setReps}
          onChangeLoad={setLoad}
          onChangeRir={setRir}
          onDecreaseReps={() => changeNumberValue(reps, setReps, -1)}
          onIncreaseReps={() => changeNumberValue(reps, setReps, 1)}
          onDecreaseLoad={() => changeNumberValue(load, setLoad, -1)}
          onIncreaseLoad={() => changeNumberValue(load, setLoad, 1)}
          onSave={handleSaveSet}
          onUpdate={handleUpdateSet}
          onDelete={handleDeleteSet}
          onCancel={handleCancelEdit}
          onPressNote={openPendingNote}
          pendingNote={pendingNote}
          isSaving={isSaving}
          // If selectedSetId is different than null, this becomes true, which means edit mode is active
          isEditing={selectedSetId !== null}
          nextSetNumber={nextSetNumber}
          editingSetNumber={editingSetNumber}
        />

        <SavedSetsTable
          sets={setsForSelectedVariant}
          onLongPressSet={handleLongPressSet}
          onPressSet={handlePressSet}
          selectedSetId={selectedSetId}
          onPressNotes={openNotes}
        />
      </Screen>

      <SetNotesModal
        visible={notesModalSetId !== null}
        note={notesDraft}
        isSaving={isSavingNote}
        onChangeNote={setNotesDraft}
        onClose={closeNotes}
        onSave={saveNotes}
        onDelete={clearNotes}
      />

      {/* A second modal for the next set's note. It never calls the API. */}
      <SetNotesModal
        visible={isPendingNoteModalVisible}
        note={pendingNoteDraft}
        isSaving={false}
        onChangeNote={setPendingNoteDraft}
        onClose={() => setIsPendingNoteModalVisible(false)}
        onSave={savePendingNote}
        onDelete={() => setPendingNoteDraft('')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setPill: {
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  setPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  titleBlock: {
    gap: Spacing.xs,
  },
  machinePanel: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  machinePanelRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  machineOption: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  machineOptionSelected: {
    backgroundColor: Colors.dark.surfaceMuted,
  },
  addMachine: {
    gap: Spacing.sm,
  },
  addMachineActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  machineInput: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.surface,
    color: Colors.dark.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
});
