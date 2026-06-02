import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  useEffect(() => {
    async function loadWorkouts() {
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
    }
    loadWorkouts();
  }, []);

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

  return (
    <View style={styles.container}>
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

        return (
          <View key={workout.id} style={styles.prevWorkoutContainer}>
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
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    gap: 4,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
});
