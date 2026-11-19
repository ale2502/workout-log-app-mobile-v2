import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Colors, Radius, Spacing } from '@/constants/theme';

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

  function handleSelectMuscleGroup(muscleGroup: string) {
    props.onChangeMuscleGroup(muscleGroup);
    setIsDropdownOpen(false);
  }

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <AppText variant="label">Name</AppText>
        <TextInput
          style={styles.input}
          value={props.exerciseName}
          onChangeText={props.onChangeExerciseName}
          placeholder="Exercise name"
          placeholderTextColor={Colors.dark.placeholder}
        />
      </View>

      <View style={styles.field}>
        <AppText variant="label">Muscle group</AppText>
        <View style={styles.dropdownContainer}>
          <Pressable
            style={styles.dropdownButton}
            onPress={() => setIsDropdownOpen((currentValue) => !currentValue)}
          >
            <AppText variant="body">{props.muscleGroup}</AppText>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.dark.mutedText}
            />
          </Pressable>

          {isDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {props.muscleGroupOptions.map((muscleGroup) => {
                const isSelected = muscleGroup === props.muscleGroup;

                return (
                  <Pressable
                    key={muscleGroup}
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => handleSelectMuscleGroup(muscleGroup)}
                  >
                    <AppText
                      variant="body"
                      color={isSelected ? 'accent' : 'text'}
                    >
                      {muscleGroup}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {props.successMessage && (
        <View style={styles.successToast}>
          <AppText variant="body" color="success">
            {props.successMessage}
          </AppText>
        </View>
      )}

      {props.error && <AppText color="destructive">{props.error}</AppText>}

      <Button
        title={props.isSaving ? 'Creating...' : 'Create exercise'}
        size="md"
        loading={props.isSaving}
        onPress={props.onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.dark.text,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 2,
  },
  dropdownButton: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // The menu floats below the button so opening it doesn't push the form down.
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    zIndex: 3,
    elevation: 3,
    gap: Spacing.xs,
    padding: Spacing.xs,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: Radius.md,
  },
  // The 1px border is always there (transparent) so selecting an option doesn't shift it.
  dropdownOption: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.surfaceMuted,
  },
  dropdownOptionSelected: {
    borderColor: Colors.dark.accent,
  },
  successToast: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.success,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
});
