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

export function SerForm(props: SetFormProps) {
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
    </View>
  );
}
