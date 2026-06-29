import db from './connection.ts';
import {
  ExerciseVariant,
  ExerciseVariantData,
  ExerciseVariantDisplay,
} from '../models/exercise-variant.ts';

const columns = [
  'id',
  'exercise_id as exerciseId',
  'gym_id as gymId',
  'label',
];

const displayColumns = [
  'exercise_variants.id as id',
  'exercise_variants.exercise_id as exerciseId',
  'exercise_variants.gym_id as gymId',
  'exercise_variants.label as label',
  'exercises.name as exerciseName',
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

export async function getExerciseVariantsByGymId(
  gymId: number,
): Promise<ExerciseVariantDisplay[]> {
  return db('exercise_variants')
    .join('exercises', 'exercise_variants.exercise_id', 'exercises.id')
    .where('exercise_variants.gym_id', gymId)
    .orderBy('exercises.name', 'asc')
    .orderBy('exercise_variants.label', 'asc')
    .select(displayColumns);
}

export async function updateExerciseVariantById(
  id: number,
  label: string,
): Promise<ExerciseVariant | undefined> {
  const [variant] = await db('exercise_variants')
    .where('id', id)
    .update({ label: label.trim() })
    .returning(columns);

  return variant;
}
