/** Calendar-day helpers that avoid UTC shifting dates around midnight. */
export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function isLocalDateKey(key: unknown): key is string {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = parseLocalDateKey(key);
  return !Number.isNaN(date.getTime()) && localDateKey(date) === key;
}

export function shiftLocalDateKey(key: string, days: number): string {
  const date = parseLocalDateKey(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function calendarDayDifference(newer: string, older: string): number {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.round((parseLocalDateKey(newer).getTime() - parseLocalDateKey(older).getTime()) / dayMs);
}
