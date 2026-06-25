import db from './connection.ts';
import { Exercise, ExerciseData } from '../models/exercise.ts';

const exerciseColumns = ['id', 'name', 'muscle_group as muscleGroup'];

export async function getAllExercises(): Promise<Exercise[]> {
  return db('exercises').select(exerciseColumns);
}

export async function addNewExercise(
  newExercise: ExerciseData,
): Promise<Exercise> {
  // Square brackets here take the first item from the returned array.
  const [newExerciseAdded] = await db('exercises')
    .insert({
      name: newExercise.name,
      muscle_group: newExercise.muscleGroup,
    })
    .returning(exerciseColumns);
  return newExerciseAdded;
}

export async function getAllMuscleGroups(): Promise<string[]> {
  const rows = await db('exercises')
    .distinct('muscle_group as muscleGroup')
    .orderBy('muscle_group', 'asc');

  return rows.map((row) => row.muscleGroup);
}
