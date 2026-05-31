export interface WorkoutData {
  performedOn: string;
}

// createdAt exists only after the DB automatically creates it
export interface Workout extends WorkoutData {
  id: number;
  createdAt: string;
}
