import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { Knex } from 'knex';

// Safety guard: these tests write to the database, so they must only ever run
// against the in-memory `test` database. Checked before the app (and with it
// the database connection) is imported in beforeAll.
if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    `Refusing to run API tests with NODE_ENV=${process.env.NODE_ENV}; expected "test"`,
  );
}

let app: Express;
let connection: Knex;

// Thursday 26 November 2026. The next Monday is 30 November, the previous one 23 November.
const TODAY = '2026-11-26';

// Moves the fake clock to noon (local time) on `date`, so getToday() returns
// `date` in any time zone.
function setToday(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  vi.setSystemTime(new Date(year, month - 1, day, 12, 0, 0));
}

const validBody = {
  startDate: '2026-11-30',
  trainingWeeks: 4,
  deloadWeeks: 1,
  startRir: 3,
  endRir: 0,
};

// Creates a block through the real API. The API refuses past start dates, so a
// block that is already running or finished is created by going back to its
// start date, posting it, and returning to TODAY.
async function createBlock(
  startDate: string,
  overrides: Partial<typeof validBody> = {},
) {
  setToday(startDate);
  const res = await request(app)
    .post('/mesocycles')
    .send({ ...validBody, startDate, ...overrides });
  setToday(TODAY);

  expect(res.status).toBe(201);
  return res.body as { id: number };
}

// 4 training weeks + 1 deload week starting on these Mondays, as seen from TODAY:
const upcomingStart = '2026-11-30'; // starts next Monday
const trainingStart = '2026-11-16'; // training, week 2
const deloadStart = '2026-10-26'; // deload (week 5: 23-29 November)
const finishedStart = '2026-09-28'; // last day 1 November, finished

async function getCurrent() {
  const res = await request(app).get('/mesocycles/current');
  expect(res.status).toBe(200);
  return res.body;
}

beforeAll(async () => {
  ({ default: app } = await import('../server.ts'));
  ({ default: connection } = await import('../db/connection.ts'));

  // Second guard: the connection the app uses really is the in-memory database.
  if (connection.client.config.connection.filename !== ':memory:') {
    throw new Error('API tests must use the in-memory SQLite database');
  }

  await connection.migrate.latest();
});

beforeEach(async () => {
  await connection('mesocycles').del();
  // Only Date is faked: supertest and Express need the real timers.
  vi.useFakeTimers({ toFake: ['Date'] });
  setToday(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(async () => {
  vi.useRealTimers();
  await connection?.destroy();
});

describe('GET /mesocycles/current', () => {
  it('returns null when there are no mesocycles', async () => {
    const res = await request(app).get('/mesocycles/current');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('returns the latest of several mesocycles', async () => {
    await createBlock('2026-09-07', { trainingWeeks: 2, deloadWeeks: 0 });
    await createBlock('2026-09-28', { trainingWeeks: 2, deloadWeeks: 1 });
    const latest = await createBlock(upcomingStart);

    const current = await getCurrent();

    expect(current.id).toBe(latest.id);
    expect(current.startDate).toBe(upcomingStart);
  });

  it('returns a block that finished naturally', async () => {
    const finished = await createBlock(finishedStart);

    const current = await getCurrent();

    expect(current.id).toBe(finished.id);
    expect(current.endedAt).toBeNull();
  });

  it('returns a block that was ended early', async () => {
    const running = await createBlock(trainingStart);
    await request(app).patch(`/mesocycles/${running.id}/end`).expect(200);

    const current = await getCurrent();

    expect(current.id).toBe(running.id);
    expect(current.endedAt).toBe(TODAY);
  });
});

describe('POST /mesocycles', () => {
  it('creates a mesocycle and returns 201 with exactly the stored fields', async () => {
    const res = await request(app)
      .post('/mesocycles')
      .send({ ...validBody, trainingWeeks: 5, deloadWeeks: 2, startRir: 4, endRir: 1 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.any(Number),
      startDate: '2026-11-30',
      trainingWeeks: 5,
      deloadWeeks: 2,
      startRir: 4,
      endRir: 1,
      endedAt: null,
      createdAt: expect.any(String),
    });
    expect(await getCurrent()).toEqual(res.body);
  });

  it('accepts today as the start date when today is a Monday', async () => {
    setToday('2026-11-30');

    const res = await request(app)
      .post('/mesocycles')
      .send({ ...validBody, startDate: '2026-11-30' });

    expect(res.status).toBe(201);
    expect(res.body.startDate).toBe('2026-11-30');
  });

  it('accepts next Monday as the start date on a Thursday', async () => {
    const res = await request(app).post('/mesocycles').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.startDate).toBe('2026-11-30');
  });

  it('accepts a later Monday', async () => {
    const res = await request(app)
      .post('/mesocycles')
      .send({ ...validBody, startDate: '2027-01-04' });

    expect(res.status).toBe(201);
    expect(res.body.startDate).toBe('2027-01-04');
  });

  it('ignores extra fields and does not store them', async () => {
    const res = await request(app)
      .post('/mesocycles')
      .send({
        ...validBody,
        id: 999,
        endedAt: '2026-11-01',
        createdAt: '2000-01-01 00:00:00',
        userId: 7,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe(999);
    expect(res.body.endedAt).toBeNull();
    expect(res.body.createdAt).not.toBe('2000-01-01 00:00:00');
    expect(res.body).not.toHaveProperty('userId');

    const current = await getCurrent();
    expect(current).toEqual(res.body);
  });

  it.each([
    ['startDate', 'startDate must be a valid date (YYYY-MM-DD)'],
    ['trainingWeeks', 'trainingWeeks must be a whole number from 2 to 8'],
    ['deloadWeeks', 'deloadWeeks must be a whole number from 0 to 2'],
    ['startRir', 'startRir must be a whole number from 0 to 4'],
    ['endRir', 'endRir must be a whole number from 0 to 4'],
  ])('returns 400 when %s is missing (no defaults are applied)', async (field, message) => {
    const body: Record<string, unknown> = { ...validBody };
    delete body[field];

    const res = await request(app).post('/mesocycles').send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: message });
  });

  it.each([
    ['startDate is not a Monday', { startDate: '2026-12-01' }, 'startDate must be a Monday'],
    ['startDate is in the past', { startDate: '2026-11-23' }, 'startDate must not be in the past'],
    [
      'startDate is an impossible date',
      { startDate: '2027-02-30' },
      'startDate must be a valid date (YYYY-MM-DD)',
    ],
    [
      'startDate is not in YYYY-MM-DD format',
      { startDate: '30/11/2026' },
      'startDate must be a valid date (YYYY-MM-DD)',
    ],
    [
      'trainingWeeks is below the range',
      { trainingWeeks: 1 },
      'trainingWeeks must be a whole number from 2 to 8',
    ],
    [
      'trainingWeeks is above the range',
      { trainingWeeks: 9 },
      'trainingWeeks must be a whole number from 2 to 8',
    ],
    [
      'trainingWeeks is not a whole number',
      { trainingWeeks: 4.5 },
      'trainingWeeks must be a whole number from 2 to 8',
    ],
    [
      'trainingWeeks is a string',
      { trainingWeeks: '4' },
      'trainingWeeks must be a whole number from 2 to 8',
    ],
    [
      'deloadWeeks is below the range',
      { deloadWeeks: -1 },
      'deloadWeeks must be a whole number from 0 to 2',
    ],
    [
      'deloadWeeks is above the range',
      { deloadWeeks: 3 },
      'deloadWeeks must be a whole number from 0 to 2',
    ],
    ['startRir is 5', { startRir: 5 }, 'startRir must be a whole number from 0 to 4'],
    ['endRir is -1', { endRir: -1 }, 'endRir must be a whole number from 0 to 4'],
    [
      'startRir is lower than endRir',
      { startRir: 1, endRir: 2 },
      'startRir must be greater than or equal to endRir',
    ],
  ])('returns 400 when %s', async (_label, overrides, message) => {
    const res = await request(app)
      .post('/mesocycles')
      .send({ ...validBody, ...overrides });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: message });
    expect(await getCurrent()).toBeNull();
  });

  it('returns 400 when there is no request body', async () => {
    const res = await request(app).post('/mesocycles');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'request body must be an object' });
  });

  it('returns 400 when the body is an array', async () => {
    const res = await request(app).post('/mesocycles').send([validBody]);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'request body must be an object' });
  });

  it.each([
    ['upcoming', upcomingStart],
    ['in a training week', trainingStart],
    ['in its deload', deloadStart],
  ])('returns 409 while the current block is %s', async (_label, start) => {
    const existing = await createBlock(start);

    const res = await request(app)
      .post('/mesocycles')
      .send({ ...validBody, startDate: '2027-01-04' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: 'A mesocycle is already running or scheduled',
    });
    expect((await getCurrent()).id).toBe(existing.id);
  });

  it('allows a new block after the previous one finished naturally', async () => {
    await createBlock(finishedStart);

    const res = await request(app).post('/mesocycles').send(validBody);

    expect(res.status).toBe(201);
    expect((await getCurrent()).id).toBe(res.body.id);
  });

  it('allows a new block after the previous one was ended early', async () => {
    const running = await createBlock(trainingStart);
    await request(app).patch(`/mesocycles/${running.id}/end`).expect(200);

    const res = await request(app).post('/mesocycles').send(validBody);

    expect(res.status).toBe(201);
    expect((await getCurrent()).id).toBe(res.body.id);
  });
});

describe('PATCH /mesocycles/:id/end', () => {
  it('ends a block in a training week with today as endedAt', async () => {
    const running = await createBlock(trainingStart);

    const res = await request(app).patch(`/mesocycles/${running.id}/end`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: running.id,
      startDate: trainingStart,
      endedAt: TODAY,
    });
    expect(await getCurrent()).toMatchObject({ id: running.id, endedAt: TODAY });
  });

  it('ends a block in its deload', async () => {
    const deload = await createBlock(deloadStart);

    const res = await request(app).patch(`/mesocycles/${deload.id}/end`);

    expect(res.status).toBe(200);
    expect(res.body.endedAt).toBe(TODAY);
  });

  it('returns 409 for an upcoming block', async () => {
    const upcoming = await createBlock(upcomingStart);

    const res = await request(app).patch(`/mesocycles/${upcoming.id}/end`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: 'This mesocycle has not started yet, cancel it instead',
    });
    expect((await getCurrent()).endedAt).toBeNull();
  });

  it('returns 409 when the block was already ended', async () => {
    const running = await createBlock(trainingStart);
    setToday('2026-11-24');
    await request(app).patch(`/mesocycles/${running.id}/end`).expect(200);
    setToday(TODAY);

    const res = await request(app).patch(`/mesocycles/${running.id}/end`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'This mesocycle has already ended' });
    // The first end date is kept.
    expect((await getCurrent()).endedAt).toBe('2026-11-24');
  });

  it('returns 409 for a block that finished naturally', async () => {
    const finished = await createBlock(finishedStart);

    const res = await request(app).patch(`/mesocycles/${finished.id}/end`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'This mesocycle has already ended' });
    expect((await getCurrent()).endedAt).toBeNull();
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).patch('/mesocycles/9999/end');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Mesocycle not found' });
  });

  it.each(['abc', '0', '1.5'])('returns 400 for the id "%s"', async (id) => {
    const res = await request(app).patch(`/mesocycles/${id}/end`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'mesocycle id must be a number' });
  });
});

describe('DELETE /mesocycles/:id', () => {
  it('cancels an upcoming block and removes the row', async () => {
    const upcoming = await createBlock(upcomingStart);

    const res = await request(app).delete(`/mesocycles/${upcoming.id}`);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(await getCurrent()).toBeNull();
  });

  it('returns 409 for a running block and keeps it', async () => {
    const running = await createBlock(trainingStart);

    const res = await request(app).delete(`/mesocycles/${running.id}`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: 'Only a mesocycle that has not started can be cancelled',
    });
    expect((await getCurrent()).id).toBe(running.id);
  });

  it('returns 409 for a block that finished naturally', async () => {
    const finished = await createBlock(finishedStart);

    const res = await request(app).delete(`/mesocycles/${finished.id}`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: 'Only a mesocycle that has not started can be cancelled',
    });
    expect((await getCurrent()).id).toBe(finished.id);
  });

  it('returns 404 when the same block is deleted twice', async () => {
    const upcoming = await createBlock(upcomingStart);
    await request(app).delete(`/mesocycles/${upcoming.id}`).expect(204);

    const second = await request(app).delete(`/mesocycles/${upcoming.id}`);
    const third = await request(app).delete(`/mesocycles/${upcoming.id}`);

    expect(second.status).toBe(404);
    expect(second.body).toEqual({ error: 'Mesocycle not found' });
    expect(third.status).toBe(404);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).delete('/mesocycles/9999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Mesocycle not found' });
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await request(app).delete('/mesocycles/abc');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'mesocycle id must be a number' });
  });
});

describe('server errors', () => {
  it('answers 500 with a generic message that leaks no details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Simulate a database failure by hiding the table for one request.
    await connection.schema.renameTable('mesocycles', 'mesocycles_hidden');

    try {
      const res = await request(app).get('/mesocycles/current');

      expect(res.status).toBe(500);
      expect(res.text).toBe('Something went wrong');
      expect(console.error).toHaveBeenCalled();
    } finally {
      await connection.schema.renameTable('mesocycles_hidden', 'mesocycles');
    }
  });
});
