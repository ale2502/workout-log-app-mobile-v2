import { request } from './client';
import type {
  ExerciseVariant,
  ExerciseVariantData,
} from '../../../api/server/models/exercise-variant';

type ExerciseVariantFilter = {
  exerciseId: number;
  gymId: number;
};

// The machines for one exercise at one gym.
export function getExerciseVariants({
  exerciseId,
  gymId,
}: ExerciseVariantFilter) {
  return request<ExerciseVariant[]>(
    `/exercise-variants?exerciseId=${exerciseId}&gymId=${gymId}`,
  );
}

export function createExerciseVariant(variant: ExerciseVariantData) {
  return request<ExerciseVariant>('/exercise-variants', {
    method: 'POST',
    body: variant,
  });
}

// Only the label can change: the exercise and gym are what the machine *is*.
export function updateExerciseVariant(id: number, changes: { label: string }) {
  return request<ExerciseVariant>(`/exercise-variants/${id}`, {
    method: 'PATCH',
    body: changes,
  });
}
