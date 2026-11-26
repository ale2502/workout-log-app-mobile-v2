// All dates are local calendar dates as `YYYY-MM-DD` strings (no time, no time zone).

// Request body for starting a mesocycle (POST /mesocycles).
export interface NewMesocycle {
  startDate: string; // YYYY-MM-DD, always a Monday
  trainingWeeks: number;
  deloadWeeks: number;
  startRir: number; // RIR 0–4, where 4 means "4+"
  endRir: number; // RIR 0–4, where 4 means "4+"
}

// A stored mesocycle, as the API returns it.
export interface Mesocycle extends NewMesocycle {
  id: number;
  endedAt: string | null; // YYYY-MM-DD, set only when the block was ended early
  createdAt: string;
}

export const MESOCYCLE_LIMITS = {
  trainingWeeks: { min: 2, max: 8, default: 4 },
  deloadWeeks: { min: 0, max: 2, default: 1 },
  // Same scale as the RIR slider: 4 is shown as "4+".
  rir: { min: 0, max: 4 },
  defaultStartRir: 3,
  defaultEndRir: 0,
} as const;

// The four values the start form lets the user change.
export type MesocycleSettings = Pick<
  NewMesocycle,
  'trainingWeeks' | 'deloadWeeks' | 'startRir' | 'endRir'
>;

export const DEFAULT_MESOCYCLE_SETTINGS: MesocycleSettings = {
  trainingWeeks: MESOCYCLE_LIMITS.trainingWeeks.default,
  deloadWeeks: MESOCYCLE_LIMITS.deloadWeeks.default,
  startRir: MESOCYCLE_LIMITS.defaultStartRir,
  endRir: MESOCYCLE_LIMITS.defaultEndRir,
};

function getSettingLimits(field: keyof MesocycleSettings): { min: number; max: number } {
  switch (field) {
    case 'trainingWeeks':
      return MESOCYCLE_LIMITS.trainingWeeks;
    case 'deloadWeeks':
      return MESOCYCLE_LIMITS.deloadWeeks;
    case 'startRir':
    case 'endRir':
      return MESOCYCLE_LIMITS.rir;
  }
}

// Steps one setting up or down by one, clamped to its limits, keeping startRir >= endRir:
// lowering startRir below endRir drags endRir down, raising endRir above startRir drags
// startRir up. Never mutates `settings`; returns the same object when nothing changes,
// so `stepMesocycleSetting(s, f, d) === s` means "this button is at its limit".
export function stepMesocycleSetting(
  settings: MesocycleSettings,
  field: keyof MesocycleSettings,
  delta: 1 | -1,
): MesocycleSettings {
  const { min, max } = getSettingLimits(field);
  const value = Math.min(max, Math.max(min, settings[field] + delta));
  if (value === settings[field]) {
    return settings;
  }

  const next = { ...settings, [field]: value };
  if (field === 'startRir' && next.endRir > value) {
    next.endRir = value;
  }
  if (field === 'endRir' && next.startRir < value) {
    next.startRir = value;
  }
  return next;
}

// ---------------------------------------------------------------------------
// Pure date and ramp logic. Nothing here reads the clock: callers pass `today`.
// All date arithmetic goes through UTC so DST and the machine's time zone can
// never shift a day.
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Parses `YYYY-MM-DD` into a UTC midnight timestamp, or null if it is not a real calendar date.
function parseDateMs(date: string): number | null {
  const match = DATE_PATTERN.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return ms;
}

function parseDateOrThrow(date: string): number {
  const ms = parseDateMs(date);
  if (ms === null) {
    throw new RangeError(`Invalid date: ${date}`);
  }
  return ms;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1, 2)}-${pad(d.getUTCDate(), 2)}`;
}

// The LOCAL calendar date of `date` as `YYYY-MM-DD`.
// Never use toISOString() here: it returns the UTC date, which in New Zealand is
// still yesterday in the morning.
export function toLocalDateString(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

// 0 = Sunday, 1 = Monday, ... 6 = Saturday.
function dayOfWeek(date: string): number {
  return new Date(parseDateOrThrow(date)).getUTCDay();
}

export function addDays(date: string, days: number): string {
  return formatDate(parseDateOrThrow(date) + days * MS_PER_DAY);
}

// Whole days from `from` to `to` (negative when `to` is earlier).
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDateOrThrow(to) - parseDateOrThrow(from)) / MS_PER_DAY);
}

// Today if it is a Monday, otherwise the next Monday.
export function getNextStartDate(today: string): string {
  const daysUntilMonday = (8 - dayOfWeek(today)) % 7;
  return addDays(today, daysUntilMonday);
}

// A mesocycle without its id and createdAt: everything the schedule logic needs.
export type MesocycleSchedule = Pick<
  Mesocycle,
  'startDate' | 'trainingWeeks' | 'deloadWeeks' | 'startRir' | 'endRir' | 'endedAt'
>;

// The last scheduled day of the block (a Sunday).
export function getLastDay(startDate: string, totalWeeks: number): string {
  return addDays(startDate, totalWeeks * 7 - 1);
}

// `week` is the 1-based week of the whole block: training weeks first, then deload weeks.
// Deload weeks return 4, which the UI shows as "4+".
export function getTargetRir(
  meso: Pick<Mesocycle, 'trainingWeeks' | 'deloadWeeks' | 'startRir' | 'endRir'>,
  week: number,
): number {
  const { trainingWeeks, deloadWeeks, startRir, endRir } = meso;
  const totalWeeks = trainingWeeks + deloadWeeks;
  if (!Number.isInteger(week) || week < 1 || week > totalWeeks) {
    throw new RangeError(`week must be a whole number from 1 to ${totalWeeks}, got ${week}`);
  }
  if (week > trainingWeeks) {
    return MESOCYCLE_LIMITS.rir.max;
  }
  if (trainingWeeks === 1) {
    return startRir;
  }
  return Math.round(startRir - ((startRir - endRir) * (week - 1)) / (trainingWeeks - 1));
}

export type MesocycleStatus =
  | { phase: 'upcoming'; startsOn: string; daysUntilStart: number }
  | { phase: 'training'; week: number; totalWeeks: number; targetRir: number }
  | { phase: 'deload'; week: number; totalWeeks: number; targetRir: 4 }
  | { phase: 'completed'; endedEarly: boolean; lastDay: string; daysSinceLastDay: number };

export function getMesocycleStatus(meso: MesocycleSchedule, today: string): MesocycleStatus {
  const totalWeeks = meso.trainingWeeks + meso.deloadWeeks;
  const lastDay = getLastDay(meso.startDate, totalWeeks);

  if (meso.endedAt !== null) {
    return {
      phase: 'completed',
      endedEarly: true,
      lastDay,
      daysSinceLastDay: daysBetween(lastDay, today),
    };
  }
  if (today < meso.startDate) {
    return {
      phase: 'upcoming',
      startsOn: meso.startDate,
      daysUntilStart: daysBetween(today, meso.startDate),
    };
  }
  if (today > lastDay) {
    return {
      phase: 'completed',
      endedEarly: false,
      lastDay,
      daysSinceLastDay: daysBetween(lastDay, today),
    };
  }

  const week = Math.floor(daysBetween(meso.startDate, today) / 7) + 1;
  if (week <= meso.trainingWeeks) {
    return { phase: 'training', week, totalWeeks, targetRir: getTargetRir(meso, week) };
  }
  return { phase: 'deload', week, totalWeeks, targetRir: 4 };
}

// How long the "Block finished" card shows on Home after the block's last day.
export const FINISHED_CARD_DAYS = 7;

export type MesocycleCardKind = 'none' | 'upcoming' | 'active' | 'finished';

// Which Home card to show for a status (null = no block at all).
// A block that was ended early, or finished more than FINISHED_CARD_DAYS ago, shows the "none" card.
export function getMesocycleCardKind(status: MesocycleStatus | null): MesocycleCardKind {
  if (status === null) return 'none';
  switch (status.phase) {
    case 'upcoming':
      return 'upcoming';
    case 'training':
    case 'deload':
      return 'active';
    case 'completed':
      return !status.endedEarly && status.daysSinceLastDay <= FINISHED_CARD_DAYS
        ? 'finished'
        : 'none';
  }
}

function isWholeNumberInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

// Validates an untrusted request body. Returns the first error message, or null if it is valid.
export function getMesocycleInputError(input: unknown, today: string): string | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return 'request body must be an object';
  }
  const body = input as Record<string, unknown>;
  const { startDate, trainingWeeks, deloadWeeks, startRir, endRir } = body;

  if (typeof startDate !== 'string' || parseDateMs(startDate) === null) {
    return 'startDate must be a valid date (YYYY-MM-DD)';
  }
  if (dayOfWeek(startDate) !== 1) {
    return 'startDate must be a Monday';
  }
  if (startDate < today) {
    return 'startDate must not be in the past';
  }

  const { trainingWeeks: tw, deloadWeeks: dw, rir } = MESOCYCLE_LIMITS;
  if (!isWholeNumberInRange(trainingWeeks, tw.min, tw.max)) {
    return `trainingWeeks must be a whole number from ${tw.min} to ${tw.max}`;
  }
  if (!isWholeNumberInRange(deloadWeeks, dw.min, dw.max)) {
    return `deloadWeeks must be a whole number from ${dw.min} to ${dw.max}`;
  }
  if (!isWholeNumberInRange(startRir, rir.min, rir.max)) {
    return `startRir must be a whole number from ${rir.min} to ${rir.max}`;
  }
  if (!isWholeNumberInRange(endRir, rir.min, rir.max)) {
    return `endRir must be a whole number from ${rir.min} to ${rir.max}`;
  }
  if ((startRir as number) < (endRir as number)) {
    return 'startRir must be greater than or equal to endRir';
  }
  return null;
}
