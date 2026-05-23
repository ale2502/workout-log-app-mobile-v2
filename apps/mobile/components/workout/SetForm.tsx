import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NumberStepperInput } from './NumberStepperInput';

type SetFormProps = {
  reps: string;
  load: string;
  rir: string;
  note: string;

  onChangeReps: (newValue: string) => void;
  onChangeLoad: (newValue: string) => void;
  onChangeRir: (newValue: string) => void;
  onChangeNote: (newValue: string) => void;

  onDecreaseReps: () => void;
  onIncreaseReps: () => void;
  onDecreaseLoad: () => void;
  onIncreaseLoad: () => void;
  onDecreaseRir: () => void;
  onIncreaseRir: () => void;

  onSave: () => void;
  isSaving: boolean;
};

export function SetForm(props: SetFormProps) {
  return (
    <View>
      <NumberStepperInput
        label="Reps"
        value={props.reps}
        onChangeText={props.onChangeReps}
        placeholder="Reps"
        onDecrease={props.onDecreaseReps}
        onIncrease={props.onIncreaseReps}
      />

      <NumberStepperInput
        label="Load"
        value={props.load}
        onChangeText={props.onChangeLoad}
        placeholder="Load"
        onDecrease={props.onDecreaseLoad}
        onIncrease={props.onIncreaseLoad}
      />

      <NumberStepperInput
        label="RIR"
        value={props.rir}
        onChangeText={props.onChangeRir}
        placeholder="RIR"
        onDecrease={props.onDecreaseRir}
        onIncrease={props.onIncreaseRir}
      />

      <View style={styles.inputRow}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.formInput, styles.rowInput]}
          value={props.note}
          onChangeText={props.onChangeNote}
          placeholder="Notes"
        />
      </View>
    </View>
  );
}
