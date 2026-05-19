import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type NumberStepperInputProps = {
  label: string;
  value: string;
  onChangeText: (newValue: string) => void;
  onDecrease: () => void;
  onIncrease: () => void;
  placeholder: string;
};
