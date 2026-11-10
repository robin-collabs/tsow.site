export type VehicleType = "car" | "bike" | "auto" | "truck";

export const VEHICLE_ORDER: VehicleType[] = ["car", "bike", "auto", "truck"];

/** Every behaviour difference between vehicle types comes from these numbers. */
export interface VehicleParams {
  type: VehicleType;
  label: string;
  plural: string;
  /** metres */
  length: number;
  width: number;
  height: number;
  /** m/s */
  maxSpeed: number;
  /** m/s² */
  accel: number;
  comfortDecel: number;
  maxDecel: number;
  /** seconds of headway kept to the vehicle ahead */
  timeHeadway: number;
  /** metres kept when stopped */
  minGap: number;
  /** m/s of sideways movement */
  latSpeed: number;
  /** can squeeze past within a lane (lane filtering) */
  filters: boolean;
  /** m/s through a sharp turn; lower means a wider, slower turn */
  turnSpeed: number;
  /** share of the speed limit this type aims for */
  speedFactor: number;
  /** extra free space (m) needed ahead before overtaking */
  overtakeGain: number;
  /** roadside stops per minute (auto rickshaw pickups) */
  stopRate: number;
  colors: string[];
  roofColor?: string;
}

export const VEHICLE_TYPES: Record<VehicleType, VehicleParams> = {
  car: {
    type: "car",
    label: "Car",
    plural: "Cars",
    length: 4.4,
    width: 1.8,
    height: 1.5,
    maxSpeed: 16.7,
    accel: 2.0,
    comfortDecel: 3.0,
    maxDecel: 8,
    timeHeadway: 1.4,
    minGap: 2.0,
    latSpeed: 1.0,
    filters: false,
    turnSpeed: 6,
    speedFactor: 1.0,
    overtakeGain: 8,
    stopRate: 0,
    colors: ["#e8e8e8", "#c0392b", "#2c3e50", "#7f8c8d", "#2e86de", "#f5f0e1", "#1e1e1e"],
  },
  bike: {
    type: "bike",
    label: "Bike / scooter",
    plural: "Bikes",
    length: 2.0,
    width: 0.8,
    height: 1.3,
    maxSpeed: 16.7,
    accel: 3.2,
    comfortDecel: 4.0,
    maxDecel: 7,
    timeHeadway: 0.9,
    minGap: 1.0,
    latSpeed: 1.8,
    filters: true,
    turnSpeed: 7,
    speedFactor: 1.05,
    overtakeGain: 3,
    stopRate: 0,
    colors: ["#d35400", "#1abc9c", "#8e44ad", "#34495e", "#e74c3c", "#16a085"],
  },
  auto: {
    type: "auto",
    label: "Auto rickshaw",
    plural: "Autos",
    length: 2.9,
    width: 1.4,
    height: 1.7,
    maxSpeed: 12.5,
    accel: 1.3,
    comfortDecel: 2.8,
    maxDecel: 6,
    timeHeadway: 1.0,
    minGap: 1.2,
    latSpeed: 1.2,
    filters: true,
    turnSpeed: 5,
    speedFactor: 0.9,
    overtakeGain: 4,
    stopRate: 1.2,
    colors: ["#f4c20d"],
    roofColor: "#1b1b1b",
  },
  truck: {
    type: "truck",
    label: "Truck",
    plural: "Trucks",
    length: 8.5,
    width: 2.5,
    height: 3.2,
    maxSpeed: 13.9,
    accel: 0.8,
    comfortDecel: 2.0,
    maxDecel: 5,
    timeHeadway: 2.0,
    minGap: 3.5,
    latSpeed: 0.6,
    filters: false,
    turnSpeed: 3.5,
    speedFactor: 0.85,
    overtakeGain: 20,
    stopRate: 0,
    colors: ["#e67e22", "#2471a3", "#27ae60", "#a93226"],
    roofColor: "#d5d8dc",
  },
};

export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}
