import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

export default function HomeScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        const response = await fetch('http://192.168.1.205:3001/exercises');

        if (!response.ok) {
          throw new Error('Failed to load exercises');
        }

        const data = await response.json();
        setExercises(data);
      } catch (error) {
        setError('Could not load exercises');
      } finally {
        setIsLoading(false);
      }
    }
    loadExercises();
  }, []);

  // Get each exercise's muscle group, remove duplicates with Set, then spread it back into an array
  // "new" is necessary for Set to work
  const muscleGroups = [
    ...new Set(exercises.map((exercise) => exercise.muscleGroup)),
  ];

  const filteredExercises = selectedMuscleGroup
    ? exercises.filter(
        (exercise) => exercise.muscleGroup === selectedMuscleGroup,
      )
    : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Log</Text>

      <Pressable style={styles.startButton}>
        <Text style={styles.startButtonText}>Start Workout</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Choose muscle group</Text>

      {isLoading && <Text>Loading exercises...</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.muscleGroupList}>
        {muscleGroups.map((muscleGroup) => (
          <Pressable
            key={muscleGroup}
            style={[
              styles.muscleGroupButton,
              selectedMuscleGroup === muscleGroup &&
                styles.selectedMuscleGroupButton,
            ]}
            onPress={() => setSelectedMuscleGroup(muscleGroup)}
          >
            <Text>{muscleGroup}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Exercises</Text>

      {filteredExercises.map((exercise) => (
        <Text key={exercise.id} style={styles.exerciseName}>
          {exercise.name}
        </Text>
      ))}
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
  startButton: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  muscleGroupList: {
    gap: 8,
  },
  muscleGroupButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  selectedMuscleGroupButton: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  exerciseName: {
    fontSize: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#dc2626',
  },
});
