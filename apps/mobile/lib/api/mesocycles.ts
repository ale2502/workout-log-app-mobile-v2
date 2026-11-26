import { request } from './client';
import type { Mesocycle, NewMesocycle } from 'workout-log-shared';

// The latest block in any phase (upcoming, running or finished), or null if none exists.
export function getCurrentMesocycle() {
  return request<Mesocycle | null>('/mesocycles/current');
}

export function startMesocycle(data: NewMesocycle) {
  return request<Mesocycle>('/mesocycles', { method: 'POST', body: data });
}

export function endMesocycle(id: number) {
  return request<Mesocycle>(`/mesocycles/${id}/end`, { method: 'PATCH' });
}

// Removes a block that has not started yet.
export function cancelMesocycle(id: number) {
  return request<void>(`/mesocycles/${id}`, { method: 'DELETE' });
}
