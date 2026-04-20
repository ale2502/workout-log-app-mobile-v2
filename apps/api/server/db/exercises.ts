import db from './connection.ts';
import { Exercise, ExerciseData } from '../models/exercise.ts';

export async function getAllExercises(): Promise<Exercise[]> {
  return db('exercises').select('*');
}
