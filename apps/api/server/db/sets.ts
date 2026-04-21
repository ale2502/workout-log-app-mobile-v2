import db from './connection.ts';
import { Set } from '../models/sets.ts';

const setColumns = [
  'id',
  'exercise_id as exerciseId',
  'workout_id as workoutId',
  'set_number as setNumber',
  'reps',
  'load',
  'rir',
  'note',
];

export async function getAllSets(): Promise<Set[]> {
  return db('sets').select(setColumns);
}
