import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type NumberStepperInputProps = {
  label: string;
  value: string;
  onChangeText: (newValue: string) => void;
  onDecrease: () => void;
  onIncrease: () => void;
  placeholder: string;
};

export function NumberStepperInput(props: NumberStepperInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.inputRow}>
      <Text style={[styles.label, { color: colors.text }]}>{props.label}</Text>

      <TextInput
        style={[
          styles.formInput,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType="numeric"
      />

      <Pressable
        style={[styles.incrementButton, { backgroundColor: colors.primary }]}
        onPress={props.onDecrease}
      >
        <Text style={[styles.incrementText, { color: colors.onPrimary }]}>-</Text>
      </Pressable>

      <Pressable
        style={[styles.incrementButton, { backgroundColor: colors.primary }]}
        onPress={props.onIncrease}
      >
        <Text style={[styles.incrementText, { color: colors.onPrimary }]}>+</Text>
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
    borderRadius: 8,
  },
  incrementButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incrementText: {
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 20,
  },
});
