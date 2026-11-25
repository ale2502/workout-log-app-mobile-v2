import { request } from './client';
import type { Gym, GymData } from '../../../api/server/models/gym';
import type {
  ExerciseVariantDisplay,
} from '../../../api/server/models/exercise-variant';

export function getGyms() {
  return request<Gym[]>('/gyms');
}

export function createGym(gym: GymData) {
  return request<Gym>('/gyms', { method: 'POST', body: gym });
}

export function updateGym(id: number, gym: GymData) {
  return request<Gym>(`/gyms/${id}`, { method: 'PATCH', body: gym });
}

// Every machine at one gym, with its exercise name (for the Gyms screen).
export function getGymExerciseVariants(gymId: number) {
  return request<ExerciseVariantDisplay[]>(`/gyms/${gymId}/exercise-variants`);
}
