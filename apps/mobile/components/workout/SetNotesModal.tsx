type SetNotesModalProps = {
  visible: boolean;
  note: string;
  isSaving: boolean;

  onChangeNote: (newValue: string) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
};
