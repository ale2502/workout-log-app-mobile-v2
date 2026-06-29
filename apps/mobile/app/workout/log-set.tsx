import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Exercise } from '../../../api/server/models/exercise';
import { SetDisplay } from '../../../api/server/models/set';
import { SavedSetsTable } from '@/components/workout/SavedSetsTable';
import { SetForm } from '@/components/workout/SetForm';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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
  const [isMachineHelpVisible, setIsMachineHelpVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // They start as a string because React Native inputs give text
  const [reps, setReps] = useState('');
  const [load, setLoad] = useState('');
  const [rir, setRir] = useState('');
  const [note, setNote] = useState('');
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);

  function changeNumberValue(
    value: string,
    // This is the state setter function. For reps, it would be setReps. For load, setLoad. For RIR, setRir.
    // This lets the helper update whichever input you pass in.
    setValue: (newValue: string) => void,
    amount: number,
    maxValue?: number,
  ) {
    const currentValue = value === '' ? 0 : Number(value);
    const increasedValue = currentValue + amount;
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
    setIsLoading(true);

    if (selectedExerciseVariantId === null) {
      setError('Choose or add a machine before saving');
      setIsLoading(false);
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
      rir: rir === '' ? null : Number(rir),
      note: note === '' ? null : note,
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

      await loadSets();
      // later: navigate somewhere or clear the form
    } catch {
      setError('Could not save set');
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);

    const requestBody = {
      workoutId: Number(workoutId),
      exerciseId: Number(exerciseId),
      exerciseVariantId: selectedSet.exerciseVariantId,
      setNumber: selectedSet.setNumber,
      reps: Number(reps),
      load: load === '' ? null : Number(load),
      rir: rir === '' ? null : Number(rir),
      note: note === '' ? null : note,
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
      setIsLoading(false);
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
    setIsLoading(true);

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
      setIsLoading(false);
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
    setRir('');
    setNote('');
  }

  function selectSetForEditing(selectedSet: SetDisplay) {
    setSelectedSetId(selectedSet.id);
    setReps(String(selectedSet.reps));
    setLoad(selectedSet.load === null ? '' : String(selectedSet.load));
    setRir(selectedSet.rir === null ? '' : String(selectedSet.rir));
    setNote(selectedSet.note ?? '');
    setSelectedExerciseVariantId(selectedSet.exerciseVariantId);
  }

  function handlePressSet(selectedSet: SetDisplay) {
    // If no selected set, just return
    if (selectedSetId === null) {
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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading exercises...</Text>
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
      <Text style={[styles.title, { color: colors.text }]}>{chosenExercise?.name}</Text>
      {workout && (
        <Text style={[styles.gymName, { color: colors.mutedText }]}>
          {workout.gymName}
        </Text>
      )}

      <View style={styles.variantSection}>
        <View style={styles.variantLabelRow}>
          <Text style={[styles.variantLabel, { color: colors.text }]}>
            Machine
          </Text>
          <Pressable
            style={[styles.helpButton, { borderColor: colors.border }]}
            onPress={() =>
              setIsMachineHelpVisible((currentValue) => !currentValue)
            }
          >
            <Text style={[styles.helpButtonText, { color: colors.mutedText }]}>
              ?
            </Text>
          </Pressable>
        </View>

        {isMachineHelpVisible && (
          <View
            style={[
              styles.helpBubble,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.helpBubbleText, { color: colors.mutedText }]}>
              A gym might have different machines for the same exercise and it
              can change the movement, load feel, and effort, so tracking the
              exact machine keeps your history accurate.
            </Text>
          </View>
        )}

        <View style={styles.dropdownContainer}>
          <Pressable
            style={[
              styles.machineDropdownButton,
              isMachineDropdownOpen && styles.dropdownButtonOpen,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() =>
              setIsMachineDropdownOpen((currentValue) => !currentValue)
            }
          >
            <Text style={[styles.machineDropdownText, { color: colors.text }]}>
              {selectedExerciseVariant?.label ?? 'Select machine'}
            </Text>
            <Ionicons
              name={isMachineDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.mutedText}
            />
          </Pressable>

          {isMachineDropdownOpen && (
            <View
              style={[
                styles.dropdownMenu,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {exerciseVariants.map((variant, index) => {
                const isSelected = variant.id === selectedExerciseVariantId;
                const isLastOption = index === exerciseVariants.length - 1;

                return (
                  <Pressable
                    key={variant.id}
                    style={[
                      styles.dropdownOption,
                      { backgroundColor: colors.surface },
                      !isLastOption && [
                        styles.dropdownOptionBorder,
                        { borderBottomColor: colors.border },
                      ],
                      isSelected && { backgroundColor: colors.surfaceMuted },
                    ]}
                    onPress={() => handleSelectExerciseVariant(variant.id)}
                  >
                    <Text
                      style={[
                        styles.machineDropdownText,
                        { color: colors.text },
                      ]}
                    >
                      {variant.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {isAddingVariant ? (
          <View style={styles.addVariantContainer}>
            <TextInput
              style={[
                styles.variantInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="Machine label"
              placeholderTextColor={colors.mutedText}
              value={newVariantLabel}
              onChangeText={setNewVariantLabel}
            />
            <View style={styles.addVariantActions}>
              <Pressable onPress={() => setIsAddingVariant(false)}>
                <Text style={{ color: colors.mutedText }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAddExerciseVariant}>
                <Text style={{ color: colors.primary }}>Add</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setIsAddingVariant(true)}>
            <Text style={{ color: colors.primary }}>+ Add machine</Text>
          </Pressable>
        )}
      </View>

      <SetForm
        reps={reps}
        load={load}
        rir={rir}
        note={note}
        onChangeReps={setReps}
        onChangeLoad={setLoad}
        onChangeRir={setRir}
        onChangeNote={setNote}
        onDecreaseReps={() => changeNumberValue(reps, setReps, -1)}
        onIncreaseReps={() => changeNumberValue(reps, setReps, 1)}
        onDecreaseLoad={() => changeNumberValue(load, setLoad, -1)}
        onIncreaseLoad={() => changeNumberValue(load, setLoad, 1)}
        onDecreaseRir={() => changeNumberValue(rir, setRir, -0.5, 10)}
        onIncreaseRir={() => changeNumberValue(rir, setRir, 0.5, 10)}
        onUpdate={handleUpdateSet}
        onDelete={handleDeleteSet}
        onCancel={handleCancelEdit}
        onSave={handleSaveSet}
        isSaving={isLoading}
        // If selectedSetId is different than null, this becomes true, which means edit mode is active
        isEditing={selectedSetId !== null}
      />

      <SavedSetsTable
        sets={setsForSelectedVariant}
        onLongPressSet={handleLongPressSet}
        onPressSet={handlePressSet}
        selectedSetId={selectedSetId}
      />
      {selectedSetId !== null && <Text>Selected set id: {selectedSetId}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  errorText: {},
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: -10,
  },
  gymName: {
    marginBottom: 4,
  },
  variantSection: {
    gap: 8,
  },
  variantLabel: {
    fontWeight: '700',
  },
  variantLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  helpBubble: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  helpBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 2,
  },
  machineDropdownButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  machineDropdownText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    zIndex: 3,
    elevation: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
  },
  addVariantContainer: {
    gap: 8,
  },
  addVariantActions: {
    flexDirection: 'row',
    gap: 16,
  },
  variantInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
