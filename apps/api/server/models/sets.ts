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

export interface SetDisplay {
  id: number;
  exerciseName: string;
  setNumber: number;
  reps: number;
  load: number | null;
  rir: number | null;
  note: string | null;
}
