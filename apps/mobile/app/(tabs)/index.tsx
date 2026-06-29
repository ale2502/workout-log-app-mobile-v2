import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getStoredDefaultGymId, storeDefaultGymId } from '@/lib/gyms';

interface Workout {
  id: number;
  performedOn: string;
  createdAt: string;
  gymId: number;
  gymName: string;
}

interface Gym {
  id: number;
  name: string;
}

function parseApiDate(value: string) {
  if (value.includes(' ')) {
    return new Date(value.replace(' ', 'T') + 'Z');
  }

  return new Date(`${value}T00:00:00Z`);
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [defaultGymId, setDefaultGymId] = useState<number | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null,
  );
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const loadWorkouts = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/workouts`,
      );

      if (!response.ok) {
        throw new Error('Failed to load workouts');
      }

      const data = await response.json();
      setWorkouts(data);
    } catch {
      setError('Could not load workouts');
    }
  }, []);

  const loadGyms = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/gyms`);

      if (!response.ok) {
        throw new Error('Failed to load gyms');
      }

      const data: Gym[] = await response.json();
      const storedGymId = await getStoredDefaultGymId();
      const nextDefaultGymId = storedGymId ?? data[0]?.id ?? null;

      if (nextDefaultGymId !== null) {
        setDefaultGymId(nextDefaultGymId);
        await storeDefaultGymId(nextDefaultGymId);
      }
    } catch {
      setError('Could not load gyms');
    }
  }, []);

  // Reload workouts whenever Home comes back into focus so newly created workouts appear without restarting the app.
  useFocusEffect(
    useCallback(() => {
      loadGyms();
      loadWorkouts();
    }, [loadGyms, loadWorkouts]),
  );

  async function handleStartWorkout() {
    setError(null);
    setIsStartingWorkout(true);

    if (defaultGymId === null) {
      setError('Could not find a default gym');
      setIsStartingWorkout(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/workouts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gymId: defaultGymId }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to start new workout');
      }

      const data = await response.json();
      const workoutId = data.id;
      router.push({
        pathname: '/workout/muscle-groups',
        params: { workoutId: String(workoutId) },
      });
    } catch {
      setError('Could not start workout');
    } finally {
      setIsStartingWorkout(false);
    }
  }

  async function handleDeleteWorkout() {
    // Prevent action when no workout is selected
    if (selectedWorkoutId === null) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/workouts/${selectedWorkoutId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete workout');
      }

      setSelectedWorkoutId(null);
      setIsDeleteModalVisible(false);
      await loadWorkouts();
    } catch {
      setError('Could not delete workout');
    }
  }

  function handleCancelDeleteWorkout() {
    setIsDeleteModalVisible(false);
    setSelectedWorkoutId(null);
  }

  // Set the selectedWorkoutId to the one long-pressed
  function handleLongPressWorkout(workout: Workout) {
    setSelectedWorkoutId(workout.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handlePressWorkout(workout: Workout) {
    // If a workout is already selected, tapping the same one deselects it;
    // tapping a different one moves the selection instead of navigating.
    if (selectedWorkoutId !== null) {
      if (selectedWorkoutId === workout.id) {
        setSelectedWorkoutId(null);
        return;
      }

      setSelectedWorkoutId(workout.id);
      return;
    }
    // If no workout is selected, tapping it just nagavites to it
    router.push({
      pathname: '/workout/[workoutId]',
      params: { workoutId: String(workout.id) },
    });
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Workout Log</Text>

        <Pressable
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={handleStartWorkout}
          disabled={isStartingWorkout}
        >
          <Text style={[styles.startButtonText, { color: colors.onPrimary }]}>
            {isStartingWorkout ? 'Starting...' : 'Start New Workout'}
          </Text>
        </Pressable>

        {error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {error}
          </Text>
        )}

        <Text style={{ color: colors.text }}>Previous workouts</Text>
        {workouts.map((workout) => {
          const performedOn = parseApiDate(workout.performedOn);
          const createdAt = parseApiDate(workout.createdAt);

          // If isSelected is true, the style on the container changes and shows the delete icon button
          const isSelected = selectedWorkoutId === workout.id;

          return (
            <Pressable
              key={workout.id}
              style={[
                styles.prevWorkoutContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && { borderColor: colors.destructive },
              ]}
              onLongPress={() => handleLongPressWorkout(workout)}
              onPress={() => handlePressWorkout(workout)}
            >
              {/* Left side of the prev workouts container */}
              <View style={styles.workoutTextContainer}>
                <Text style={{ color: colors.text }}>
                  {performedOn.toLocaleDateString('en-NZ')}
                </Text>
                <Text style={{ color: colors.mutedText }}>
                  {workout.gymName}
                </Text>
                <Text style={{ color: colors.mutedText }}>
                  {performedOn.toLocaleDateString('en-NZ', { weekday: 'long' })}
                </Text>
                <Text style={{ color: colors.mutedText }}>
                  {createdAt.toLocaleTimeString('en-NZ', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </View>

              {/* Right side of the prev workouts container */}
              <View style={styles.workoutActionContainer}>
                {isSelected ? (
                  <Pressable onPress={() => setIsDeleteModalVisible(true)}>
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color={colors.destructive}
                    />
                  </Pressable>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={colors.mutedText}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      {/* Modal for confirming deletion of workout */}
      <Modal transparent visible={isDeleteModalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Delete workout?
            </Text>
            <Text style={[styles.modalMessage, { color: colors.mutedText }]}>
              This will delete the workout and all saved sets.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.modalCancelButton,
                  { backgroundColor: colors.surfaceMuted },
                ]}
                onPress={handleCancelDeleteWorkout}
              >
                <Text
                  style={[styles.modalCancelButtonText, { color: colors.text }]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalDeleteButton,
                  { backgroundColor: colors.destructive },
                ]}
                onPress={handleDeleteWorkout}
              >
                <Text
                  style={[
                    styles.modalDeleteButtonText,
                    { color: colors.onPrimary },
                  ]}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  startButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    fontWeight: '700',
  },
  errorText: {},
  prevWorkoutContainer: {
    padding: 10,
    paddingRight: 25,
    borderRadius: 8,
    gap: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutTextContainer: {
    gap: 4,
    flex: 1,
  },
  workoutActionContainer: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  // Modal
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
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
});
