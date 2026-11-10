import { DEFAULT_SETTINGS, clampVehicleCount, type SimSettings } from "@/simulation/settings";
import { VEHICLE_ORDER } from "@/vehicles/types";

const KEY = "chennai-traffic-sim:settings:v1";

export function loadSettings(): SimSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<SimSettings>;
    const mix = { ...DEFAULT_SETTINGS.mix };
    for (const t of VEHICLE_ORDER) {
      const v = s.mix?.[t];
      if (typeof v === "number" && v >= 0) mix[t] = v;
    }
    return { vehicleCount: clampVehicleCount(s.vehicleCount ?? DEFAULT_SETTINGS.vehicleCount), mix };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: SimSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: settings just won't persist */
  }
}
