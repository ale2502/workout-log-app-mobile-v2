import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, Modal } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { MesocycleCard } from '@/components/workout/MesocycleCard';
import { WeekStrip } from '@/components/workout/WeekStrip';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useCurrentMesocycle } from '@/hooks/useCurrentMesocycle';
import { ApiError } from '@/lib/api/client';
import { getGyms } from '@/lib/api/gyms';
import { cancelMesocycle, endMesocycle } from '@/lib/api/mesocycles';
import { createWorkout, deleteWorkout, getWorkouts } from '@/lib/api/workouts';
import { parseApiDate } from '@/lib/dates';
import { getStoredDefaultGymId, storeDefaultGymId } from '@/lib/gyms';
import { countSessionsThisWeek, getWeekStrip } from '@/lib/week';

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

// "THURSDAY 19 NOV" (the label variant uppercases it; built from parts so there is no comma).
function formatDateLabel(date: Date) {
  const weekday = date.toLocaleDateString('en-NZ', { weekday: 'long' });
  const month = date.toLocaleDateString('en-NZ', { month: 'short' });
  return `${weekday} ${date.getDate()} ${month}`;
}

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  keepTitle: string;
  confirmTitle: string;
  onKeep: () => void;
  onConfirm: () => void;
};

// Same structure as the delete-workout modal below: a bordered card with two actions.
function ConfirmModal({
  visible,
  title,
  message,
  keepTitle,
  confirmTitle,
  onKeep,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalBackdrop}>
        <Card bordered style={styles.modalCard}>
          <AppText variant="cell">{title}</AppText>
          <AppText variant="caption" color="mutedText">
            {message}
          </AppText>

          <View style={styles.modalActions}>
            <View style={styles.modalAction}>
              <Button title={keepTitle} variant="secondary" size="md" onPress={onKeep} />
            </View>
            <View style={styles.modalAction}>
              <Button
                title={confirmTitle}
                variant="destructive"
                size="md"
                onPress={onConfirm}
              />
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [defaultGymId, setDefaultGymId] = useState<number | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(
    null,
  );
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isEndBlockModalVisible, setIsEndBlockModalVisible] = useState(false);
  const [isCancelBlockModalVisible, setIsCancelBlockModalVisible] =
    useState(false);
  const {
    mesocycle,
    status: mesocycleStatus,
    isLoading: isMesocycleLoading,
    error: mesocycleError,
    reload: reloadMesocycle,
  } = useCurrentMesocycle();

  const loadWorkouts = useCallback(async () => {
    try {
      const data = await getWorkouts();
      setWorkouts(data);
    } catch {
      setError('Could not load workouts');
    }
  }, []);

  const loadGyms = useCallback(async () => {
    try {
      const data: Gym[] = await getGyms();
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
      const data = await createWorkout({ gymId: defaultGymId });
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
      await deleteWorkout(selectedWorkoutId);

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

  async function handleEndBlock() {
    if (mesocycle === null) {
      return;
    }

    setError(null);

    try {
      await endMesocycle(mesocycle.id);
      await reloadMesocycle();
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.serverMessage === 'string'
          ? err.serverMessage
          : 'Could not end block',
      );
    } finally {
      setIsEndBlockModalVisible(false);
    }
  }

  async function handleCancelBlock() {
    if (mesocycle === null) {
      return;
    }

    setError(null);

    try {
      await cancelMesocycle(mesocycle.id);
      await reloadMesocycle();
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.serverMessage === 'string'
          ? err.serverMessage
          : 'Could not cancel block',
      );
    } finally {
      setIsCancelBlockModalVisible(false);
    }
  }

  // The screen is allowed to read the clock; lib/week.ts is not.
  const today = new Date();
  const workoutDates = workouts.map((workout) =>
    parseApiDate(workout.performedOn),
  );
  const sessionCount = countSessionsThisWeek(workoutDates, today);

  return (
    <>
      <Screen scroll contentStyle={{ gap: Spacing.xl }}>
        <View style={styles.header}>
          <AppText variant="label">{formatDateLabel(today)}</AppText>
          <AppText variant="hero">Grind Notes</AppText>
        </View>

        <Button
          title="Start workout"
          icon={<Ionicons name="play" size={20} color={Colors.onAccent} />}
          onPress={handleStartWorkout}
          loading={isStartingWorkout}
        />

        {error && (
          <AppText variant="caption" color="destructive">
            {error}
          </AppText>
        )}

        {mesocycleError && (
          <AppText variant="caption" color="destructive">
            {mesocycleError}
          </AppText>
        )}

        {/* Render nothing while loading (no flash) or when the load failed and there is no data. */}
        {!(isMesocycleLoading && mesocycle === null) &&
          !(mesocycleError && mesocycle === null) && (
            <MesocycleCard
              mesocycle={mesocycle}
              status={mesocycleStatus}
              onStart={() => {
                // Step 7 opens the start modal here.
              }}
              onEnd={() => setIsEndBlockModalVisible(true)}
              onCancel={() => setIsCancelBlockModalVisible(true)}
            />
          )}

        <Card>
          <View style={styles.weekHeader}>
            <AppText variant="label">This week</AppText>
            <AppText variant="button" style={styles.sessionCount}>
              {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
            </AppText>
          </View>
          <WeekStrip days={getWeekStrip(workoutDates, today)} />
        </Card>

        <AppText variant="label" style={styles.historyLabel}>
          History
        </AppText>
        <View style={styles.historyList}>
          {workouts.map((workout, index) => {
            const performedOn = workoutDates[index];
            const createdAt = parseApiDate(workout.createdAt);

            // If isSelected is true, the border turns red and the delete icon button replaces the chevron
            const isSelected = selectedWorkoutId === workout.id;

            return (
              <Pressable
                key={workout.id}
                style={[styles.historyRow, isSelected && styles.historyRowSelected]}
                onLongPress={() => handleLongPressWorkout(workout)}
                onPress={() => handlePressWorkout(workout)}
              >
                {/* Date tile: day number over month */}
                <View style={styles.dateTile}>
                  <AppText variant="button" style={styles.dateTileDay}>
                    {performedOn.getDate()}
                  </AppText>
                  <AppText variant="label" style={styles.dateTileMonth}>
                    {performedOn.toLocaleDateString('en-NZ', { month: 'short' })}
                  </AppText>
                </View>

                {/* Title and gym name */}
                <View style={styles.workoutTextContainer}>
                  <AppText variant="body">
                    {performedOn.toLocaleDateString('en-NZ', { weekday: 'long' })}
                    {' · '}
                    {createdAt.toLocaleTimeString('en-NZ', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </AppText>
                  <AppText variant="caption" color="mutedText">
                    {workout.gymName}
                  </AppText>
                </View>

                {/* Right side of the row */}
                {isSelected ? (
                  <Pressable onPress={() => setIsDeleteModalVisible(true)}>
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color={Colors.destructive}
                    />
                  </Pressable>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={Colors.mutedText}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Screen>
      {/* Modal for confirming deletion of workout */}
      <Modal transparent visible={isDeleteModalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Card bordered style={styles.modalCard}>
            <AppText variant="cell">Delete workout?</AppText>
            <AppText variant="caption" color="mutedText">
              This will delete the workout and all saved sets.
            </AppText>

            <View style={styles.modalActions}>
              <View style={styles.modalAction}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  size="md"
                  onPress={handleCancelDeleteWorkout}
                />
              </View>
              <View style={styles.modalAction}>
                <Button
                  title="Delete"
                  variant="destructive"
                  size="md"
                  onPress={handleDeleteWorkout}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>
      <ConfirmModal
        visible={isEndBlockModalVisible}
        title="End this block?"
        message="This will be your last week. You can start a new block afterwards."
        keepTitle="Keep going"
        confirmTitle="End block"
        onKeep={() => setIsEndBlockModalVisible(false)}
        onConfirm={handleEndBlock}
      />
      <ConfirmModal
        visible={isCancelBlockModalVisible}
        title="Cancel this block?"
        message="It hasn't started yet, so nothing is lost."
        keepTitle="Keep it"
        confirmTitle="Cancel block"
        onKeep={() => setIsCancelBlockModalVisible(false)}
        onConfirm={handleCancelBlock}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCount: {
    fontSize: 18,
  },
  historyLabel: {
    fontSize: 13,
    marginBottom: -Spacing.sm,
  },
  historyList: {
    gap: Spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.surface,
  },
  historyRowSelected: {
    borderColor: Colors.destructive,
  },
  dateTile: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTileDay: {
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: 0,
  },
  dateTileMonth: {
    fontSize: 10,
    letterSpacing: 1,
  },
  workoutTextContainer: {
    flex: 1,
    gap: 2,
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalAction: {
    flex: 1,
  },
});
