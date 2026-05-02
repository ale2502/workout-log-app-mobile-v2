import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

export default function LogSetScreen() {
  const params = useLocalSearchParams<{
    workoutId: string;
    muscleGroup: string;
    exerciseId: string;
  }>();
  const workoutId = params.workoutId;
  const muscleGroup = params.muscleGroup;
  const exerciseId = params.exerciseId;
}
