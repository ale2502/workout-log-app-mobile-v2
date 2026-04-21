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
  const sets = await db('sets')
    // Join sets and exercises tables
    .join('exercises', 'sets.exercise_id', 'exercises.id')
    // Join sets and workouts tables
    .join('workouts', 'sets.workout_id', 'workouts.id');
}
