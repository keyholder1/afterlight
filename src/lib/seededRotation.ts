// Deterministic per-card rotation — see docs/05-design-system.md § Polaroid
// card: "random per card, seeded by memory id (stable across re-renders),
// range -4deg to +4deg."

export function seededRotation(id: string, range = 4): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000; // 0..1
  return normalized * range * 2 - range; // -range..range
}
