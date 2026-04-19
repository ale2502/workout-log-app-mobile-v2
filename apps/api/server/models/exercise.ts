export interface ExerciseData {
  name: string;
  muscleGroup: string;
}

export interface Exercise extends ExerciseData {
  id: number;
}
