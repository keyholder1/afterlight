// Printed Polaroid date/time stamp — see docs/05-design-system.md's mockup
// convention: "08.03 · 7:12A".

export function formatPrintedStamp(isoString: string): string {
  const d = new Date(isoString);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'P' : 'A';
  hours = hours % 12 || 12;
  return `${mm}.${dd} · ${hours}:${minutes}${ampm}`;
}

export function dayKey(isoString: string): string {
  return isoString.slice(0, 10); // 'YYYY-MM-DD'
}
