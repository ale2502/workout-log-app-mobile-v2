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

  onUpdate: () => void;
  onDelete: () => void;

  onSave: () => void;
  isSaving: boolean;
  isEditing: boolean;
};

export function SetForm(props: SetFormProps) {
  return (
    <View style={styles.container}>
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

      {props.isEditing ? (
        <View style={styles.editButtonRow}>
          <Pressable onPress={props.onUpdate}>
            <Text>Update</Text>
          </Pressable>
          <Pressable onPress={props.onDelete}>
            <Text>Delete</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={props.onSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>
            {props.isSaving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  formInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  label: {
    width: 50,
    fontWeight: '600',
  },
  editButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
