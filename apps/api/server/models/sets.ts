export interface SetData {
  exerciseId: number;
  workoutId: number;
  setNumber: number;
  reps: number;
  load: number;
  rir: number;
  note: string;
}

export interface Set extends SetData {
  id: number;
}
