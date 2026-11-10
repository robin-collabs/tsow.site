import type { VehicleParams, VehicleType } from "./types";

export type DriveState =
  | "cruising"
  | "following"
  | "signal"
  | "yielding"
  | "turning"
  | "overtaking"
  | "filtering"
  | "pickup"
  | "recovering";

export const DRIVE_STATE_LABEL: Record<DriveState, string> = {
  cruising: "Cruising",
  following: "Following traffic",
  signal: "Stopping for signal",
  yielding: "Yielding at junction",
  turning: "Slowing for turn",
  overtaking: "Changing lane / overtaking",
  filtering: "Filtering through gap",
  pickup: "Roadside stop",
  recovering: "Re-routing",
};

export interface Vehicle {
  id: number;
  type: VehicleType;
  p: VehicleParams;
  color: string;
  side: string;
  /** directed edge ids */
  route: number[];
  ri: number;
  /** distance along current edge, m */
  s: number;
  v: number;
  a: number;
  lane: number;
  /** current lateral offset, m, positive = left of travel direction */
  lat: number;
  bias: number;
  baseBias: number;
  /** personal speed multiplier (driving style) */
  aggr: number;
  /** smoothed render pose */
  x: number;
  y: number;
  heading: number;
  state: DriveState;
  waitT: number;
  stuckT: number;
  laneCd: number;
  pickupT: number;
  nextPickup: number;
  rerouted: boolean;
  dest: number;
  trips: number;
  dead: boolean;
}
