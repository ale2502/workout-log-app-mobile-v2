import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Radius, Spacing } from '@/constants/theme';

type SetNotesModalProps = {
  visible: boolean;
  note: string;
  isSaving: boolean;

  onChangeNote: (newValue: string) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export function SetNotesModal(props: SetNotesModalProps) {
  return (
    <Modal transparent visible={props.visible} animationType="fade">
      {/* Padding on iOS lifts the card above the keyboard so the input stays visible. */}
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Card bordered style={styles.modalCard}>
          <AppText variant="cell">Set Notes</AppText>

          <TextInput
            style={styles.noteInput}
            value={props.note}
            onChangeText={props.onChangeNote}
            placeholder="Add a note..."
            placeholderTextColor={Colors.placeholder}
            multiline
          />

          <View style={styles.modalActions}>
            {/* The secondary buttons share the card's surface color, so each gets a 1px outline.
                The primary one gets a transparent border so all three have the same height. */}
            <View style={[styles.modalAction, styles.outlined]}>
              <Button
                title="Close"
                variant="secondary"
                size="md"
                onPress={props.onClose}
              />
            </View>
            <View style={[styles.modalAction, styles.outlined]}>
              <Button
                title="Clear"
                variant="secondary"
                size="md"
                onPress={props.onDelete}
              />
            </View>
            <View style={[styles.modalAction, styles.transparentOutline]}>
              <Button
                title="Save"
                variant="primary"
                size="md"
                onPress={props.onSave}
                loading={props.isSaving}
              />
            </View>
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
  },
  noteInput: {
    minHeight: 120,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    textAlignVertical: 'top',
    fontSize: 15,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalAction: {
    flex: 1,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  transparentOutline: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Radius.lg,
  },
});
