import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Modal transparent visible={props.visible} animationType="fade">
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Set Notes
          </Text>

          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={props.note}
            onChangeText={props.onChangeNote}
            placeholder="Add a note..."
            placeholderTextColor={colors.placeholder}
            multiline
          />

          <View style={styles.modalActions}>
            <Pressable
              style={[
                styles.modalCancelButton,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
              onPress={props.onClose}
            >
              <Text
                style={[styles.modalCancelButtonText, { color: colors.text }]}
              >
                Close
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modalDeleteButton,
                { backgroundColor: colors.destructive },
              ]}
              onPress={props.onDelete}
            >
              <Text
                style={[
                  styles.modalDeleteButtonText,
                  { color: colors.onPrimary },
                ]}
              >
                Clear
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modalSaveButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={props.onSave}
            >
              <Text
                style={[
                  styles.modalSaveButtonText,
                  { color: colors.onPrimary },
                ]}
              >
                {props.isSaving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancelButtonText: {
    fontWeight: '700',
  },
  modalDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalDeleteButtonText: {
    fontWeight: '700',
  },
  modalSaveButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  modalSaveButtonText: {
    fontWeight: '700',
  },
});
