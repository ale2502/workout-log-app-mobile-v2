// "YYYY-MM-DD HH:MM:SS" is a UTC timestamp from SQLite, so it becomes local time.
// A date-only "YYYY-MM-DD" has no time zone, so it means that calendar day locally.
export function parseApiDate(value: string): Date {
  if (value.includes(' ')) {
    return new Date(value.replace(' ', 'T') + 'Z');
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
