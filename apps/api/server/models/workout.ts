export interface WorkoutData {
  performedOn: string;
  createdAt: string;
}

export interface Workout extends WorkoutData {
  id: number;
}
