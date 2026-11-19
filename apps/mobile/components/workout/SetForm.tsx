import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { RirSlider } from '@/components/workout/RirSlider';
import { Stepper } from '@/components/workout/Stepper';
import { Colors, Radius, Spacing } from '@/constants/theme';

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
  // Opens the note modal for the set that's about to be logged.
  onPressNote: () => void;

  // The note that will be attached to the next set ('' = none).
  pendingNote: string;
  isSaving: boolean;
  isEditing: boolean;
  nextSetNumber: number;
  editingSetNumber: number | null;
};

export function SetForm(props: SetFormProps) {
  const hasPendingNote = props.pendingNote !== '';

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
        <View style={styles.logRow}>
          <IconButton
            accessibilityLabel={
              hasPendingNote ? 'Edit note for next set' : 'Add note to next set'
            }
            onPress={props.onPressNote}
            size={56}
            badge={hasPendingNote}
            style={{ borderRadius: Radius.lg }}
          >
            <Ionicons name="create-outline" size={22} color={Colors.dark.text} />
          </IconButton>
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

      {!props.isEditing && hasPendingNote && (
        <AppText variant="caption" color="noteText" numberOfLines={2}>
          Note for set {props.nextSetNumber}:{' '}
          <AppText variant="caption" color="mutedText">
            {props.pendingNote}
          </AppText>
        </AppText>
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
  logRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
