import db from './connection.ts';
import type { Mesocycle, NewMesocycle } from 'workout-log-shared';

const columns = [
  'id',
  'start_date',
  'training_weeks',
  'deload_weeks',
  'start_rir',
  'end_rir',
  'ended_at',
  'created_at',
];

interface MesocycleRow {
  id: number;
  start_date: string;
  training_weeks: number;
  deload_weeks: number;
  start_rir: number;
  end_rir: number;
  ended_at: string | null;
  created_at: string;
}

function toMesocycle(row: MesocycleRow): Mesocycle {
  return {
    id: row.id,
    startDate: row.start_date,
    trainingWeeks: row.training_weeks,
    deloadWeeks: row.deload_weeks,
    startRir: row.start_rir,
    endRir: row.end_rir,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}

// The most recent mesocycle in any phase (upcoming, running, finished or ended).
export async function getCurrentMesocycle(): Promise<Mesocycle | undefined> {
  const row: MesocycleRow | undefined = await db('mesocycles')
    .orderBy([
      { column: 'start_date', order: 'desc' },
      { column: 'id', order: 'desc' },
    ])
    .first(columns);

  return row && toMesocycle(row);
}

export async function getMesocycleById(
  id: number,
): Promise<Mesocycle | undefined> {
  const row: MesocycleRow | undefined = await db('mesocycles')
    .where('id', id)
    .first(columns);

  return row && toMesocycle(row);
}

export async function createMesocycle(data: NewMesocycle): Promise<Mesocycle> {
  const [row]: MesocycleRow[] = await db('mesocycles')
    .insert({
      start_date: data.startDate,
      training_weeks: data.trainingWeeks,
      deload_weeks: data.deloadWeeks,
      start_rir: data.startRir,
      end_rir: data.endRir,
    })
    .returning(columns);

  return toMesocycle(row);
}

export async function endMesocycle(
  id: number,
  endedOn: string,
): Promise<Mesocycle | undefined> {
  const [row]: MesocycleRow[] = await db('mesocycles')
    .where('id', id)
    .update({ ended_at: endedOn })
    .returning(columns);

  return row && toMesocycle(row);
}

export async function deleteMesocycle(id: number): Promise<boolean> {
  const deletedCount = await db('mesocycles').where('id', id).del();

  return deletedCount > 0;
}
