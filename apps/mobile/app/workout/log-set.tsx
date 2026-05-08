import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import { Exercise } from '../../../api/server/models/exercise';
import { SetDisplay } from '../../../api/server/models/set';

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

  async function handleSaveSet() {
    setError(null);
    setIsLoading(true);

    const requestBody = {
      workoutId: Number(workoutId),
      exerciseId: Number(exerciseId),
      setNumber: 1,
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

      // later: navigate somewhere or clear the form
    } catch {
      setError('Could not save set');
    } finally {
      setIsLoading(false);
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

    async function loadSets() {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sets`);

        if (!response.ok) {
          throw new Error('Could not load sets');
        }

        const data = await response.json();
        setSets(data);
      } catch {
        setError('Could not load sets');
      }
    }
    loadExercises();
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

      <View style={styles.inputRow}>
        <Text style={styles.label}>Reps</Text>
        <TextInput
          style={[styles.formInput, styles.rowInput]}
          value={reps}
          onChangeText={setReps}
          placeholder="Reps"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.label}>Load</Text>
        <TextInput
          style={[styles.formInput, styles.rowInput]}
          value={load}
          onChangeText={setLoad}
          placeholder="Load"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.label}>RIR</Text>
        <TextInput
          style={[styles.formInput, styles.rowInput]}
          value={rir}
          onChangeText={setRir}
          placeholder="RIR"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.formInput, styles.rowInput]}
          value={note}
          onChangeText={setNote}
          placeholder="Notes"
        />
      </View>

      <Pressable onPress={handleSaveSet} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Saving...' : 'Save'}
        </Text>
      </Pressable>
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
  errorText: {
    color: '#dc2626',
  },
  formInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowInput: {
    flex: 1,
  },
  label: {
    width: 55,
    fontWeight: '600',
  },
});
