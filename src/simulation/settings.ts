import { VEHICLE_ORDER, type VehicleType } from "@/vehicles/types";

export const MIN_VEHICLES = 30;
export const MAX_VEHICLES = 100;

export interface SimSettings {
  vehicleCount: number;
  /** relative weights per type */
  mix: Record<VehicleType, number>;
}

export const DEFAULT_SETTINGS: SimSettings = {
  vehicleCount: 60,
  mix: { car: 35, bike: 35, auto: 20, truck: 10 },
};

export const DENSITY_PRESETS = [
  { label: "Light", count: 30 },
  { label: "Moderate", count: 60 },
  { label: "Heavy", count: 100 },
] as const;

export function clampVehicleCount(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.vehicleCount;
  return Math.min(MAX_VEHICLES, Math.max(MIN_VEHICLES, Math.round(n)));
}

/** Picks a vehicle type by weight; falls back to cars when every weight is zero. */
export function pickWeighted(mix: Record<VehicleType, number>, r: number): VehicleType {
  const total = VEHICLE_ORDER.reduce((s, t) => s + Math.max(0, mix[t]), 0);
  if (total <= 0) return "car";
  let x = r * total;
  for (const t of VEHICLE_ORDER) {
    x -= Math.max(0, mix[t]);
    if (x < 0) return t;
  }
  return "car";
}
