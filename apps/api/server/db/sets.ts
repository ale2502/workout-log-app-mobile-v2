import db from './connection.ts';
import { SetDisplay, SetData } from '../models/set.ts';

const columns = [
  'sets.id as id',
  'workouts.performed_on as performedOn',
  'exercises.name as exerciseName',
  'set_number as setNumber',
  'reps',
  'load',
  'rir',
  'note',
];

export async function getAllSets(): Promise<SetDisplay[]> {
  const sets = await db('sets')
    // Join sets and exercises tables
    .join('exercises', 'sets.exercise_id', 'exercises.id')
    // Join sets and workouts tables
    .join('workouts', 'sets.workout_id', 'workouts.id')
    .select(columns);
  return sets as SetDisplay[];
}

export async function addSet(newSet: SetData) {
  const newSetArr = await db('sets')
    .insert({
      exercise_id: newSet.exerciseId,
      workout_id: newSet.workoutId,
      set_number: newSet.setNumber,
      reps: newSet.reps,
      load: newSet.load,
      rir: newSet.rir,
      note: newSet.note,
    })
    .returning(columns);
  return newSetArr[0];
}
