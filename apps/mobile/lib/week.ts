export type WeekDayState = 'done' | 'today' | 'future' | 'missed';

export type WeekDay = {
  label: string;
  state: WeekDayState;
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Compare calendar days in local time (not milliseconds, which break across DST).
function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Monday 00:00 local time of the week that contains `date`.
function startOfLocalWeek(date: Date) {
  const daysSinceMonday = (date.getDay() + 6) % 7; // getDay(): Sun = 0 ... Sat = 6
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceMonday);
}

// The seven days (Mon-Sun) of the week containing `today`, each with a state.
// A day with a workout is `done` even if it is today.
export function getWeekStrip(performedOnDates: Date[], today: Date): WeekDay[] {
  const monday = startOfLocalWeek(today);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return DAY_LABELS.map((label, index) => {
    // new Date(y, m, d + n) handles month ends and DST shifts for us.
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const hasWorkout = performedOnDates.some((date) => isSameLocalDay(date, day));

    let state: WeekDayState;
    if (hasWorkout) {
      state = 'done';
    } else if (isSameLocalDay(day, today)) {
      state = 'today';
    } else if (day < startOfToday) {
      state = 'missed';
    } else {
      state = 'future';
    }

    return { label, state };
  });
}

// Number of workouts (not days) that fall in the Mon-Sun week containing `today`.
export function countSessionsThisWeek(performedOnDates: Date[], today: Date): number {
  const monday = startOfLocalWeek(today);
  const nextMonday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7);

  return performedOnDates.filter((date) => date >= monday && date < nextMonday).length;
}
