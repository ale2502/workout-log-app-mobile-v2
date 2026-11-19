import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Colors, Radius, Spacing, Type } from '@/constants/theme';

type StepperProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onDecrease: () => void;
  onIncrease: () => void;
  accessibilityNoun: string;
  // Reps are whole numbers, so they use 'number-pad'; load allows decimals.
  keyboardType?: 'number-pad' | 'decimal-pad';
};

// Long values like "102.5" would overflow a half-width card at the full size.
const LONG_VALUE_LENGTH = 4;

export function Stepper({
  label,
  value,
  onChangeText,
  onDecrease,
  onIncrease,
  accessibilityNoun,
  keyboardType = 'decimal-pad',
}: StepperProps) {
  return (
    <Card style={styles.card}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder="0"
        placeholderTextColor={Colors.placeholder}
        accessibilityLabel={label}
        style={[styles.value, value.length > LONG_VALUE_LENGTH && styles.valueLong]}
      />
      <View style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${accessibilityNoun}`}
          onPress={onDecrease}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <AppText style={styles.glyph}>{'−'}</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${accessibilityNoun}`}
          onPress={onIncrease}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <AppText style={styles.glyph}>+</AppText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  label: {
    alignSelf: 'flex-start',
  },
  value: {
    ...Type.number,
    alignSelf: 'stretch',
    textAlign: 'center',
    color: Colors.text,
    padding: 0,
  },
  valueLong: {
    fontSize: 56,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
  },
  pressed: {
    opacity: 0.85,
  },
  glyph: {
    fontSize: 22,
  },
});
