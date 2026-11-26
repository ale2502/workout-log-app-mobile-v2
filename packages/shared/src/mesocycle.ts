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
