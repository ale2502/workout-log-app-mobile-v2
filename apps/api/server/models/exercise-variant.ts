export interface ExerciseVariantData {
  exerciseId: number;
  gymId: number;
  label: string;
}

export interface ExerciseVariant extends ExerciseVariantData {
  id: number;
}
