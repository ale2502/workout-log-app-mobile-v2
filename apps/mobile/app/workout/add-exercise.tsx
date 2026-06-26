import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { NewExerciseForm } from '@/components/workout/NewExerciseForm';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CreatedExercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

export default function AddExerciseScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const params = useLocalSearchParams<{
    workoutId: string;
    muscleGroup: string;
  }>();
  const workoutId = params.workoutId;
  const routeMuscleGroup = params.muscleGroup;

  const [exerciseName, setExerciseName] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] =
    useState(routeMuscleGroup);
  const [muscleGroupOptions, setMuscleGroupOptions] = useState<string[]>([
    routeMuscleGroup,
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadMuscleGroups() {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/exercises/muscle-groups`,
        );

        if (!response.ok) {
          throw new Error('Failed to load muscle groups');
        }

        const data: string[] = await response.json();
        const options = data.includes(routeMuscleGroup)
          ? data
          : [routeMuscleGroup, ...data];

        setMuscleGroupOptions(options);
      } catch {
        setError('Could not load muscle groups');
      } finally {
        setIsLoading(false);
      }
    }

    loadMuscleGroups();
  }, [routeMuscleGroup]);

  async function handleCreateExercise() {
    const trimmedExerciseName = exerciseName.trim();

    if (trimmedExerciseName === '') {
      setError('Exercise name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/exercises`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: trimmedExerciseName,
            muscleGroup: selectedMuscleGroup,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to create exercise');
      }

      const createdExercise: CreatedExercise = await response.json();
      setSuccessMessage('Exercise created');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.replace({
        pathname: '/workout/log-set',
        params: {
          workoutId,
          muscleGroup: selectedMuscleGroup,
          exerciseId: String(createdExercise.id),
        },
      });
    } catch {
      setError('Could not create exercise');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Add exercise</Text>
      {isLoading && <Text style={{ color: colors.text }}>Loading muscle groups...</Text>}
      <NewExerciseForm
        exerciseName={exerciseName}
        muscleGroup={selectedMuscleGroup}
        muscleGroupOptions={muscleGroupOptions}
        onChangeExerciseName={setExerciseName}
        onChangeMuscleGroup={setSelectedMuscleGroup}
        onSubmit={handleCreateExercise}
        isSaving={isSaving}
        error={error}
        successMessage={successMessage}
      />
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
});
