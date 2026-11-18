import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { RirSlider } from '@/components/workout/RirSlider';
import { Stepper } from '@/components/workout/Stepper';
import { Spacing } from '@/constants/theme';

type SetFormProps = {
  reps: string;
  load: string;
  rir: number | null;

  onChangeReps: (newValue: string) => void;
  onChangeLoad: (newValue: string) => void;
  onChangeRir: (newValue: number | null) => void;

  onDecreaseReps: () => void;
  onIncreaseReps: () => void;
  onDecreaseLoad: () => void;
  onIncreaseLoad: () => void;

  onSave: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onCancel: () => void;

  isSaving: boolean;
  isEditing: boolean;
  nextSetNumber: number;
  editingSetNumber: number | null;
};

export function SetForm(props: SetFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        <View style={styles.stepper}>
          <Stepper
            label="Reps"
            value={props.reps}
            onChangeText={props.onChangeReps}
            onDecrease={props.onDecreaseReps}
            onIncrease={props.onIncreaseReps}
            accessibilityNoun="reps"
          />
        </View>
        <View style={styles.stepper}>
          <Stepper
            label="Load · kg"
            value={props.load}
            onChangeText={props.onChangeLoad}
            onDecrease={props.onDecreaseLoad}
            onIncrease={props.onIncreaseLoad}
            accessibilityNoun="load"
          />
        </View>
      </View>

      <View style={styles.rirSection}>
        {/* The right side of this row is left free for the mesocycle target later. */}
        <View style={styles.rirLabelRow}>
          <AppText variant="label">RIR · Reps in reserve</AppText>
        </View>
        <RirSlider value={props.rir} onChange={props.onChangeRir} />
      </View>

      {props.isEditing ? (
        <View style={styles.actions}>
          <Button
            title={
              props.editingSetNumber === null
                ? 'Update set'
                : `Update set ${props.editingSetNumber}`
            }
            size="md"
            onPress={props.onUpdate}
            loading={props.isSaving}
          />
          <View style={styles.actionRow}>
            <View style={styles.actionRowItem}>
              <Button
                title="Delete"
                variant="destructive"
                size="md"
                onPress={props.onDelete}
                disabled={props.isSaving}
              />
            </View>
            <View style={styles.actionRowItem}>
              <Button
                title="Cancel"
                variant="secondary"
                size="md"
                onPress={props.onCancel}
                disabled={props.isSaving}
              />
            </View>
          </View>
        </View>
      ) : (
        // A row so step 10 can put the note button to the left of "Log set".
        <View style={styles.actionRow}>
          <View style={styles.actionRowItem}>
            <Button
              title={`Log set ${props.nextSetNumber}`}
              size="md"
              onPress={props.onSave}
              loading={props.isSaving}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stepper: {
    flex: 1,
  },
  rirSection: {
    gap: Spacing.sm,
  },
  rirLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    gap: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionRowItem: {
    flex: 1,
  },
});
