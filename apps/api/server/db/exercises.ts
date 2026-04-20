import db from './connection.ts';
import { Exercise } from '../models/exercise.ts';

const exerciseColumns = ['id', 'name', 'muscle_group as muscleGroup'];

export async function getAllExercises(): Promise<Exercise[]> {
  return db('exercises').select(exerciseColumns);
}
