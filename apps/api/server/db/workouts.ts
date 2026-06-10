import db from './connection';
import { Workout } from '../models/workout';

const columns = [
  'id',
  'performed_on as performedOn',
  'created_at as createdAt',
];

// addWorkout DB function doesn't need created_at because it is created automatically
export async function addWorkout(): Promise<Workout> {
  const newWorkoutArr = await db('workouts').insert({}).returning(columns);
  return newWorkoutArr[0];
}

export async function getWorkouts(): Promise<Workout[]> {
  return db('workouts').orderBy('created_at', 'desc').select(columns);
}

export async function deleteWorkoutById(id: number): Promise<number> {
  // Delete sets first because they are the children and DB might block it if you try to delete the workout first
  await db('sets').where('workout_id', id).delete();
  // Delete workout after
  return db('workouts').where('id', id).delete();
}
