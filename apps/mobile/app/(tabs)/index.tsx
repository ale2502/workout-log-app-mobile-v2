import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          {isStartingWorkout ? 'Starting...' : 'Start Workout'}
        </Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}
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
});
