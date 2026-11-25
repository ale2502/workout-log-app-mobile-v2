import { request } from './client';
// The API model is called `Set`, which would hide JavaScript's built-in Set.
import type {
  Set as SetRecord,
  SetData,
  SetDisplay,
} from '../../../api/server/models/set';

type SetFilter = {
  workoutId: number;
  exerciseId: number;
};

// The sets of one exercise within one workout, by set number.
export function getSets({ workoutId, exerciseId }: SetFilter) {
  return request<SetDisplay[]>(
    `/sets?workoutId=${workoutId}&exerciseId=${exerciseId}`,
  );
}

export function createSet(set: SetData) {
  return request<SetRecord>('/sets', { method: 'POST', body: set });
}

// The server overwrites every column, so send the whole set, not a diff.
export function updateSet(id: number, set: SetData) {
  return request<SetRecord>(`/sets/${id}`, { method: 'PATCH', body: set });
}

// The server renumbers the remaining sets of that machine to 1..n.
export function deleteSet(id: number) {
  return request<void>(`/sets/${id}`, { method: 'DELETE' });
}
