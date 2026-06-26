import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  onCancel: () => void;

  onSave: () => void;
  isSaving: boolean;
  isEditing: boolean;
};

export function SetForm(props: SetFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

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
        <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
        <TextInput
          style={[
            styles.formInput,
            styles.rowInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={props.note}
          onChangeText={props.onChangeNote}
          placeholder="Notes"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      {props.isEditing ? (
        <View style={styles.editButtonRow}>
          <Pressable
            onPress={props.onUpdate}
            style={[styles.editButton, styles.updateButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.editButtonText, { color: colors.onPrimary }]}>Update Set</Text>
          </Pressable>

          <Pressable
            onPress={props.onDelete}
            style={[styles.editButton, styles.deleteButton, { backgroundColor: colors.destructive }]}
          >
            <Text style={[styles.editButtonText, { color: colors.onPrimary }]}>Delete Set</Text>
          </Pressable>

          <Pressable
            onPress={props.onCancel}
            style={[styles.editButton, styles.cancelButton, { backgroundColor: colors.surfaceMuted }]}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={props.onSave} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>
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
  // Save button
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: '700',
  },
  // Update/delete button
  editButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '700',
  },
  cancelButtonText: {
    fontWeight: '700',
  },
});
