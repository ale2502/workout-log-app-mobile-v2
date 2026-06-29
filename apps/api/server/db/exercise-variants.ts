import db from './connection.ts';
import {
  ExerciseVariant,
  ExerciseVariantData,
} from '../models/exercise-variant.ts';

const columns = [
  'id',
  'exercise_id as exerciseId',
  'gym_id as gymId',
  'label',
];

export async function getExerciseVariants(
  exerciseId: number,
  gymId: number,
): Promise<ExerciseVariant[]> {
  return db('exercise_variants')
    .where('exercise_id', exerciseId)
    .where('gym_id', gymId)
    .orderBy('label', 'asc')
    .select(columns);
}

export async function addExerciseVariant(
  newVariant: ExerciseVariantData,
): Promise<ExerciseVariant> {
  const [variant] = await db('exercise_variants')
    .insert({
      exercise_id: newVariant.exerciseId,
      gym_id: newVariant.gymId,
      label: newVariant.label.trim(),
    })
    .returning(columns);

  return variant;
}
