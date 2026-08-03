export type MonthCell = { day: string; dateNum: number; inMonth: boolean };

// Full weeks (Sun-Sat), including the muted leading/trailing days from
// neighboring months, matching docs/02-ux-flows-and-wireframes.md § 4.
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month - 1, 1);
  const startWeekday = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells: MonthCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const dateNum = daysInPrevMonth - i;
    const d = new Date(year, month - 2, dateNum);
    cells.push({ day: toDayKey(d), dateNum, inMonth: false });
  }
  for (let dateNum = 1; dateNum <= daysInMonth; dateNum++) {
    const d = new Date(year, month - 1, dateNum);
    cells.push({ day: toDayKey(d), dateNum, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const dateNum = cells.length - (startWeekday + daysInMonth) + 1;
    const d = new Date(year, month, dateNum);
    cells.push({ day: toDayKey(d), dateNum, inMonth: false });
  }

  return cells;
}

function toDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
