export interface WorkoutData {
  performedOn?: string;
  gymId?: number;
}

export interface Workout {
  id: number;
  performedOn: string;
  createdAt: string;
  gymId: number;
  gymName: string;
}
