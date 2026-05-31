import db from './connection';
import { WorkoutData, Workout } from '../models/workout';

const columns = [
  'id',
  'performed_on as performedOn',
  'created_at as createdAt',
];

// addWorkout DB function doesn't need created_at because it is created automatically
export async function addWorkout(newWorkout: WorkoutData) {
  const newWorkoutArr = await db('workouts').insert({}).returning(columns);
  return newWorkoutArr[0];
}

export async function getWorkouts(): Promise<Workout[]> {
  return db('workouts').orderBy('created_at', 'desc').select(columns);
}
