import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type NewExerciseFormProps = {
  exerciseName: string;
  muscleGroup: string;
  onChangeExerciseName: (newValue: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
};
