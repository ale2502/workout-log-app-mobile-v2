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

interface Workout {
  id: number;
  performedOn: string;
  createdAt: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
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

  // Reload workouts whenever Home comes back into focus so newly created workouts appear without restarting the app.
  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );

  async function handleStartWorkout() {
    setError(null);
    setIsStartingWorkout(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/workouts`,
        {
          method: 'POST',
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Workout Log</Text>

      <Pressable
        style={styles.startButton}
        onPress={handleStartWorkout}
        disabled={isStartingWorkout}
      >
        <Text style={styles.startButtonText}>
          {isStartingWorkout ? 'Starting...' : 'Start New Workout'}
        </Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text>Previous workouts</Text>
      {workouts.map((workout) => {
        const performedOn = new Date(
          workout.performedOn.replace(' ', 'T') + 'Z',
        );

        // If isSelected is true, the style on the container changes and shows the delete icon button
        const isSelected = selectedWorkoutId === workout.id;

        return (
          <Pressable
            key={workout.id}
            style={[
              styles.prevWorkoutContainer,
              isSelected && styles.selectedWorkoutContainer,
            ]}
            onLongPress={() => handleLongPressWorkout(workout)}
            onPress={() => {
              router.push({
                pathname: '/workout/[workoutId]',
                params: { workoutId: String(workout.id) },
              });
            }}
          >
            {/* Left side of the prev workouts container */}
            <View style={styles.workoutTextContainer}>
              <Text>{performedOn.toLocaleDateString('en-NZ')}</Text>
              <Text>
                {performedOn.toLocaleDateString('en-NZ', { weekday: 'long' })}
              </Text>
              <Text>
                {performedOn.toLocaleTimeString('en-NZ', {
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
                  <Ionicons name="trash-outline" size={22} color="#dc2626" />
                </Pressable>
              ) : (
                <Ionicons name="chevron-forward" size={22} color="#6b7280" />
              )}
            </View>
          </Pressable>
        );
      })}

      <Modal transparent visible={isDeleteModalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete workout?</Text>
            <Text style={styles.modalMessage}>
              This will delete the workout and all saved sets.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={handleCancelDeleteWorkout}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalDeleteButton}
                onPress={handleDeleteWorkout}
              >
                <Text style={styles.modalDeleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    gap: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  errorText: {
    color: '#dc2626',
  },
  prevWorkoutContainer: {
    padding: 10,
    paddingRight: 25,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    gap: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',

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
  selectedWorkoutContainer: {
    borderWidth: 1,
    borderColor: '#dc2626',
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
    backgroundColor: '#ffffff',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
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
    backgroundColor: '#f3f4f6',
  },
  modalCancelButtonText: {
    fontWeight: '700',
    color: '#374151',
  },
  modalDeleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  modalDeleteButtonText: {
    fontWeight: '700',
    color: '#ffffff',
  },
});
