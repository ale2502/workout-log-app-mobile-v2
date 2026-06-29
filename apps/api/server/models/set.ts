export interface SetData {
  exerciseId: number;
  workoutId: number;
  exerciseVariantId: number;
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
  exerciseId: number;
  workoutId: number;
  exerciseVariantId: number;
  performedOn: string;
  gymId: number;
  gymName: string;
  exerciseName: string;
  exerciseVariantLabel: string;
  setNumber: number;
  reps: number;
  load: number | null;
  rir: number | null;
  note: string | null;
}
