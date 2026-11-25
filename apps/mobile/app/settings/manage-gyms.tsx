import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api/client';
import { getExercises } from '@/lib/api/exercises';
import {
  createExerciseVariant,
  updateExerciseVariant,
} from '@/lib/api/exerciseVariants';
import {
  createGym,
  getGymExerciseVariants,
  getGyms,
  updateGym,
} from '@/lib/api/gyms';
import { getStoredDefaultGymId, storeDefaultGymId } from '@/lib/gyms';

import type { Exercise } from '../../../api/server/models/exercise';
import type { ExerciseVariantDisplay } from '../../../api/server/models/exercise-variant';
import type { Gym } from '../../../api/server/models/gym';

function sortVariants(variants: ExerciseVariantDisplay[]) {
  return [...variants].sort((firstVariant, secondVariant) => {
    const exerciseCompare = firstVariant.exerciseName.localeCompare(
      secondVariant.exerciseName,
    );

    if (exerciseCompare !== 0) {
      return exerciseCompare;
    }

    return firstVariant.label.localeCompare(secondVariant.label);
  });
}

function sortGyms(gyms: Gym[]) {
  return [...gyms].sort((firstGym, secondGym) =>
    firstGym.name.localeCompare(secondGym.name),
  );
}

// What a failed write shows: the server's own message when it sent one
// ("Gym name already exists"), the call's fallback when it didn't (plain-text
// 500), and the raw message for any other error (e.g. a network failure).
function getRequestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.serverMessage ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export default function ManageGymsScreen() {
  const router = useRouter();

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
  const [variants, setVariants] = useState<ExerciseVariantDisplay[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(
    null,
  );
  // null = not edited yet: the input then shows the selected gym's saved name.
  const [gymNameDraft, setGymNameDraft] = useState<string | null>(null);
  const [isSavingGymName, setIsSavingGymName] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const [isAddingGym, setIsAddingGym] = useState(false);
  const [machineLabel, setMachineLabel] = useState('');
  const [selectedManageExerciseId, setSelectedManageExerciseId] = useState<
    number | null
  >(null);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editingVariantLabel, setEditingVariantLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGymDropdownOpen, setIsGymDropdownOpen] = useState(false);
  const [isExerciseDropdownOpen, setIsExerciseDropdownOpen] = useState(false);
  const [isManageExerciseDropdownOpen, setIsManageExerciseDropdownOpen] =
    useState(false);
  const [isDefaultGymTooltipVisible, setIsDefaultGymTooltipVisible] =
    useState(false);
  const [isMachineTooltipVisible, setIsMachineTooltipVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGym = gyms.find((gym) => gym.id === selectedGymId);
  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedExerciseId,
  );
  const editingGymName = gymNameDraft ?? selectedGym?.name ?? '';
  // The picked exercise only counts while the current gym has machines for it
  // (switching gyms can remove it), so derive it instead of resetting it later.
  const manageExerciseId =
    selectedManageExerciseId !== null &&
    variants.some((variant) => variant.exerciseId === selectedManageExerciseId)
      ? selectedManageExerciseId
      : null;
  const selectedManageExercise = exercises.find(
    (exercise) => exercise.id === manageExerciseId,
  );
  const manageExerciseOptions = exercises.filter((exercise) =>
    variants.some((variant) => variant.exerciseId === exercise.id),
  );
  const filteredVariants =
    manageExerciseId === null
      ? []
      : variants.filter((variant) => variant.exerciseId === manageExerciseId);

  const groupedVariants = filteredVariants.reduce<
    Record<string, ExerciseVariantDisplay[]>
  >((groups, variant) => {
    if (groups[variant.exerciseName] === undefined) {
      groups[variant.exerciseName] = [];
    }

    groups[variant.exerciseName].push(variant);
    return groups;
  }, {});

  useEffect(() => {
    async function loadManageData() {
      try {
        const [gymsData, exercisesData] = await Promise.all([
          getGyms(),
          getExercises(),
        ]);
        const storedGymId = await getStoredDefaultGymId();
        const nextGym =
          gymsData.find((gym) => gym.id === storedGymId) ?? gymsData[0];

        setGyms(gymsData);
        setExercises(exercisesData);

        if (nextGym !== undefined) {
          setSelectedGymId(nextGym.id);
          await storeDefaultGymId(nextGym.id);
        }
      } catch {
        setError('Could not load gyms and machines');
      } finally {
        setIsLoading(false);
      }
    }

    loadManageData();
  }, []);

  useEffect(() => {
    if (selectedGymId === null) {
      return;
    }

    async function loadVariants(gymId: number) {
      try {
        const data = await getGymExerciseVariants(gymId);
        setVariants(sortVariants(data));
      } catch {
        setError('Could not load machines');
      }
    }

    loadVariants(selectedGymId);
  }, [selectedGymId]);

  async function handleSelectGym(gym: Gym) {
    if (gym.id !== selectedGymId) {
      setGymNameDraft(null);
    }

    setSelectedGymId(gym.id);
    setIsGymDropdownOpen(false);
    setIsManageExerciseDropdownOpen(false);
    setEditingVariantId(null);
    setEditingVariantLabel('');
    setError(null);
    await storeDefaultGymId(gym.id);
  }

  async function handleSaveGymName() {
    if (selectedGymId === null) {
      setError('Select a gym first');
      return;
    }

    if (editingGymName.trim() === '') {
      setError('Gym name is required');
      return;
    }

    try {
      setIsSavingGymName(true);
      const updatedGym = await updateGym(selectedGymId, {
        name: editingGymName,
      });
      setGyms((currentGyms) =>
        sortGyms(
          currentGyms.map((gym) =>
            gym.id === updatedGym.id ? updatedGym : gym,
          ),
        ),
      );
      setGymNameDraft(null);
      setError(null);
    } catch (caughtError) {
      setError(getRequestErrorMessage(caughtError, 'Could not update gym'));
    } finally {
      setIsSavingGymName(false);
    }
  }

  async function handleAddGym() {
    if (newGymName.trim() === '') {
      setError('Gym name is required');
      return;
    }

    try {
      setIsAddingGym(true);
      const createdGym = await createGym({ name: newGymName });
      setGyms((currentGyms) => sortGyms([...currentGyms, createdGym]));
      setSelectedGymId(createdGym.id);
      setGymNameDraft(null);
      setNewGymName('');
      setIsGymDropdownOpen(false);
      setIsManageExerciseDropdownOpen(false);
      setEditingVariantId(null);
      setEditingVariantLabel('');
      setError(null);
      await storeDefaultGymId(createdGym.id);
    } catch (caughtError) {
      setError(getRequestErrorMessage(caughtError, 'Could not add gym'));
    } finally {
      setIsAddingGym(false);
    }
  }

  async function handleAddMachine() {
    if (selectedGymId === null) {
      setError('Select a gym first');
      return;
    }

    if (selectedExerciseId === null) {
      setError('Select an exercise first');
      return;
    }

    if (machineLabel.trim() === '') {
      setError('Machine label is required');
      return;
    }

    try {
      const createdVariant = await createExerciseVariant({
        exerciseId: selectedExerciseId,
        gymId: selectedGymId,
        label: machineLabel,
      });
      const exercise = exercises.find(
        (currentExercise) => currentExercise.id === createdVariant.exerciseId,
      );

      if (exercise === undefined) {
        throw new Error('Could not find exercise for machine');
      }

      setVariants((currentVariants) =>
        sortVariants([
          ...currentVariants,
          {
            ...createdVariant,
            exerciseName: exercise.name,
          },
        ]),
      );
      setMachineLabel('');
      setError(null);
    } catch (caughtError) {
      setError(getRequestErrorMessage(caughtError, 'Could not add machine'));
    }
  }

  function handleStartEditVariant(variant: ExerciseVariantDisplay) {
    setEditingVariantId(variant.id);
    setEditingVariantLabel(variant.label);
    setError(null);
  }

  function handleCancelEditVariant() {
    setEditingVariantId(null);
    setEditingVariantLabel('');
  }

  async function handleSaveVariant() {
    if (editingVariantId === null) {
      return;
    }

    if (editingVariantLabel.trim() === '') {
      setError('Machine label is required');
      return;
    }

    try {
      const updatedVariant = await updateExerciseVariant(editingVariantId, {
        label: editingVariantLabel,
      });
      setVariants((currentVariants) =>
        sortVariants(
          currentVariants.map((variant) =>
            variant.id === updatedVariant.id
              ? { ...variant, label: updatedVariant.label }
              : variant,
          ),
        ),
      );
      handleCancelEditVariant();
      setError(null);
    } catch (caughtError) {
      setError(
        getRequestErrorMessage(caughtError, 'Could not update machine'),
      );
    }
  }

  const backButton = (
    <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
      <Ionicons name="chevron-back" size={22} color={Colors.text} />
    </IconButton>
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen contentStyle={styles.content}>
          {backButton}
          <AppText color="mutedText">Loading gyms...</AppText>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen scroll contentStyle={styles.content}>
        {backButton}

        <AppText variant="title">Gyms & machines</AppText>

        <Card style={styles.card}>
          <View
            style={[
              styles.gymControlGroup,
              isGymDropdownOpen && styles.dropdownGroupOpen,
            ]}
          >
            <View style={styles.sectionTitleRow}>
              <AppText variant="body">Default gym</AppText>
              <Pressable
                style={styles.helpButton}
                onPress={() =>
                  setIsDefaultGymTooltipVisible((currentValue) => !currentValue)
                }
              >
                <AppText
                  variant="caption"
                  color="mutedText"
                  style={styles.helpButtonText}
                >
                  ?
                </AppText>
              </Pressable>
            </View>

            {isDefaultGymTooltipVisible && (
              <View style={styles.helpBubble}>
                <AppText
                  variant="caption"
                  color="mutedText"
                  style={styles.helpBubbleText}
                >
                  This gym is used automatically when you start your next
                  workout. Change it here before starting if you are training
                  somewhere else.
                </AppText>
              </View>
            )}

            <View style={styles.dropdownContainer}>
              <Pressable
                style={[
                  styles.field,
                  styles.dropdownButton,
                  isGymDropdownOpen && styles.dropdownButtonOpen,
                ]}
                onPress={() =>
                  setIsGymDropdownOpen((currentValue) => !currentValue)
                }
              >
                <AppText variant="body" style={styles.fieldText}>
                  {selectedGym?.name ?? 'Select gym'}
                </AppText>
                <Ionicons
                  name={isGymDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.mutedText}
                />
              </Pressable>

              {isGymDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {gyms.map((gym, index) => {
                    const isSelected = gym.id === selectedGymId;
                    const isLastOption = index === gyms.length - 1;

                    return (
                      <Pressable
                        key={gym.id}
                        style={[
                          styles.dropdownOption,
                          !isLastOption && styles.dropdownOptionBorder,
                          isSelected && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => handleSelectGym(gym)}
                      >
                        <AppText
                          variant="body"
                          color={isSelected ? 'accent' : 'text'}
                          style={styles.fieldText}
                        >
                          {gym.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          <View style={styles.gymControlGroup}>
            <AppText variant="body">Edit gym name</AppText>

            <View style={styles.inlineForm}>
              <TextInput
                style={[styles.field, styles.input, styles.inlineInput]}
                placeholder="Gym name"
                placeholderTextColor={Colors.placeholder}
                value={editingGymName}
                onChangeText={setGymNameDraft}
              />
              <Pressable
                style={[
                  styles.iconButton,
                  isSavingGymName && styles.disabledButton,
                ]}
                onPress={handleSaveGymName}
                disabled={isSavingGymName}
              >
                <Ionicons
                  name="checkmark"
                  size={24}
                  color={Colors.onAccent}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.gymControlGroup}>
            <AppText variant="body">Add gym</AppText>

            <View style={styles.inlineForm}>
              <TextInput
                style={[styles.field, styles.input, styles.inlineInput]}
                placeholder="New gym name"
                placeholderTextColor={Colors.placeholder}
                value={newGymName}
                onChangeText={setNewGymName}
              />
              <Pressable
                style={[
                  styles.iconButton,
                  isAddingGym && styles.disabledButton,
                ]}
                onPress={handleAddGym}
                disabled={isAddingGym}
              >
                <Ionicons
                  name="checkmark"
                  size={24}
                  color={Colors.onAccent}
                />
              </Pressable>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.gymControlGroup}>
            <View style={styles.sectionTitleRow}>
              <AppText variant="body">Add machine</AppText>
              <Pressable
                style={styles.helpButton}
                onPress={() =>
                  setIsMachineTooltipVisible((currentValue) => !currentValue)
                }
              >
                <AppText
                  variant="caption"
                  color="mutedText"
                  style={styles.helpButtonText}
                >
                  ?
                </AppText>
              </Pressable>
            </View>

            {isMachineTooltipVisible && (
              <View style={styles.helpBubble}>
                <AppText
                  variant="caption"
                  color="mutedText"
                  style={styles.helpBubbleText}
                >
                  Add a gym-specific version of the selected exercise, such as
                  Pulldown 1 or Pulldown 2 when this gym has more than one
                  machine.
                </AppText>
              </View>
            )}

            <AppText variant="caption" color="mutedText">
              {selectedGym?.name ?? 'No gym selected'}
            </AppText>

            <View style={styles.dropdownContainer}>
              <Pressable
                style={[
                  styles.field,
                  styles.dropdownButton,
                  isExerciseDropdownOpen && styles.dropdownButtonOpen,
                ]}
                onPress={() =>
                  setIsExerciseDropdownOpen((currentValue) => !currentValue)
                }
              >
                <AppText variant="body" style={styles.fieldText}>
                  {selectedExercise?.name ?? 'Select exercise'}
                </AppText>
                <Ionicons
                  name={isExerciseDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.mutedText}
                />
              </Pressable>

              {isExerciseDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {exercises.map((exercise, index) => {
                    const isSelected = exercise.id === selectedExerciseId;
                    const isLastOption = index === exercises.length - 1;

                    return (
                      <Pressable
                        key={exercise.id}
                        style={[
                          styles.dropdownOption,
                          !isLastOption && styles.dropdownOptionBorder,
                          isSelected && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedExerciseId(exercise.id);
                          setIsExerciseDropdownOpen(false);
                        }}
                      >
                        <AppText
                          variant="body"
                          color={isSelected ? 'accent' : 'text'}
                          style={styles.fieldText}
                        >
                          {exercise.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          <View style={styles.inlineForm}>
            <TextInput
              style={[styles.field, styles.input, styles.inlineInput]}
              placeholder="Machine label"
              placeholderTextColor={Colors.placeholder}
              value={machineLabel}
              onChangeText={setMachineLabel}
            />
            <IconButton
              accessibilityLabel="Add machine"
              size={48}
              style={styles.accentIconButton}
              onPress={handleAddMachine}
            >
              <Ionicons name="add" size={24} color={Colors.onAccent} />
            </IconButton>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.gymControlGroup}>
            <AppText variant="body">Manage machines</AppText>
            <AppText variant="caption" color="mutedText">
              {selectedGym?.name ?? 'No gym selected'}
            </AppText>
            <AppText
              variant="caption"
              color="mutedText"
              style={styles.sectionHelpText}
            >
              Select a generic exercise to edit its variant label.
            </AppText>

            <View style={styles.dropdownContainer}>
              <Pressable
                style={[
                  styles.field,
                  styles.dropdownButton,
                  isManageExerciseDropdownOpen && styles.dropdownButtonOpen,
                ]}
                onPress={() =>
                  setIsManageExerciseDropdownOpen(
                    (currentValue) => !currentValue,
                  )
                }
              >
                <AppText variant="body" style={styles.fieldText}>
                  {selectedManageExercise?.name ?? 'Select generic exercise'}
                </AppText>
                <Ionicons
                  name={
                    isManageExerciseDropdownOpen ? 'chevron-up' : 'chevron-down'
                  }
                  size={20}
                  color={Colors.mutedText}
                />
              </Pressable>

              {isManageExerciseDropdownOpen && (
                <View style={styles.inlineDropdownMenu}>
                  {manageExerciseOptions.map((exercise, index) => {
                    const isSelected = exercise.id === manageExerciseId;
                    const isLastOption =
                      index === manageExerciseOptions.length - 1;

                    return (
                      <Pressable
                        key={exercise.id}
                        style={[
                          styles.dropdownOption,
                          !isLastOption && styles.dropdownOptionBorder,
                          isSelected && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedManageExerciseId(exercise.id);
                          setIsManageExerciseDropdownOpen(false);
                          handleCancelEditVariant();
                        }}
                      >
                        <AppText
                          variant="body"
                          color={isSelected ? 'accent' : 'text'}
                          style={styles.fieldText}
                        >
                          {exercise.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {variants.length === 0 ? (
            <AppText color="mutedText">No machines found.</AppText>
          ) : manageExerciseId === null ? null : (
            Object.entries(groupedVariants).map(([exerciseName, machines]) => (
              <View key={exerciseName} style={styles.exerciseSection}>
                <AppText variant="cell">{exerciseName}</AppText>

                {machines.map((machine) => {
                  const isEditing = machine.id === editingVariantId;

                  return (
                    <View
                      key={machine.id}
                      style={[
                        styles.machineRow,
                        isEditing && styles.machineRowEditing,
                      ]}
                    >
                      {isEditing ? (
                        <>
                          <TextInput
                            style={[
                              styles.field,
                              styles.input,
                              styles.inlineInput,
                            ]}
                            value={editingVariantLabel}
                            onChangeText={setEditingVariantLabel}
                          />
                          <IconButton
                            accessibilityLabel="Save machine label"
                            size={40}
                            style={styles.accentIconButton}
                            onPress={handleSaveVariant}
                          >
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={Colors.onAccent}
                            />
                          </IconButton>
                          <IconButton
                            accessibilityLabel="Cancel editing"
                            size={40}
                            style={styles.mutedIconButton}
                            onPress={handleCancelEditVariant}
                          >
                            <Ionicons
                              name="close"
                              size={20}
                              color={Colors.text}
                            />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <AppText variant="body" style={styles.machineLabel}>
                            {machine.label}
                          </AppText>
                          <IconButton
                            accessibilityLabel={`Edit ${machine.label}`}
                            size={40}
                            style={styles.mutedIconButton}
                            onPress={() => handleStartEditVariant(machine)}
                          >
                            <Ionicons
                              name="create-outline"
                              size={19}
                              color={Colors.text}
                            />
                          </IconButton>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </Card>

        {error && <AppText color="destructive">{error}</AppText>}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  card: {
    gap: 14,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 2,
  },
  // Inputs and dropdown buttons sit on a surface card, so they use the background color.
  field: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 48,
  },
  fieldText: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 3,
    elevation: 3,
    backgroundColor: Colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    overflow: 'hidden',
  },
  inlineDropdownMenu: {
    backgroundColor: Colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    overflow: 'hidden',
  },
  // The 1px border is always there (transparent) so selecting an option doesn't shift it.
  dropdownOption: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownOptionBorder: {
    borderBottomColor: Colors.border,
  },
  dropdownOptionSelected: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.accent,
    borderBottomColor: Colors.accent,
  },
  gymControlGroup: {
    gap: 6,
  },
  dropdownGroupOpen: {
    zIndex: 4,
    elevation: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  helpButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    fontWeight: '700',
  },
  helpBubble: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 10,
  },
  helpBubbleText: {
    lineHeight: 18,
  },
  sectionHelpText: {
    lineHeight: 19,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
  },
  inlineForm: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  inlineInput: {
    flex: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentIconButton: {
    backgroundColor: Colors.accent,
  },
  mutedIconButton: {
    backgroundColor: Colors.surfaceMuted,
  },
  disabledButton: {
    opacity: 0.6,
  },
  exerciseSection: {
    gap: Spacing.sm,
  },
  // Machine rows follow the list-row style; they sit on a surface card, so they use the background color.
  machineRow: {
    minHeight: 56,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  machineRowEditing: {
    borderColor: Colors.accent,
  },
  machineLabel: {
    flex: 1,
  },
});
