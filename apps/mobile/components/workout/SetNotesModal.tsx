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
