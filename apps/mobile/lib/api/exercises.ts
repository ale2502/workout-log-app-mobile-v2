import { request } from './client';
import type {
  Exercise,
  ExerciseData,
} from '../../../api/server/models/exercise';

export function getExercises() {
  return request<Exercise[]>('/exercises');
}

// Distinct muscle group names, sorted A-Z by the server.
export function getMuscleGroups() {
  return request<string[]>('/exercises/muscle-groups');
}

export function createExercise(exercise: ExerciseData) {
  return request<Exercise>('/exercises', { method: 'POST', body: exercise });
}
