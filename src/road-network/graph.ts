import type { RoadDataset } from "@/geographic/dataset";
import type { BoundsM } from "@/geographic/zones";

export const LANE_WIDTH = 3.2;

export interface GNode {
  id: number;
  x: number;
  y: number;
  signal: boolean;
  out: number[];
  inc: number[];
}

/** A directed edge: one travel direction of an OSM road segment. */
export interface DEdge {
  id: number;
  from: number;
  to: number;
  pts: number[];
  cum: number[];
  len: number;
  lanes: number;
  /** m/s */
  speed: number;
  /** 0 trunk, 1 primary, 2 secondary, 3 tertiary */
  cls: number;
  twoWay: boolean;
  name: string;
  road: number;
  rev: number;
  startHeading: number;
  endHeading: number;
}

/** An undirected road segment, used for drawing. */
export interface Road {
  id: number;
  pts: number[];
  lanes: number;
  twoWay: boolean;
  cls: number;
  width: number;
}

export interface RoadGraph {
  nodes: GNode[];
  edges: DEdge[];
  roads: Road[];
  bounds: BoundsM;
}

function cumulative(pts: number[]): number[] {
  const cum = [0];
  for (let i = 2; i < pts.length; i += 2) {
    cum.push(cum[cum.length - 1]! + Math.hypot(pts[i]! - pts[i - 2]!, pts[i + 1]! - pts[i - 1]!));
  }
  return cum;
}

function reversePts(pts: number[]): number[] {
  const r: number[] = [];
  for (let i = pts.length - 2; i >= 0; i -= 2) r.push(pts[i]!, pts[i + 1]!);
  return r;
}

export function buildGraph(ds: RoadDataset): RoadGraph {
  const nodes: GNode[] = ds.nodes.map(([x, y, s], id) => ({
    id,
    x,
    y,
    signal: s === 1,
    out: [],
    inc: [],
  }));
  const bounds: BoundsM = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const n of nodes) {
    bounds.minX = Math.min(bounds.minX, n.x);
    bounds.minY = Math.min(bounds.minY, n.y);
    bounds.maxX = Math.max(bounds.maxX, n.x);
    bounds.maxY = Math.max(bounds.maxY, n.y);
  }
  const edges: DEdge[] = [];
  const roads: Road[] = [];

  ds.edges.forEach(([a, b, cls, oneway, speedKmh, lanes, nameIdx, pts], roadId) => {
    const twoWay = oneway === 0;
    roads.push({
      id: roadId,
      pts,
      lanes,
      twoWay,
      cls,
      width: (twoWay ? lanes * 2 : lanes) * LANE_WIDTH,
    });
    const add = (from: number, to: number, p: number[]) => {
      if (p.length < 4) return -1;
      const cum = cumulative(p);
      const len = cum[cum.length - 1]!;
      if (len < 0.5) return -1;
      const n = p.length;
      const id = edges.length;
      edges.push({
        id,
        from,
        to,
        pts: p,
        cum,
        len,
        lanes,
        speed: Math.max(15, speedKmh) / 3.6,
        cls,
        twoWay,
        name: ds.names[nameIdx] ?? "",
        road: roadId,
        rev: -1,
        startHeading: Math.atan2(p[3]! - p[1]!, p[2]! - p[0]!),
        endHeading: Math.atan2(p[n - 1]! - p[n - 3]!, p[n - 2]! - p[n - 4]!),
      });
      nodes[from]!.out.push(id);
      nodes[to]!.inc.push(id);
      return id;
    };
    const f = add(a, b, pts);
    if (twoWay) {
      const r = add(b, a, reversePts(pts));
      if (f >= 0 && r >= 0) {
        edges[f]!.rev = r;
        edges[r]!.rev = f;
      }
    }
  });

  return { nodes, edges, roads, bounds };
}

export interface EdgePoint {
  x: number;
  y: number;
  angle: number;
}

/** Position and heading at distance s along an edge's centreline. */
export function pointAt(e: DEdge, s: number, out: EdgePoint): EdgePoint {
  const { pts, cum } = e;
  let i = 1;
  while (i < cum.length - 1 && cum[i]! < s) i++;
  const s0 = cum[i - 1]!;
  const segLen = cum[i]! - s0 || 1e-6;
  const t = Math.min(1, Math.max(0, (s - s0) / segLen));
  const x0 = pts[2 * i - 2]!;
  const y0 = pts[2 * i - 1]!;
  const x1 = pts[2 * i]!;
  const y1 = pts[2 * i + 1]!;
  out.x = x0 + (x1 - x0) * t;
  out.y = y0 + (y1 - y0) * t;
  out.angle = Math.atan2(y1 - y0, x1 - x0);
  return out;
}

/**
 * Lateral offsets are measured to the LEFT of the direction of travel (India drives on the left).
 * Lane 0 is the kerb lane; higher lanes are closer to the centre / overtaking side.
 */
export function laneCenter(e: DEdge, lane: number): number {
  return e.twoWay
    ? (e.lanes - lane - 0.5) * LANE_WIDTH
    : (e.lanes / 2 - lane - 0.5) * LANE_WIDTH;
}

export function latBounds(e: DEdge, width: number): [number, number] {
  const half = width / 2;
  if (e.twoWay) return [half + 0.25, e.lanes * LANE_WIDTH - half - 0.15];
  const w = (e.lanes * LANE_WIDTH) / 2;
  return [-w + half + 0.15, w - half - 0.15];
}

export function angleDiff(a: number, b: number): number {
  let d = Math.abs(a - b) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;
  return d;
}
