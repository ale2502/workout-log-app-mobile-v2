import db from './connection.ts';
import { Set, SetDisplay, SetData } from '../models/set.ts';

const columnsSetDisplay = [
  'sets.id as id',
  'sets.exercise_id as exerciseId',
  'workouts.performed_on as performedOn',
  'exercises.name as exerciseName',
  'set_number as setNumber',
  'reps',
  'load',
  'rir',
  'note',
];

const columnsNewSet = [
  'id',
  'exercise_id as exerciseId',
  'workout_id as workoutId',
  'set_number as setNumber',
  'reps',
  'load',
  'rir',
  'note',
];

export async function addSet(newSet: SetData): Promise<Set> {
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
    .returning(columnsNewSet);
  return newSetArr[0];
}

export async function getSetsByWorkoutAndExercise(
  workoutId: number,
  exerciseId: number,
): Promise<SetDisplay[]> {
  const sets = await db('sets')
    .join('exercises', 'sets.exercise_id', 'exercises.id')
    .join('workouts', 'sets.workout_id', 'workouts.id')
    .where('sets.workout_id', workoutId)
    .where('sets.exercise_id', exerciseId)
    .orderBy('set_number', 'asc')
    .select(columnsSetDisplay);
  return sets as SetDisplay[];
}

export async function updateSetById(
  id: number,
  updatedSet: SetData,
): Promise<Set> {
  const updatedSetArr = await db('sets')
    .where('id', id)
    .update({
      exercise_id: updatedSet.exerciseId,
      workout_id: updatedSet.workoutId,
      set_number: updatedSet.setNumber,
      reps: updatedSet.reps,
      load: updatedSet.load,
      rir: updatedSet.rir,
      note: updatedSet.note,
    })
    .returning(columnsNewSet);
  return updatedSetArr[0];
}

export async function deleteSetById(id: number): Promise<number> {
  // Before deleting the set, we need to save its workout_id and exercise_id
  const setToDelete = await db('sets').where('id', id).first();

  if (!setToDelete) {
    return 0;
  }

  const deletedCount = await db('sets').where('id', id).delete();

  // Fetch the remaining sets and reorder them from lowest to highest.
  const remainingSets = await db('sets')
    .where('workout_id', setToDelete.workout_id)
    .where('exercise_id', setToDelete.exercise_id)
    .orderBy('set_number', 'asc');

  for (let index = 0; index < remainingSets.length; index++) {
    const set = remainingSets[index];
    const newSetNumber = index + 1;

    // Update this remaining set to its new position
    await db('sets').where('id', set.id).update({
      set_number: newSetNumber,
    });
  }

  return deletedCount;
}

// Get all the sets performed in one workout and order them first by exercise name then after set number
export async function getSetsByWorkoutId(
  workoutId: number,
): Promise<SetDisplay[]> {
  const workoutSets = await db('sets')
    .join('exercises', 'sets.exercise_id', 'exercises.id')
    .join('workouts', 'sets.workout_id', 'workouts.id')
    .where('sets.workout_id', workoutId)
    .orderBy('exercises.name', 'asc')
    .orderBy('set_number', 'asc')
    .select(columnsSetDisplay);
  return workoutSets as SetDisplay[];
}

// Deleting sets for an exercise within a workout means deleting the entire exercise for the workout
export async function deleteSetsByWorkoutAndExercise(
  workoutId: number,
  exerciseId: number,
): Promise<number> {
  const deletedCount = await db('sets')
    .where('workout_id', workoutId)
    .where('exercise_id', exerciseId)
    .delete();
  return deletedCount;
}
