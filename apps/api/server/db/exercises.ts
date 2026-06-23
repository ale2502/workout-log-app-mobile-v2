import db from './connection.ts';
import { Exercise, ExerciseData } from '../models/exercise.ts';

const exerciseColumns = ['id', 'name', 'muscle_group as muscleGroup'];

export async function getAllExercises(): Promise<Exercise[]> {
  return db('exercises').select(exerciseColumns);
}

export async function addNewExercise(
  newExercise: ExerciseData,
): Promise<Exercise> {
  const [newExerciseAdded] = await db('exercises')
    .insert({
      name: newExercise.name,
      muscle_group: newExercise.muscleGroup,
    })
    .returning(exerciseColumns);
  return newExerciseAdded;
}
