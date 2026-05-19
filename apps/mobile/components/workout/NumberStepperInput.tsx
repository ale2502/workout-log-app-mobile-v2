import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type NumberStepperInputProps = {
  label: string;
  value: string;
  onChangeText: (newValue: string) => void;
  onDecrease: () => void;
  onIncrease: () => void;
  placeholder: string;
};

export function NumberStepperInput(props: NumberStepperInputProps) {
  return (
    <View style={styles.inputRow}>
      <Text style={styles.label}>{props.label}</Text>

      <TextInput
        style={[styles.formInput, styles.rowInput]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        keyboardType="numeric"
      />

      <Pressable style={styles.incrementButton} onPress={props.onDecrease}>
        <Text style={styles.incrementText}>-</Text>
      </Pressable>

      <Pressable style={styles.incrementButton} onPress={props.onIncrease}>
        <Text style={styles.incrementText}>+</Text>
      </Pressable>
    </View>
  );
}
