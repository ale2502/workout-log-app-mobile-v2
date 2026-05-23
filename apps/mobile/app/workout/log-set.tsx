import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Exercise } from '../../../api/server/models/exercise';
import { SetDisplay } from '../../../api/server/models/set';
import { SavedSetsTable } from '@/components/workout/SavedSetsTable';
import { SetForm } from '@/components/workout/SetForm';

export default function LogSetScreen() {
  const params = useLocalSearchParams<{
    workoutId: string;
    exerciseId: string;
  }>();
  const workoutId = params.workoutId;
  const exerciseId = params.exerciseId;

  const [sets, setSets] = useState<SetDisplay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // They start as a string because React Native inputs give text
  const [reps, setReps] = useState('');
  const [load, setLoad] = useState('');
  const [rir, setRir] = useState('');
  const [note, setNote] = useState('');

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

  async function handleSaveSet() {
    setError(null);
    setIsLoading(true);

    const nextSetNumber = sets.length + 1;

    const requestBody = {
      workoutId: Number(workoutId),
      exerciseId: Number(exerciseId),
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

  async function loadSets() {
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
  }

  useEffect(() => {
    async function loadExercises() {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/exercises`,
        );

        if (!response.ok) {
          throw new Error('Failed to load exercise');
        }

        const data = await response.json();
        setExercises(data);
      } catch {
        setError('Could not load exercise');
      } finally {
        setIsLoading(false);
      }
    }
    loadExercises();
    loadSets();
    // This effect only loads data when the screen first opens.
    // The linter warns because loadSets uses route params from outside the effect.
    // For now, workoutId and exerciseId are stable for this screen, so this is okay.
    // Later, clean this up with useCallback or a helper that receives the IDs as arguments.
  }, []);

  const chosenExercise = exercises.find(
    (exercise) => exercise.id.toString() === exerciseId,
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
      <Text style={styles.title}>{chosenExercise?.name}</Text>

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
        onSave={handleSaveSet}
        isSaving={isLoading}
      />

      <SavedSetsTable sets={sets} />
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
  errorText: {
    color: '#dc2626',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
});
