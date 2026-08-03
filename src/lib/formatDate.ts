const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatShortDate(dayKeyOrIso: string): string {
  const d = new Date(dayKeyOrIso.length === 10 ? `${dayKeyOrIso}T00:00:00` : dayKeyOrIso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
