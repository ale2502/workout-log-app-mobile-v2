export interface SetData {
  exerciseId: number;
  workoutId: number;
  setNumber: number;
  reps: number;
  load: number | null;
  rir: number | null;
  note: string | null;
}

export interface Set extends SetData {
  id: number;
}

export interface SetDisplay {
  id: number;
  performedOn: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  load: number | null;
  rir: number | null;
  note: string | null;
}
