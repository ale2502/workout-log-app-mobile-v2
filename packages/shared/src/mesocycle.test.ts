import { describe, it, expect } from 'vitest';
import {
  addDays,
  daysBetween,
  getLastDay,
  getMesocycleInputError,
  getMesocycleStatus,
  getNextStartDate,
  getTargetRir,
  type MesocycleSchedule,
} from './mesocycle';

function block(overrides: Partial<MesocycleSchedule> = {}): MesocycleSchedule {
  return {
    startDate: '2026-11-09',
    trainingWeeks: 5,
    deloadWeeks: 1,
    startRir: 3,
    endRir: 0,
    endedAt: null,
    ...overrides,
  };
}

function ramp(trainingWeeks: number, startRir: number, endRir: number, deloadWeeks = 0): number[] {
  const meso = { trainingWeeks, deloadWeeks, startRir, endRir };
  return Array.from({ length: trainingWeeks }, (_, i) => getTargetRir(meso, i + 1));
}

describe('getTargetRir', () => {
  describe('ramp table, 3 to 0', () => {
    it.each([
      [3, [3, 2, 0]],
      [4, [3, 2, 1, 0]],
      [5, [3, 2, 2, 1, 0]],
      [6, [3, 2, 2, 1, 1, 0]],
    ])('%i training weeks', (weeks, expected) => {
      expect(ramp(weeks, 3, 0)).toEqual(expected);
    });
  });

  describe('ramp table, 4 to 1', () => {
    it.each([
      [3, [4, 3, 1]],
      [4, [4, 3, 2, 1]],
      [5, [4, 3, 3, 2, 1]],
      [6, [4, 3, 3, 2, 2, 1]],
    ])('%i training weeks', (weeks, expected) => {
      expect(ramp(weeks, 4, 1)).toEqual(expected);
    });
  });

  it('handles 2 training weeks, 3 to 0', () => {
    expect(ramp(2, 3, 0)).toEqual([3, 0]);
  });

  it('handles 8 training weeks, 3 to 0', () => {
    expect(ramp(8, 3, 0)).toEqual([3, 3, 2, 2, 1, 1, 0, 0]);
  });

  it('returns the same value every week for a flat ramp', () => {
    expect(ramp(5, 3, 3)).toEqual([3, 3, 3, 3, 3]);
  });

  it('rounds the tie at 1.5 up to 2 (3 weeks, 3 to 0 gives 3, 2, 0)', () => {
    expect(ramp(3, 3, 0)).toEqual([3, 2, 0]);
  });

  it('returns 4 for the deload week of a 5+1 block (week 6)', () => {
    const meso = { trainingWeeks: 5, deloadWeeks: 1, startRir: 3, endRir: 0 };
    expect(getTargetRir(meso, 6)).toBe(4);
  });

  it('returns 4 for both deload weeks of a 4+2 block (weeks 5 and 6)', () => {
    const meso = { trainingWeeks: 4, deloadWeeks: 2, startRir: 3, endRir: 0 };
    expect(getTargetRir(meso, 4)).toBe(0);
    expect(getTargetRir(meso, 5)).toBe(4);
    expect(getTargetRir(meso, 6)).toBe(4);
  });

  it('guards against a single training week by returning startRir', () => {
    const meso = { trainingWeeks: 1, deloadWeeks: 0, startRir: 3, endRir: 0 };
    expect(getTargetRir(meso, 1)).toBe(3);
  });

  describe('invalid weeks', () => {
    const meso = { trainingWeeks: 5, deloadWeeks: 1, startRir: 3, endRir: 0 };

    it('throws a RangeError for week 0', () => {
      expect(() => getTargetRir(meso, 0)).toThrow(RangeError);
    });

    it('throws a RangeError for week total + 1', () => {
      expect(() => getTargetRir(meso, 7)).toThrow(RangeError);
    });

    it('throws a RangeError for a non-integer week (1.5)', () => {
      expect(() => getTargetRir(meso, 1.5)).toThrow(RangeError);
    });

    it('throws a RangeError for NaN', () => {
      expect(() => getTargetRir(meso, NaN)).toThrow(RangeError);
    });
  });
});

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-11-09', 6)).toBe('2026-11-15');
  });

  it('crosses a month end', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });

  it('crosses a year end', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('adds zero days', () => {
    expect(addDays('2026-11-09', 0)).toBe('2026-11-09');
  });

  it('subtracts days with a negative value, across a year start', () => {
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('zero-pads month and day', () => {
    expect(addDays('2026-01-01', 8)).toBe('2026-01-09');
  });

  it('is not shifted by the New Zealand DST change (2026-09-27)', () => {
    expect(addDays('2026-09-26', 1)).toBe('2026-09-27');
    expect(addDays('2026-09-27', 1)).toBe('2026-09-28');
    expect(addDays('2026-09-21', 14)).toBe('2026-10-05');
  });

  it('throws a RangeError for an invalid date', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError);
  });
});

describe('daysBetween', () => {
  it('is zero for the same day', () => {
    expect(daysBetween('2026-11-09', '2026-11-09')).toBe(0);
  });

  it('counts days within a month', () => {
    expect(daysBetween('2026-11-09', '2026-11-16')).toBe(7);
  });

  it('counts across a month end', () => {
    expect(daysBetween('2026-11-30', '2026-12-01')).toBe(1);
  });

  it('counts across a year end', () => {
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('counts across a leap day', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2028-01-01', '2029-01-01')).toBe(366);
  });

  it('is negative when the end is earlier', () => {
    expect(daysBetween('2026-11-16', '2026-11-09')).toBe(-7);
  });

  it('counts whole days across the New Zealand DST change', () => {
    expect(daysBetween('2026-09-26', '2026-09-28')).toBe(2);
    expect(daysBetween('2026-09-21', '2026-10-05')).toBe(14);
  });
});

describe('getNextStartDate', () => {
  // The week of Mon 2026-11-09 to Sun 2026-11-15.
  it('returns a Monday as itself', () => {
    expect(getNextStartDate('2026-11-09')).toBe('2026-11-09');
  });

  it.each([
    ['Tuesday', '2026-11-10'],
    ['Wednesday', '2026-11-11'],
    ['Thursday', '2026-11-12'],
    ['Friday', '2026-11-13'],
    ['Saturday', '2026-11-14'],
    ['Sunday', '2026-11-15'],
  ])('returns the next Monday from a %s', (_name, today) => {
    expect(getNextStartDate(today)).toBe('2026-11-16');
  });

  it('crosses a month end (Thursday 2026-12-31 gives 2027-01-04)', () => {
    expect(getNextStartDate('2026-12-31')).toBe('2027-01-04');
  });

  it('crosses a leap day (Monday 2028-02-28 is itself, Tuesday 2028-02-29 gives 2028-03-06)', () => {
    expect(getNextStartDate('2028-02-28')).toBe('2028-02-28');
    expect(getNextStartDate('2028-02-29')).toBe('2028-03-06');
  });

  it('crosses the New Zealand DST change (Sunday 2026-09-27 gives 2026-09-28)', () => {
    expect(getNextStartDate('2026-09-27')).toBe('2026-09-28');
  });
});

describe('getLastDay', () => {
  it('ends a 6-week block starting Monday 2026-11-30 on Sunday 2027-01-10', () => {
    expect(getLastDay('2026-11-30', 6)).toBe('2027-01-10');
  });

  it('ends a 1-week block on the Sunday after the start', () => {
    expect(getLastDay('2026-11-09', 1)).toBe('2026-11-15');
  });
});

describe('getMesocycleStatus', () => {
  // 5+1 block, Mon 2026-11-09 to Sun 2026-12-20, ramp 3 to 0 (3, 2, 2, 1, 0, then deload).
  const meso = block();

  it('is upcoming the day before the start, with 1 day to go', () => {
    expect(getMesocycleStatus(meso, '2026-11-08')).toEqual({
      phase: 'upcoming',
      startsOn: '2026-11-09',
      daysUntilStart: 1,
    });
  });

  it('is upcoming a week before the start, with 7 days to go', () => {
    expect(getMesocycleStatus(meso, '2026-11-02')).toEqual({
      phase: 'upcoming',
      startsOn: '2026-11-09',
      daysUntilStart: 7,
    });
  });

  it('is training week 1 on the first day', () => {
    expect(getMesocycleStatus(meso, '2026-11-09')).toEqual({
      phase: 'training',
      week: 1,
      totalWeeks: 6,
      targetRir: 3,
    });
  });

  it('is still week 1 on the Sunday that ends it', () => {
    expect(getMesocycleStatus(meso, '2026-11-15')).toMatchObject({ phase: 'training', week: 1 });
  });

  it('moves to week 2 on the Monday after (weeks run Monday to Sunday)', () => {
    expect(getMesocycleStatus(meso, '2026-11-16')).toMatchObject({
      phase: 'training',
      week: 2,
      targetRir: 2,
    });
  });

  it('is week 5 on the last training day (Sunday 2026-12-13)', () => {
    expect(getMesocycleStatus(meso, '2026-12-13')).toEqual({
      phase: 'training',
      week: 5,
      totalWeeks: 6,
      targetRir: 0,
    });
  });

  it('is the deload on its first day (Monday 2026-12-14, week 6, target 4)', () => {
    expect(getMesocycleStatus(meso, '2026-12-14')).toEqual({
      phase: 'deload',
      week: 6,
      totalWeeks: 6,
      targetRir: 4,
    });
  });

  it('is still deload on the last day of the block (2026-12-20)', () => {
    expect(getMesocycleStatus(meso, '2026-12-20')).toMatchObject({ phase: 'deload', week: 6 });
  });

  it('is completed the day after the last day, 1 day since', () => {
    expect(getMesocycleStatus(meso, '2026-12-21')).toEqual({
      phase: 'completed',
      endedEarly: false,
      lastDay: '2026-12-20',
      daysSinceLastDay: 1,
    });
  });

  it('is completed a week after the last day, 7 days since', () => {
    expect(getMesocycleStatus(meso, '2026-12-27')).toEqual({
      phase: 'completed',
      endedEarly: false,
      lastDay: '2026-12-20',
      daysSinceLastDay: 7,
    });
  });

  it('is completed with endedEarly when endedAt is set mid-block, even though today is inside the schedule', () => {
    const ended = block({ endedAt: '2026-11-18' });
    expect(getMesocycleStatus(ended, '2026-11-19')).toEqual({
      phase: 'completed',
      endedEarly: true,
      lastDay: '2026-12-20',
      daysSinceLastDay: -31,
    });
  });

  it('is completed with endedEarly regardless of dates, even before the start', () => {
    const ended = block({ endedAt: '2026-11-09' });
    expect(getMesocycleStatus(ended, '2026-11-01')).toMatchObject({
      phase: 'completed',
      endedEarly: true,
    });
  });

  it('keeps endedEarly true after the scheduled last day too', () => {
    const ended = block({ endedAt: '2026-11-18' });
    expect(getMesocycleStatus(ended, '2026-12-25')).toMatchObject({
      phase: 'completed',
      endedEarly: true,
      daysSinceLastDay: 5,
    });
  });

  it('never reports deload for a 4+0 block', () => {
    const noDeload = block({ trainingWeeks: 4, deloadWeeks: 0 });
    // Last day is 2026-12-06 (Sunday); check every day of the block.
    for (let offset = 0; offset < 28; offset++) {
      const status = getMesocycleStatus(noDeload, addDays('2026-11-09', offset));
      expect(status.phase).toBe('training');
    }
    expect(getMesocycleStatus(noDeload, '2026-12-06')).toMatchObject({
      phase: 'training',
      week: 4,
      totalWeeks: 4,
      targetRir: 0,
    });
    expect(getMesocycleStatus(noDeload, '2026-12-07')).toMatchObject({ phase: 'completed' });
  });

  it('matches getTargetRir, week and totalWeeks on a mid-block day', () => {
    const status = getMesocycleStatus(meso, '2026-11-25'); // Wednesday of week 3
    expect(status).toMatchObject({ phase: 'training', week: 3, totalWeeks: 6 });
    if (status.phase !== 'training') throw new Error('expected training');
    expect(status.targetRir).toBe(getTargetRir(meso, status.week));
    expect(status.targetRir).toBe(2);
  });

  it('numbers every week correctly across the whole 5+1 block', () => {
    const expected = [
      ['2026-11-09', 1],
      ['2026-11-16', 2],
      ['2026-11-23', 3],
      ['2026-11-30', 4],
      ['2026-12-07', 5],
      ['2026-12-14', 6],
    ] as const;
    for (const [monday, week] of expected) {
      for (let offset = 0; offset < 7; offset++) {
        const status = getMesocycleStatus(meso, addDays(monday, offset));
        expect(status).toMatchObject({ week });
      }
    }
  });

  it('has correct week numbers on both sides of the New Zealand DST change (4+1 from Monday 2026-09-21)', () => {
    const dst = block({ startDate: '2026-09-21', trainingWeeks: 4, deloadWeeks: 1 });
    // DST began Sunday 2026-09-27, the last day of week 1.
    expect(getMesocycleStatus(dst, '2026-09-26')).toMatchObject({ phase: 'training', week: 1 });
    expect(getMesocycleStatus(dst, '2026-09-27')).toMatchObject({ phase: 'training', week: 1 });
    expect(getMesocycleStatus(dst, '2026-09-28')).toMatchObject({ phase: 'training', week: 2 });
    expect(getMesocycleStatus(dst, '2026-10-04')).toMatchObject({ phase: 'training', week: 2 });
    expect(getMesocycleStatus(dst, '2026-10-05')).toMatchObject({ phase: 'training', week: 3 });
    expect(getMesocycleStatus(dst, '2026-10-19')).toMatchObject({ phase: 'deload', week: 5 });
    expect(getMesocycleStatus(dst, '2026-10-25')).toMatchObject({ phase: 'deload', week: 5 });
    expect(getMesocycleStatus(dst, '2026-10-26')).toMatchObject({
      phase: 'completed',
      lastDay: '2026-10-25',
      daysSinceLastDay: 1,
    });
  });

  it('has correct weeks across a year end (4+1 from Monday 2026-12-14)', () => {
    const yearEnd = block({ startDate: '2026-12-14', trainingWeeks: 4, deloadWeeks: 1 });
    // Weeks: 12-14, 12-21, 12-28 (holds 2027-01-01), 01-04, 01-11 (deload).
    expect(getMesocycleStatus(yearEnd, '2026-12-31')).toMatchObject({ phase: 'training', week: 3 });
    expect(getMesocycleStatus(yearEnd, '2027-01-01')).toEqual({
      phase: 'training',
      week: 3,
      totalWeeks: 5,
      targetRir: 1,
    });
    expect(getMesocycleStatus(yearEnd, '2027-01-04')).toMatchObject({ phase: 'training', week: 4 });
    expect(getMesocycleStatus(yearEnd, '2027-01-11')).toMatchObject({ phase: 'deload', week: 5 });
    expect(getMesocycleStatus(yearEnd, '2027-01-17')).toMatchObject({ phase: 'deload', week: 5 });
    expect(getMesocycleStatus(yearEnd, '2027-01-18')).toEqual({
      phase: 'completed',
      endedEarly: false,
      lastDay: '2027-01-17',
      daysSinceLastDay: 1,
    });
  });
});

describe('getMesocycleInputError', () => {
  const today = '2026-11-09'; // a Monday
  const valid = {
    startDate: '2026-11-09',
    trainingWeeks: 5,
    deloadWeeks: 1,
    startRir: 3,
    endRir: 0,
  };

  it('accepts a valid body that starts today (a Monday)', () => {
    expect(getMesocycleInputError(valid, today)).toBeNull();
  });

  it('accepts a valid body that starts on a later Monday', () => {
    expect(getMesocycleInputError({ ...valid, startDate: '2026-11-16' }, today)).toBeNull();
  });

  it('accepts the limits (2 and 8 training weeks, 0 and 2 deload weeks, RIR 0 to 4, flat ramp)', () => {
    expect(getMesocycleInputError({ ...valid, trainingWeeks: 2, deloadWeeks: 0 }, today)).toBeNull();
    expect(getMesocycleInputError({ ...valid, trainingWeeks: 8, deloadWeeks: 2 }, today)).toBeNull();
    expect(getMesocycleInputError({ ...valid, startRir: 4, endRir: 4 }, today)).toBeNull();
    expect(getMesocycleInputError({ ...valid, startRir: 0, endRir: 0 }, today)).toBeNull();
  });

  describe('body', () => {
    it.each([
      ['null', null],
      ['an array', [valid]],
      ['a string', 'hello'],
      ['a number', 5],
      ['undefined', undefined],
    ])('rejects %s', (_name, input) => {
      expect(getMesocycleInputError(input, today)).toBe('request body must be an object');
    });
  });

  describe('startDate', () => {
    const message = 'startDate must be a valid date (YYYY-MM-DD)';

    it('rejects a missing startDate', () => {
      const { startDate: _omit, ...rest } = valid;
      expect(getMesocycleInputError(rest, today)).toBe(message);
    });

    it('rejects a non-string startDate', () => {
      expect(getMesocycleInputError({ ...valid, startDate: 20261109 }, today)).toBe(message);
    });

    it.each(['11/09/2026', '2026-1-9', '2026-11-09T00:00:00Z', ' 2026-11-09', 'tomorrow', ''])(
      'rejects the malformed date %j',
      (startDate) => {
        expect(getMesocycleInputError({ ...valid, startDate }, today)).toBe(message);
      },
    );

    it('rejects an impossible calendar date (2026-02-30)', () => {
      expect(getMesocycleInputError({ ...valid, startDate: '2026-02-30' }, today)).toBe(message);
    });

    it('rejects month 13 and a leap day in a non-leap year', () => {
      expect(getMesocycleInputError({ ...valid, startDate: '2026-13-01' }, today)).toBe(message);
      expect(getMesocycleInputError({ ...valid, startDate: '2027-02-29' }, today)).toBe(message);
    });
  });

  it('rejects a start date that is not a Monday', () => {
    expect(getMesocycleInputError({ ...valid, startDate: '2026-11-10' }, today)).toBe(
      'startDate must be a Monday',
    );
  });

  it('rejects a Monday in the past', () => {
    expect(getMesocycleInputError({ ...valid, startDate: '2026-11-02' }, today)).toBe(
      'startDate must not be in the past',
    );
  });

  describe('trainingWeeks', () => {
    const message = 'trainingWeeks must be a whole number from 2 to 8';

    it.each([
      ['1', 1],
      ['9', 9],
      ['5.5', 5.5],
      ['the string "5"', '5'],
      ['NaN', NaN],
      ['null', null],
      ['missing', undefined],
    ])('rejects %s', (_name, trainingWeeks) => {
      expect(getMesocycleInputError({ ...valid, trainingWeeks }, today)).toBe(message);
    });
  });

  describe('deloadWeeks', () => {
    const message = 'deloadWeeks must be a whole number from 0 to 2';

    it.each([
      ['-1', -1],
      ['3', 3],
      ['1.5', 1.5],
      ['the string "1"', '1'],
      ['NaN', NaN],
      ['null', null],
    ])('rejects %s', (_name, deloadWeeks) => {
      expect(getMesocycleInputError({ ...valid, deloadWeeks }, today)).toBe(message);
    });
  });

  describe('startRir', () => {
    const message = 'startRir must be a whole number from 0 to 4';

    it.each([
      ['5', 5],
      ['-1', -1],
      ['2.5', 2.5],
      ['the string "3"', '3'],
      ['NaN', NaN],
      ['null', null],
    ])('rejects %s', (_name, startRir) => {
      expect(getMesocycleInputError({ ...valid, startRir }, today)).toBe(message);
    });
  });

  describe('endRir', () => {
    const message = 'endRir must be a whole number from 0 to 4';

    it.each([
      ['-1', -1],
      ['5', 5],
      ['0.5', 0.5],
      ['the string "0"', '0'],
      ['NaN', NaN],
      ['null', null],
    ])('rejects %s', (_name, endRir) => {
      expect(getMesocycleInputError({ ...valid, endRir }, today)).toBe(message);
    });
  });

  it('rejects startRir below endRir (1 and 2)', () => {
    expect(getMesocycleInputError({ ...valid, startRir: 1, endRir: 2 }, today)).toBe(
      'startRir must be greater than or equal to endRir',
    );
  });

  describe('the first error wins', () => {
    it('reports the body before anything else', () => {
      expect(getMesocycleInputError(null, today)).toBe('request body must be an object');
    });

    it('reports the date format before the Monday rule', () => {
      expect(
        getMesocycleInputError({ ...valid, startDate: '2026-02-30', trainingWeeks: 99 }, today),
      ).toBe('startDate must be a valid date (YYYY-MM-DD)');
    });

    it('reports the Monday rule before the past rule', () => {
      // Tuesday 2026-11-03 is both not a Monday and in the past.
      expect(getMesocycleInputError({ ...valid, startDate: '2026-11-03' }, today)).toBe(
        'startDate must be a Monday',
      );
    });

    it('reports the past rule before the week counts', () => {
      expect(
        getMesocycleInputError({ ...valid, startDate: '2026-11-02', trainingWeeks: 99 }, today),
      ).toBe('startDate must not be in the past');
    });

    it('reports trainingWeeks before deloadWeeks, startRir, endRir and the ramp order', () => {
      expect(
        getMesocycleInputError(
          { ...valid, trainingWeeks: 1, deloadWeeks: 9, startRir: 9, endRir: 9 },
          today,
        ),
      ).toBe('trainingWeeks must be a whole number from 2 to 8');
    });

    it('reports deloadWeeks before startRir and endRir', () => {
      expect(
        getMesocycleInputError({ ...valid, deloadWeeks: 3, startRir: 9, endRir: 9 }, today),
      ).toBe('deloadWeeks must be a whole number from 0 to 2');
    });

    it('reports startRir before endRir', () => {
      expect(getMesocycleInputError({ ...valid, startRir: 5, endRir: -1 }, today)).toBe(
        'startRir must be a whole number from 0 to 4',
      );
    });

    it('reports endRir before the ramp order', () => {
      expect(getMesocycleInputError({ ...valid, startRir: 1, endRir: 9 }, today)).toBe(
        'endRir must be a whole number from 0 to 4',
      );
    });
  });
});
