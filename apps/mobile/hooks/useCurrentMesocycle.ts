import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  getMesocycleStatus,
  toLocalDateString,
  type Mesocycle,
} from 'workout-log-shared';
import { getCurrentMesocycle } from '@/lib/api/mesocycles';

export function useCurrentMesocycle() {
  const [mesocycle, setMesocycle] = useState<Mesocycle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setMesocycle(await getCurrentMesocycle());
      setError(null);
    } catch {
      setError('Could not load mesocycle');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload whenever the screen comes back into focus, like Home does for workouts.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const status =
    mesocycle === null
      ? null
      : getMesocycleStatus(mesocycle, toLocalDateString(new Date()));

  return { mesocycle, status, isLoading, error, reload };
}
