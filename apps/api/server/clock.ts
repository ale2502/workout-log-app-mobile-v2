// Today's date as `YYYY-MM-DD` in the server's local time zone.
// Assumes the server's local date is the user's (true until the API is deployed).
// Never use toISOString() here: it returns the UTC date, which in New Zealand is
// still yesterday in the morning.
export function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
