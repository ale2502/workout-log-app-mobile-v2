import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type NewExerciseFormProps = {
  exerciseName: string;
  muscleGroup: string;
  muscleGroupOptions: string[];

  onChangeExerciseName: (newValue: string) => void;
  onChangeMuscleGroup: (newValue: string) => void;

  onSubmit: () => void;
  isSaving: boolean;
};
