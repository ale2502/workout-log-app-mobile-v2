import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getStoredDefaultGymId, storeDefaultGymId } from '@/lib/gyms';

interface Gym {
  id: number;
  name: string;
}

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
}

interface ExerciseVariantDisplay {
  id: number;
  exerciseId: number;
  gymId: number;
  label: string;
  exerciseName: string;
}

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

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();

    if (typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export default function ManageGymsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors];

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
  const [variants, setVariants] = useState<ExerciseVariantDisplay[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(
    null,
  );
  const [editingGymName, setEditingGymName] = useState('');
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
  const selectedManageExercise = exercises.find(
    (exercise) => exercise.id === selectedManageExerciseId,
  );
  const manageExerciseOptions = exercises.filter((exercise) =>
    variants.some((variant) => variant.exerciseId === exercise.id),
  );
  const filteredVariants =
    selectedManageExerciseId === null
      ? []
      : variants.filter(
          (variant) => variant.exerciseId === selectedManageExerciseId,
        );

  const groupedVariants = filteredVariants.reduce<
    Record<string, ExerciseVariantDisplay[]>
  >((groups, variant) => {
    if (groups[variant.exerciseName] === undefined) {
      groups[variant.exerciseName] = [];
    }

    groups[variant.exerciseName].push(variant);
    return groups;
  }, {});

  const loadVariants = useCallback(async (gymId: number) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/gyms/${gymId}/exercise-variants`,
      );

      if (!response.ok) {
        throw new Error('Failed to load machines');
      }

      const data: ExerciseVariantDisplay[] = await response.json();
      setVariants(sortVariants(data));
    } catch {
      setError('Could not load machines');
    }
  }, []);

  useEffect(() => {
    async function loadManageData() {
      try {
        const [gymsResponse, exercisesResponse] = await Promise.all([
          fetch(`${process.env.EXPO_PUBLIC_API_URL}/gyms`),
          fetch(`${process.env.EXPO_PUBLIC_API_URL}/exercises`),
        ]);

        if (!gymsResponse.ok || !exercisesResponse.ok) {
          throw new Error('Failed to load manage data');
        }

        const gymsData: Gym[] = await gymsResponse.json();
        const exercisesData: Exercise[] = await exercisesResponse.json();
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
      setVariants([]);
      return;
    }

    loadVariants(selectedGymId);
  }, [loadVariants, selectedGymId]);

  useEffect(() => {
    setEditingGymName(selectedGym?.name ?? '');
  }, [selectedGym?.id, selectedGym?.name]);

  useEffect(() => {
    if (selectedManageExerciseId === null) {
      return;
    }

    const selectedExerciseHasVariants = variants.some(
      (variant) => variant.exerciseId === selectedManageExerciseId,
    );

    if (!selectedExerciseHasVariants) {
      setSelectedManageExerciseId(null);
      setIsManageExerciseDropdownOpen(false);
      handleCancelEditVariant();
    }
  }, [selectedManageExerciseId, variants]);

  async function handleSelectGym(gym: Gym) {
    setSelectedGymId(gym.id);
    setIsGymDropdownOpen(false);
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
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/gyms/${selectedGymId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editingGymName }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, 'Could not update gym'),
        );
      }

      const updatedGym: Gym = await response.json();
      setGyms((currentGyms) =>
        sortGyms(
          currentGyms.map((gym) =>
            gym.id === updatedGym.id ? updatedGym : gym,
          ),
        ),
      );
      setEditingGymName(updatedGym.name);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not update gym',
      );
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
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/gyms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGymName }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Could not add gym'));
      }

      const createdGym: Gym = await response.json();
      setGyms((currentGyms) => sortGyms([...currentGyms, createdGym]));
      setSelectedGymId(createdGym.id);
      setNewGymName('');
      setIsGymDropdownOpen(false);
      setEditingVariantId(null);
      setEditingVariantLabel('');
      setError(null);
      await storeDefaultGymId(createdGym.id);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not add gym',
      );
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
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/exercise-variants`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: selectedExerciseId,
            gymId: selectedGymId,
            label: machineLabel,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, 'Could not add machine'),
        );
      }

      const createdVariant = await response.json();
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
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not add machine',
      );
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
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/exercise-variants/${editingVariantId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: editingVariantLabel }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, 'Could not update machine'),
        );
      }

      const updatedVariant = await response.json();
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
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not update machine',
      );
    }
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Manage Gyms' }} />
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading gyms...</ThemedText>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Manage Gyms' }} />
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.title}>
            Manage Gyms and Machines
          </ThemedText>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.gymControlGroup,
                isGymDropdownOpen && styles.dropdownGroupOpen,
              ]}
            >
              <View style={styles.sectionTitleRow}>
                <ThemedText type="defaultSemiBold">Default gym</ThemedText>
                <Pressable
                  style={[styles.helpButton, { borderColor: colors.border }]}
                  onPress={() =>
                    setIsDefaultGymTooltipVisible(
                      (currentValue) => !currentValue,
                    )
                  }
                >
                  <Text
                    style={[styles.helpButtonText, { color: colors.mutedText }]}
                  >
                    ?
                  </Text>
                </Pressable>
              </View>

              {isDefaultGymTooltipVisible && (
                <View
                  style={[
                    styles.helpBubble,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.helpBubbleText, { color: colors.mutedText }]}
                  >
                    This gym is used automatically when you start your next
                    workout. Change it here before starting if you are training
                    somewhere else.
                  </Text>
                </View>
              )}

              <View style={styles.dropdownContainer}>
                <Pressable
                  style={[
                    styles.field,
                    styles.dropdownButton,
                    isGymDropdownOpen && styles.dropdownButtonOpen,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() =>
                    setIsGymDropdownOpen((currentValue) => !currentValue)
                  }
                >
                  <Text style={[styles.fieldText, { color: colors.text }]}>
                    {selectedGym?.name ?? 'Select gym'}
                  </Text>
                  <Ionicons
                    name={isGymDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.mutedText}
                  />
                </Pressable>

                {isGymDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {gyms.map((gym, index) => {
                      const isSelected = gym.id === selectedGymId;
                      const isLastOption = index === gyms.length - 1;

                      return (
                        <Pressable
                          key={gym.id}
                          style={[
                            styles.dropdownOption,
                            { backgroundColor: colors.surface },
                            !isLastOption && [
                              styles.dropdownOptionBorder,
                              { borderBottomColor: colors.border },
                            ],
                            isSelected && {
                              backgroundColor: colors.surfaceMuted,
                            },
                          ]}
                          onPress={() => handleSelectGym(gym)}
                        >
                          <Text
                            style={[styles.fieldText, { color: colors.text }]}
                          >
                            {gym.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.gymControlGroup}>
              <ThemedText type="defaultSemiBold">Edit gym name</ThemedText>

              <View style={styles.inlineForm}>
                <TextInput
                  style={[
                    styles.field,
                    styles.input,
                    styles.inlineInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  placeholder="Gym name"
                  placeholderTextColor={colors.mutedText}
                  value={editingGymName}
                  onChangeText={setEditingGymName}
                />
                <Pressable
                  style={[
                    styles.iconButton,
                    { backgroundColor: colors.primary },
                    isSavingGymName && styles.disabledButton,
                  ]}
                  onPress={handleSaveGymName}
                  disabled={isSavingGymName}
                >
                  <Ionicons
                    name="checkmark"
                    size={24}
                    color={colors.onPrimary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.gymControlGroup}>
              <ThemedText type="defaultSemiBold">Add gym</ThemedText>

              <View style={styles.inlineForm}>
                <TextInput
                  style={[
                    styles.field,
                    styles.input,
                    styles.inlineInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  placeholder="New gym name"
                  placeholderTextColor={colors.mutedText}
                  value={newGymName}
                  onChangeText={setNewGymName}
                />
                <Pressable
                  style={[
                    styles.iconButton,
                    { backgroundColor: colors.primary },
                    isAddingGym && styles.disabledButton,
                  ]}
                  onPress={handleAddGym}
                  disabled={isAddingGym}
                >
                  <Ionicons
                    name="checkmark"
                    size={24}
                    color={colors.onPrimary}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.gymControlGroup}>
              <View style={styles.sectionTitleRow}>
                <ThemedText type="defaultSemiBold">Add machine</ThemedText>
                <Pressable
                  style={[styles.helpButton, { borderColor: colors.border }]}
                  onPress={() =>
                    setIsMachineTooltipVisible((currentValue) => !currentValue)
                  }
                >
                  <Text
                    style={[styles.helpButtonText, { color: colors.mutedText }]}
                  >
                    ?
                  </Text>
                </Pressable>
              </View>

              {isMachineTooltipVisible && (
                <View
                  style={[
                    styles.helpBubble,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.helpBubbleText, { color: colors.mutedText }]}
                  >
                    Add a gym-specific version of the selected exercise, such as
                    Pulldown 1 or Pulldown 2 when this gym has more than one
                  machine.
                </Text>
              </View>
            )}

              <Text style={{ color: colors.mutedText }}>
                {selectedGym?.name ?? 'No gym selected'}
              </Text>

              <View style={styles.dropdownContainer}>
                <Pressable
                  style={[
                    styles.field,
                    styles.dropdownButton,
                    isExerciseDropdownOpen && styles.dropdownButtonOpen,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() =>
                    setIsExerciseDropdownOpen((currentValue) => !currentValue)
                  }
                >
                  <Text style={[styles.fieldText, { color: colors.text }]}>
                    {selectedExercise?.name ?? 'Select exercise'}
                  </Text>
                  <Ionicons
                    name={
                      isExerciseDropdownOpen ? 'chevron-up' : 'chevron-down'
                    }
                    size={20}
                    color={colors.mutedText}
                  />
                </Pressable>

                {isExerciseDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {exercises.map((exercise, index) => {
                      const isSelected = exercise.id === selectedExerciseId;
                      const isLastOption = index === exercises.length - 1;

                      return (
                        <Pressable
                          key={exercise.id}
                          style={[
                            styles.dropdownOption,
                            { backgroundColor: colors.surface },
                            !isLastOption && [
                              styles.dropdownOptionBorder,
                              { borderBottomColor: colors.border },
                            ],
                            isSelected && {
                              backgroundColor: colors.surfaceMuted,
                            },
                          ]}
                          onPress={() => {
                            setSelectedExerciseId(exercise.id);
                            setIsExerciseDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[styles.fieldText, { color: colors.text }]}
                          >
                            {exercise.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inlineForm}>
              <TextInput
                style={[
                  styles.field,
                  styles.input,
                  styles.inlineInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="Machine label"
                placeholderTextColor={colors.mutedText}
                value={machineLabel}
                onChangeText={setMachineLabel}
              />
              <Pressable
                style={[styles.iconButton, { backgroundColor: colors.primary }]}
                onPress={handleAddMachine}
              >
                <Ionicons name="add" size={24} color={colors.onPrimary} />
              </Pressable>
            </View>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.gymControlGroup}>
              <ThemedText type="defaultSemiBold">Manage machines</ThemedText>
              <Text style={{ color: colors.mutedText }}>
                {selectedGym?.name ?? 'No gym selected'}
              </Text>
              <Text
                style={[styles.sectionHelpText, { color: colors.mutedText }]}
              >
                Select a generic exercise to edit its variant label.
              </Text>

              <View style={styles.dropdownContainer}>
                <Pressable
                  style={[
                    styles.field,
                    styles.dropdownButton,
                    isManageExerciseDropdownOpen && styles.dropdownButtonOpen,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() =>
                    setIsManageExerciseDropdownOpen(
                      (currentValue) => !currentValue,
                    )
                  }
                >
                  <Text style={[styles.fieldText, { color: colors.text }]}>
                    {selectedManageExercise?.name ?? 'Select generic exercise'}
                  </Text>
                  <Ionicons
                    name={
                      isManageExerciseDropdownOpen
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={20}
                    color={colors.mutedText}
                  />
                </Pressable>

                {isManageExerciseDropdownOpen && (
                  <View
                    style={[
                      styles.inlineDropdownMenu,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {manageExerciseOptions.map((exercise, index) => {
                      const isSelected =
                        exercise.id === selectedManageExerciseId;
                      const isLastOption =
                        index === manageExerciseOptions.length - 1;

                      return (
                        <Pressable
                          key={exercise.id}
                          style={[
                            styles.dropdownOption,
                            { backgroundColor: colors.surface },
                            !isLastOption && [
                              styles.dropdownOptionBorder,
                              { borderBottomColor: colors.border },
                            ],
                            isSelected && {
                              backgroundColor: colors.surfaceMuted,
                            },
                          ]}
                          onPress={() => {
                            setSelectedManageExerciseId(exercise.id);
                            setIsManageExerciseDropdownOpen(false);
                            handleCancelEditVariant();
                          }}
                        >
                          <Text
                            style={[styles.fieldText, { color: colors.text }]}
                          >
                            {exercise.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            {variants.length === 0 ? (
              <Text style={{ color: colors.mutedText }}>
                No machines found.
              </Text>
            ) : selectedManageExerciseId === null ? null : (
              Object.entries(groupedVariants).map(
                ([exerciseName, machines]) => (
                  <View key={exerciseName} style={styles.exerciseSection}>
                    <Text
                      style={[styles.exerciseTitle, { color: colors.text }]}
                    >
                      {exerciseName}
                    </Text>

                    {machines.map((machine) => {
                      const isEditing = machine.id === editingVariantId;

                      return (
                        <View
                          key={machine.id}
                          style={[
                            styles.machineRow,
                            { borderColor: colors.border },
                          ]}
                        >
                          {isEditing ? (
                            <>
                              <TextInput
                                style={[
                                  styles.field,
                                  styles.input,
                                  styles.inlineInput,
                                  {
                                    color: colors.text,
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                  },
                                ]}
                                value={editingVariantLabel}
                                onChangeText={setEditingVariantLabel}
                              />
                              <Pressable
                                style={[
                                  styles.smallIconButton,
                                  { backgroundColor: colors.primary },
                                ]}
                                onPress={handleSaveVariant}
                              >
                                <Ionicons
                                  name="checkmark"
                                  size={20}
                                  color={colors.onPrimary}
                                />
                              </Pressable>
                              <Pressable
                                style={[
                                  styles.smallIconButton,
                                  { backgroundColor: colors.surfaceMuted },
                                ]}
                                onPress={handleCancelEditVariant}
                              >
                                <Ionicons
                                  name="close"
                                  size={20}
                                  color={colors.text}
                                />
                              </Pressable>
                            </>
                          ) : (
                            <>
                              <Text
                                style={[
                                  styles.machineLabel,
                                  { color: colors.text },
                                ]}
                              >
                                {machine.label}
                              </Text>
                              <Pressable
                                style={[
                                  styles.smallIconButton,
                                  { backgroundColor: colors.surfaceMuted },
                                ]}
                                onPress={() => handleStartEditVariant(machine)}
                              >
                                <Ionicons
                                  name="create-outline"
                                  size={19}
                                  color={colors.text}
                                />
                              </Pressable>
                            </>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ),
              )
            )}
          </View>

          {error && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          )}
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    padding: 24,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 14,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 2,
  },
  field: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  fieldText: {
    fontSize: 16,
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  inlineDropdownMenu: {
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
  dropdownOptionBorder: {
    borderBottomWidth: 1,
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
    gap: 8,
  },
  helpButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  helpBubble: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  helpBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHelpText: {
    fontSize: 14,
    lineHeight: 19,
  },
  input: {
    fontSize: 16,
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  smallIconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseSection: {
    gap: 8,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  machineRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  machineLabel: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    fontWeight: '700',
  },
});
