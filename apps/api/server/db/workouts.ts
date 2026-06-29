import db from './connection';
import { Workout, WorkoutData } from '../models/workout';
import { getDefaultGym } from './gyms.ts';

const columns = [
  'workouts.id as id',
  'workouts.performed_on as performedOn',
  'workouts.created_at as createdAt',
  'workouts.gym_id as gymId',
  'gyms.name as gymName',
];

export async function addWorkout(
  newWorkout: WorkoutData = {},
): Promise<Workout> {
  const gymId = newWorkout.gymId ?? (await getDefaultGym()).id;

  const insertData: { gym_id: number; performed_on?: string } = {
    gym_id: gymId,
  };

  if (newWorkout.performedOn !== undefined) {
    insertData.performed_on = newWorkout.performedOn;
  }

  const [newWorkoutRow] = await db('workouts')
    .insert(insertData)
    .returning('id');

  const workout = await getWorkoutById(newWorkoutRow.id);

  if (workout === undefined) {
    throw new Error('Created workout could not be loaded');
  }

  return workout;
}

export async function getWorkoutById(
  id: number,
): Promise<Workout | undefined> {
  return db('workouts')
    .join('gyms', 'workouts.gym_id', 'gyms.id')
    .where('workouts.id', id)
    .first(columns);
}

export async function getWorkouts(): Promise<Workout[]> {
  return db('workouts')
    .join('gyms', 'workouts.gym_id', 'gyms.id')
    .orderBy('created_at', 'desc')
    .select(columns);
}

export async function deleteWorkoutById(id: number): Promise<number> {
  // Delete sets first because they are the children and DB might block it if you try to delete the workout first
  await db('sets').where('workout_id', id).delete();
  // Delete workout after
  return db('workouts').where('id', id).delete();
}
