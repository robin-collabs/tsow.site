import type { VehicleParams } from "@/vehicles/types";

/**
 * Intelligent Driver Model. gap = free distance to the obstacle ahead (Infinity = free road),
 * dv = own speed minus obstacle speed. Returns acceleration in m/s².
 */
export function idmAccel(
  p: Pick<VehicleParams, "accel" | "comfortDecel" | "maxDecel" | "timeHeadway" | "minGap">,
  v: number,
  v0: number,
  gap: number,
  dv: number,
): number {
  const free = 1 - Math.pow(v / Math.max(v0, 0.1), 4);
  if (!Number.isFinite(gap)) return Math.max(-p.maxDecel, Math.min(p.accel, p.accel * free));
  const sStar =
    p.minGap + Math.max(0, v * p.timeHeadway + (v * dv) / (2 * Math.sqrt(p.accel * p.comfortDecel)));
  const g = Math.max(gap, 0.1);
  return Math.max(-p.maxDecel, p.accel * (free - (sStar / g) ** 2));
}
