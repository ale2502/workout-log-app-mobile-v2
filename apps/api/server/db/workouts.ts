import db from './connection';
import { WorkoutData } from '../models/workout';

const columns = [
  'id',
  'performed_on as performedOn',
  'created_at as createdAt',
];

export async function addWorkout(newWorkout: WorkoutData) {
  const newWorkoutArr = await db('workouts')
    .insert({
      performed_on: newWorkout.performedOn,
    })
    .returning(columns);
  return newWorkoutArr[0];
}
