import db from './connection';
import { Workout } from '../models/workout';
import { SetDisplay } from '../models/set';

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
