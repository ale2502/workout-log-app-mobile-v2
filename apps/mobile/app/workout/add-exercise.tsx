import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function AddExerciseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    workoutId: string;
    muscleGroup: string;
  }>();
  const workoutId = params.workoutId;
  const muscleGroup = params.muscleGroup;

  return (
    <View>
      <Text>Add exercise</Text>
    </View>
  );
}
