/** 0 = free flow (>70% of limit), 1 = slow (30–70%), 2 = jammed (<30%). Empty edges are free. */
export function trafficLevel(meanSpeed: number | null, limit: number): 0 | 1 | 2 {
  if (meanSpeed === null || limit <= 0) return 0;
  const r = meanSpeed / limit;
  return r > 0.7 ? 0 : r >= 0.3 ? 1 : 2;
}
