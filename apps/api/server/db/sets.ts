import db from './connection.ts';
import { SetDisplay } from '../models/sets.ts';

export async function getAllSets(): Promise<SetDisplay[]> {
  const sets = await db('sets')
    // Join sets and exercises tables
    .join('exercises', 'sets.exercise_id', 'exercises.id')
    // Join sets and workouts tables
    .join('workouts', 'sets.workout_id', 'workouts.id')
    .select(
      'sets.id as id',
      'workouts.performed_on as performedOn',
      'exercises.name as exerciseName',
      'set_number as setNumber',
      'reps',
      'load',
      'rir',
      'note',
    );
  return sets as SetDisplay[];
}
