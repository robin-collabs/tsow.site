import { project, type RoadDataset } from "./dataset";

export type ZoneId = "overview" | "central" | "south" | "injambakkam";

export interface Zone {
  id: ZoneId;
  name: string;
  areas: string;
  /** [south, west, north, east] in degrees */
  bbox: [number, number, number, number];
}

export const ZONES: Zone[] = [
  {
    id: "overview",
    name: "City overview",
    areas: "Chennai Central → Injambakkam",
    bbox: [12.9, 80.2, 13.09, 80.295],
  },
  {
    id: "central",
    name: "Central Chennai",
    areas: "Chennai Central · Egmore · Mylapore · T. Nagar",
    bbox: [13.03, 80.215, 13.09, 80.295],
  },
  {
    id: "south",
    name: "Southern Chennai",
    areas: "Adyar · Besant Nagar · Thiruvanmiyur · OMR",
    bbox: [12.97, 80.215, 13.035, 80.29],
  },
  {
    id: "injambakkam",
    name: "Injambakkam & ECR",
    areas: "Palavakkam · Neelankarai · Injambakkam · OMR",
    bbox: [12.9, 80.215, 12.975, 80.29],
  },
];

export interface BoundsM {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function zoneBoundsM(ds: RoadDataset, zone: Zone): BoundsM {
  const [s, w, n, e] = zone.bbox;
  const a = project(ds, n, w);
  const b = project(ds, s, e);
  return { minX: a.x, minY: a.y, maxX: b.x, maxY: b.y };
}
