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
        style={styles.formInput}
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

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    width: 50,
    fontWeight: '600',
  },
  formInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  rowInput: {
    flex: 1,
  },
  incrementButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    backgroundColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 20,
  },
});
