import { request } from './client';
import type { SetDisplay } from '../../../api/server/models/set';
import type { Workout, WorkoutData } from '../../../api/server/models/workout';

// Newest first.
export function getWorkouts() {
  return request<Workout[]>('/workouts');
}

export function createWorkout(workout: WorkoutData) {
  return request<Workout>('/workouts', { method: 'POST', body: workout });
}

export function getWorkout(id: number) {
  return request<Workout>(`/workouts/${id}`);
}

// Every set in the workout, ordered by exercise, machine, then set number.
export function getWorkoutSets(id: number) {
  return request<SetDisplay[]>(`/workouts/${id}/sets`);
}

// Also deletes the workout's sets (server side).
export function deleteWorkout(id: number) {
  return request<void>(`/workouts/${id}`, { method: 'DELETE' });
}

// "Delete exercise" on the workout screen: one machine's sets in this workout.
export function deleteExerciseVariantSets(
  workoutId: number,
  exerciseVariantId: number,
) {
  return request<void>(
    `/workouts/${workoutId}/exercise-variants/${exerciseVariantId}/sets`,
    { method: 'DELETE' },
  );
}
