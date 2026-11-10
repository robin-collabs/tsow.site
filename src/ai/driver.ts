import { angleDiff, laneCenter, latBounds, type DEdge, type RoadGraph } from "@/road-network/graph";
import type { SignalSystem } from "@/simulation/signals";
import type { DriveState, Vehicle } from "@/vehicles/vehicle";
import { idmAccel } from "./idm";

/** What a driver can see this tick. Built once per step by the engine. */
export interface Perception {
  graph: RoadGraph;
  signals: SignalSystem;
  byEdge: Map<number, Vehicle[]>;
  /** vehicles within 30 m of the end of their current edge, keyed by that end node */
  approaching: Map<number, Vehicle[]>;
  time: number;
  rand: () => number;
}

export interface Leader {
  gap: number;
  v: number;
  veh: Vehicle | null;
}

const LAT_MARGIN = 0.35;
const YIELD_PATIENCE = 4;

/** Nearest vehicle ahead along the route whose footprint overlaps the given lateral offset. */
export function findLeader(A: Vehicle, lat: number, lookahead: number, P: Perception): Leader {
  let best = Infinity;
  let bv = 0;
  let bveh: Vehicle | null = null;
  let dist = -A.s;
  for (let k = 0; A.ri + k < A.route.length; k++) {
    if (dist > lookahead) break;
    const eid = A.route[A.ri + k]!;
    const list = P.byEdge.get(eid);
    if (list) {
      for (const B of list) {
        if (B === A) continue;
        if (k === 0 && (B.s < A.s || (B.s === A.s && B.id < A.id))) continue;
        if (Math.abs(B.lat - lat) >= (A.p.width + B.p.width) / 2 + LAT_MARGIN) continue;
        const gap = dist + B.s - (A.p.length + B.p.length) / 2;
        if (gap < best) {
          best = gap;
          bv = B.v;
          bveh = B;
        }
      }
    }
    dist += P.graph.edges[eid]!.len;
  }
  return { gap: best, v: bv, veh: bveh };
}

/** Free space behind on the current edge at a lateral offset (for lane changes). */
function rearClear(A: Vehicle, lat: number, P: Perception): boolean {
  const list = P.byEdge.get(A.route[A.ri]!);
  if (!list) return true;
  for (const B of list) {
    if (B === A || B.s > A.s) continue;
    if (Math.abs(B.lat - lat) >= (A.p.width + B.p.width) / 2 + LAT_MARGIN) continue;
    const gap = A.s - B.s - (A.p.length + B.p.length) / 2;
    if (gap < 2 + B.v * 0.6 + Math.max(0, B.v - A.v) * 1.5) return false;
  }
  return true;
}

function lateralOk(A: Vehicle, lat: number, needAhead: number, P: Perception): boolean {
  const ahead = findLeader(A, lat, Math.max(needAhead + 10, 40), P);
  return ahead.gap > needAhead && rearClear(A, lat, P);
}

/** Right-of-way at an unsignalled junction: bigger road first, then whoever arrives first. */
function mustYield(A: Vehicle, Ek: DEdge, dEnd: number, next: DEdge, P: Perception): boolean {
  const list = P.approaching.get(Ek.to);
  if (!list) return false;
  const tA = dEnd / Math.max(A.v, 2);
  for (const C of list) {
    if (C === A) continue;
    const Ce = P.graph.edges[C.route[C.ri]!]!;
    const merging = C.route[C.ri + 1] === next.id;
    // Oncoming traffic on our own road / the road we enter only conflicts if it merges into our exit.
    if (!merging && (Ce.road === Ek.road || Ce.road === next.road)) continue;
    const dC = Ce.len - C.s;
    if (dC > 20) continue;
    if (Ce.cls < Ek.cls) return true;
    if (Ce.cls > Ek.cls) continue;
    const tC = dC / Math.max(C.v, 2);
    if (tC < tA - 0.3 || (Math.abs(tC - tA) <= 0.3 && C.id < A.id)) return true;
  }
  return false;
}

/**
 * Rule-based driving policy. Picks lane / lateral target and returns the desired acceleration.
 * Order: car-following → turn speed → signals → junction right-of-way → lane change / filtering.
 */
export function drive(A: Vehicle, P: Perception, dt: number): number {
  const { graph } = P;
  const p = A.p;
  const E = graph.edges[A.route[A.ri]!]!;
  let v0 = Math.min(p.maxSpeed, E.speed * p.speedFactor) * A.aggr;
  let state: DriveState = "cruising";

  const lead = findLeader(A, A.lat, 20 + A.v * 4, P);
  let accel = idmAccel(p, A.v, v0, lead.gap, A.v - lead.v);
  if (lead.veh && lead.gap < A.v * p.timeHeadway * 2 + 10) state = "following";

  // Junctions ahead on the route
  let dist = -A.s;
  const horizon = 30 + (A.v * A.v) / (2 * p.comfortDecel);
  for (let k = 0; A.ri + k + 1 < A.route.length && k < 5; k++) {
    const Ek = graph.edges[A.route[A.ri + k]!]!;
    const dEnd = dist + Ek.len;
    dist = dEnd;
    if (dEnd > horizon) break;
    const next = graph.edges[A.route[A.ri + k + 1]!]!;

    const turn = angleDiff(Ek.endHeading, next.startHeading);
    if (turn > 0.6) {
      const vTurn = turn > 2.5 ? 2.5 : turn > 1.2 ? p.turnSpeed : p.turnSpeed * 1.5;
      const vAllowed = Math.sqrt(vTurn * vTurn + 2 * p.comfortDecel * Math.max(0, dEnd - 3));
      if (vAllowed < v0) {
        v0 = vAllowed;
        const a2 = idmAccel(p, A.v, v0, lead.gap, A.v - lead.v);
        if (a2 < accel) accel = a2;
        if (state === "cruising" && dEnd < 35) state = "turning";
      }
    }

    const light = P.signals.state(Ek.id, P.time);
    if (light === "red" || (light === "amber" && dEnd > (A.v * A.v) / (2 * p.comfortDecel) + 2)) {
      const a2 = idmAccel(p, A.v, v0, dEnd - 2 - p.length / 2, A.v);
      if (a2 < accel) {
        accel = a2;
        state = "signal";
      }
      break;
    }

    if (!light && graph.nodes[Ek.to]!.inc.length > 1 && dEnd < 22) {
      if (A.waitT < YIELD_PATIENCE && mustYield(A, Ek, dEnd, next, P)) {
        const a2 = idmAccel(p, A.v, v0, dEnd - 1 - p.length / 2, A.v);
        if (a2 < accel) {
          accel = a2;
          state = "yielding";
        }
      }
    }
  }

  // Auto rickshaw roadside stops
  if (p.stopRate > 0) {
    if (A.pickupT > 0) {
      accel = Math.min(accel, A.v > 0.2 ? -p.comfortDecel : 0);
      state = "pickup";
    } else {
      A.nextPickup -= dt;
      if (A.nextPickup <= 0 && A.v > 3 && E.cls >= 1 && lead.gap > 25) {
        A.pickupT = 4 + P.rand() * 5;
        A.nextPickup = (60 / p.stopRate) * (0.5 + P.rand());
      }
    }
  }

  // Lane changes, overtaking and filtering
  if (A.laneCd <= 0 && state !== "pickup" && state !== "signal") {
    const blocked = lead.veh !== null && lead.gap < 12 + A.v * 2.5 && lead.v < v0 - 1.5;
    if (blocked) {
      let changed = false;
      if (E.lanes > 1) {
        for (const L of [A.lane + 1, A.lane - 1]) {
          if (L < 0 || L >= E.lanes) continue;
          const lat = laneCenter(E, L) + A.baseBias;
          if (lateralOk(A, lat, lead.gap + p.overtakeGain, P)) {
            A.lane = L;
            A.bias = A.baseBias;
            A.laneCd = 3;
            state = "overtaking";
            changed = true;
            break;
          }
        }
      }
      if (!changed && p.filters && lead.veh) {
        const [lo, hi] = latBounds(E, p.width);
        const off = (lead.veh.p.width + p.width) / 2 + LAT_MARGIN + 0.1;
        for (const lat of [lead.veh.lat - off, lead.veh.lat + off]) {
          if (lat < lo || lat > hi) continue;
          if (lateralOk(A, lat, lead.gap + 2, P)) {
            A.bias = lat - laneCenter(E, A.lane);
            A.laneCd = 1.5;
            state = "filtering";
            break;
          }
        }
      }
      if (state !== "overtaking" && state !== "filtering") A.laneCd = 0.5;
    } else {
      // Keep left when the kerb-side lane is free; let personal lateral bias relax.
      if (A.lane > 0) {
        const lat = laneCenter(E, A.lane - 1) + A.baseBias;
        if (lateralOk(A, lat, 25 + A.v * 2, P)) {
          A.lane -= 1;
          A.laneCd = 4;
        } else A.laneCd = 1;
      }
      A.bias += (A.baseBias - A.bias) * Math.min(1, dt * 0.25);
    }
  }

  A.state = state;
  return accel;
}
