import db from './connection.ts';
import { Gym, GymData } from '../models/gym.ts';

const columns = ['id', 'name'];
const DEFAULT_GYM_NAME = 'City Fitness Newmarket';

export async function getGyms(): Promise<Gym[]> {
  return db('gyms').orderBy('name', 'asc').select(columns);
}

export async function getDefaultGym(): Promise<Gym> {
  const gym = await db('gyms').where('name', DEFAULT_GYM_NAME).first(columns);

  if (gym) {
    return gym;
  }

  const [createdGym] = await db('gyms')
    .insert({ name: DEFAULT_GYM_NAME })
    .returning(columns);

  return createdGym;
}

export async function addGym(newGym: GymData): Promise<Gym> {
  const [gym] = await db('gyms')
    .insert({ name: newGym.name.trim() })
    .returning(columns);

  return gym;
}
