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
  const [machineLabel, setMachineLabel] = useState('');
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editingVariantLabel, setEditingVariantLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGymDropdownOpen, setIsGymDropdownOpen] = useState(false);
  const [isExerciseDropdownOpen, setIsExerciseDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGym = gyms.find((gym) => gym.id === selectedGymId);
  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedExerciseId,
  );

  const groupedVariants = variants.reduce<
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

  async function handleSelectGym(gym: Gym) {
    setSelectedGymId(gym.id);
    setIsGymDropdownOpen(false);
    setEditingVariantId(null);
    setEditingVariantLabel('');
    setError(null);
    await storeDefaultGymId(gym.id);
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
          <ThemedText type="defaultSemiBold">Default gym</ThemedText>

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
                        isSelected && { backgroundColor: colors.surfaceMuted },
                      ]}
                      onPress={() => handleSelectGym(gym)}
                    >
                      <Text style={[styles.fieldText, { color: colors.text }]}>
                        {gym.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ThemedText type="defaultSemiBold">Add machine</ThemedText>

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
                name={isExerciseDropdownOpen ? 'chevron-up' : 'chevron-down'}
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
                        isSelected && { backgroundColor: colors.surfaceMuted },
                      ]}
                      onPress={() => {
                        setSelectedExerciseId(exercise.id);
                        setIsExerciseDropdownOpen(false);
                      }}
                    >
                      <Text style={[styles.fieldText, { color: colors.text }]}>
                        {exercise.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
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
          <ThemedText type="defaultSemiBold">Machines</ThemedText>

          {variants.length === 0 ? (
            <Text style={{ color: colors.mutedText }}>No machines found.</Text>
          ) : (
            Object.entries(groupedVariants).map(([exerciseName, machines]) => (
              <View key={exerciseName} style={styles.exerciseSection}>
                <Text style={[styles.exerciseTitle, { color: colors.text }]}>
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
                            style={[styles.machineLabel, { color: colors.text }]}
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
            ))
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
  dropdownOption: {
    padding: 12,
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
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
