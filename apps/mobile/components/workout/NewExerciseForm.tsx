import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type NewExerciseFormProps = {
  exerciseName: string;
  muscleGroup: string;
  muscleGroupOptions: string[];

  onChangeExerciseName: (newValue: string) => void;
  onChangeMuscleGroup: (newValue: string) => void;

  onSubmit: () => void;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
};

export function NewExerciseForm(props: NewExerciseFormProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  function handleSelectMuscleGroup(muscleGroup: string) {
    props.onChangeMuscleGroup(muscleGroup);
    setIsDropdownOpen(false);
  }

  return (
    <View style={styles.form}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        value={props.exerciseName}
        onChangeText={props.onChangeExerciseName}
        placeholder="Exercise name"
        placeholderTextColor={colors.placeholder}
      />

      <View style={styles.dropdownContainer}>
        <Pressable
          style={[
            styles.dropdownButton,
            isDropdownOpen && styles.dropdownButtonOpen,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setIsDropdownOpen((currentValue) => !currentValue)}
        >
          <Text style={[styles.dropdownText, { color: colors.text }]}>{props.muscleGroup}</Text>
          <Ionicons
            name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.mutedText}
          />
        </Pressable>

        {isDropdownOpen && (
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {props.muscleGroupOptions.map((muscleGroup, index) => {
              const isSelected = muscleGroup === props.muscleGroup;
              const isLastOption = index === props.muscleGroupOptions.length - 1;

              return (
                <Pressable
                  key={muscleGroup}
                  style={[
                    styles.dropdownOption,
                    { backgroundColor: colors.surface },
                    !isLastOption && [
                      styles.dropdownOptionBorder,
                      { borderBottomColor: colors.border },
                    ],
                    isSelected && {
                      backgroundColor:
                        colorScheme === 'dark' ? colors.surfaceMuted : '#f9fafb',
                    },
                  ]}
                  onPress={() => handleSelectMuscleGroup(muscleGroup)}
                >
                  <Text style={[styles.dropdownOptionText, { color: colors.text }]}>
                    {muscleGroup}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {props.successMessage && (
        <View
          style={[
            styles.successToast,
            {
              backgroundColor: colorScheme === 'dark' ? '#123d2a' : '#dcfce7',
              borderColor: colorScheme === 'dark' ? '#166534' : '#86efac',
            },
          ]}
        >
          <Text style={[styles.successText, { color: colors.success }]}>
            {props.successMessage}
          </Text>
        </View>
      )}

      {props.error && <Text style={[styles.errorText, { color: colors.destructive }]}>{props.error}</Text>}

      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          props.isSaving && styles.disabledButton,
        ]}
        onPress={props.onSubmit}
        disabled={props.isSaving}
      >
        <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
          {props.isSaving ? 'Creating...' : 'Create exercise'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dropdownContainer: {
    gap: 0,
    position: 'relative',
    zIndex: 2,
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: {
  },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    zIndex: 3,
    elevation: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    padding: 12,
  },
  selectedDropdownOption: {
    opacity: 0.9,
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontWeight: '700',
  },
  errorText: {
  },
  successToast: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    padding: 12,
  },
  successText: {
    fontWeight: '700',
  },
});
