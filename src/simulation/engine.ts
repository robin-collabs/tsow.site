import { drive, type Perception } from "@/ai/driver";
import { laneCenter, latBounds, pointAt, type EdgePoint, type RoadGraph } from "@/road-network/graph";
import { findRoute } from "@/road-network/router";
import type { ZoneNetwork } from "@/road-network/zone-network";
import { VEHICLE_ORDER, VEHICLE_TYPES, shade, type VehicleType } from "@/vehicles/types";
import type { Vehicle } from "@/vehicles/vehicle";
import { mulberry32 } from "./random";
import { pickWeighted, type SimSettings } from "./settings";
import type { SignalSystem } from "./signals";

export interface SimStats {
  total: number;
  counts: Record<VehicleType, number>;
  avgSpeedKmh: number;
  /** vehicles per lane-km of the active zone */
  density: number;
  stopped: number;
  trips: number;
  recoveries: number;
  time: number;
}

const REROUTE_AFTER = 30;
const RESPAWN_AFTER = 75;

export class Simulation {
  vehicles: Vehicle[] = [];
  time = 0;
  trips = 0;
  recoveries = 0;
  private nextId = 1;
  private rand: () => number;
  private byEdge = new Map<number, Vehicle[]>();
  private approaching = new Map<number, Vehicle[]>();
  private pt: EdgePoint = { x: 0, y: 0, angle: 0 };

  constructor(
    readonly graph: RoadGraph,
    readonly signals: SignalSystem,
    public net: ZoneNetwork,
    public settings: SimSettings,
    seed = 1,
  ) {
    this.rand = mulberry32(seed);
    this.populate(true);
  }

  reset(net?: ZoneNetwork, seed?: number) {
    if (net) this.net = net;
    if (seed !== undefined) this.rand = mulberry32(seed);
    this.vehicles = [];
    this.time = 0;
    this.trips = 0;
    this.recoveries = 0;
    this.populate(true);
  }

  /** Spawns or removes vehicles to match the target count. */
  private populate(initial: boolean) {
    const target = this.settings.vehicleCount;
    let tries = 0;
    let spawned = 0;
    const maxTries = initial ? target * 40 : 20;
    while (this.vehicles.length < target && tries < maxTries && (initial || spawned < 2)) {
      tries++;
      if (this.spawn()) spawned++;
    }
    while (this.vehicles.length > target) {
      this.vehicles.splice(Math.floor(this.rand() * this.vehicles.length), 1);
    }
  }

  /** Adds one vehicle of a type (used by the spawn buttons). */
  spawnType(type: VehicleType): boolean {
    for (let i = 0; i < 30; i++) if (this.spawn(type)) return true;
    return false;
  }

  private pickDest(from: number): number {
    const { nodeList } = this.net;
    const f = this.graph.nodes[from]!;
    let best = nodeList[0] ?? from;
    for (let i = 0; i < 8; i++) {
      const n = nodeList[Math.floor(this.rand() * nodeList.length)]!;
      best = n;
      const t = this.graph.nodes[n]!;
      if (n !== from && Math.hypot(t.x - f.x, t.y - f.y) > 700) break;
    }
    return best;
  }

  private spawn(forced?: VehicleType): boolean {
    const { edgeList } = this.net;
    if (!edgeList.length) return false;
    const E = this.graph.edges[edgeList[Math.floor(this.rand() * edgeList.length)]!]!;
    if (E.len < 24) return false;
    const s = 8 + this.rand() * (E.len - 16);
    if (this.vehicles.some((v) => v.route[v.ri] === E.id && Math.abs(v.s - s) < 16)) return false;
    const dest = this.pickDest(E.to);
    const path = findRoute(this.graph, this.net, E.to, dest, E.rev);
    if (!path || !path.length) return false;
    const type = forced ?? pickWeighted(this.settings.mix, this.rand());
    const p = VEHICLE_TYPES[type];
    const lane = type === "truck" ? 0 : Math.floor(this.rand() * E.lanes);
    const baseBias = p.filters ? (this.rand() - 0.5) * 1.0 : (this.rand() - 0.5) * 0.3;
    const color = p.colors[Math.floor(this.rand() * p.colors.length)]!;
    const aggr = 0.88 + this.rand() * 0.24;
    const [lo, hi] = latBounds(E, p.width);
    const lat = Math.min(hi, Math.max(lo, laneCenter(E, lane) + baseBias));
    const veh: Vehicle = {
      id: this.nextId++,
      type,
      p,
      color,
      side: shade(color, 0.62),
      route: [E.id, ...path],
      ri: 0,
      s,
      v: Math.min(p.maxSpeed, E.speed) * 0.4,
      a: 0,
      lane,
      lat,
      bias: baseBias,
      baseBias,
      aggr,
      x: 0,
      y: 0,
      heading: 0,
      state: "cruising",
      waitT: 0,
      stuckT: 0,
      laneCd: 1,
      pickupT: 0,
      nextPickup: p.stopRate > 0 ? (60 / p.stopRate) * this.rand() : 0,
      rerouted: false,
      dest,
      trips: 0,
      dead: false,
    };
    pointAt(E, s, this.pt);
    veh.x = this.pt.x + Math.sin(this.pt.angle) * lat;
    veh.y = this.pt.y - Math.cos(this.pt.angle) * lat;
    veh.heading = this.pt.angle;
    this.vehicles.push(veh);
    return true;
  }

  private index() {
    this.byEdge.clear();
    this.approaching.clear();
    for (const v of this.vehicles) {
      const eid = v.route[v.ri]!;
      const list = this.byEdge.get(eid);
      if (list) list.push(v);
      else this.byEdge.set(eid, [v]);
      const E = this.graph.edges[eid]!;
      if (E.len - v.s < 30) {
        const al = this.approaching.get(E.to);
        if (al) al.push(v);
        else this.approaching.set(E.to, [v]);
      }
    }
  }

  private assignRoute(A: Vehicle, from: number, avoid: number): boolean {
    const dest = this.pickDest(from);
    const path = findRoute(this.graph, this.net, from, dest, avoid);
    if (!path || !path.length) return false;
    A.route = path;
    A.ri = 0;
    A.dest = dest;
    return true;
  }

  step(dt: number) {
    this.time += dt;
    this.populate(false);
    this.index();
    const P: Perception = {
      graph: this.graph,
      signals: this.signals,
      byEdge: this.byEdge,
      approaching: this.approaching,
      time: this.time,
      rand: this.rand,
    };
    const list = this.vehicles;
    const acc = new Float64Array(list.length);
    for (let i = 0; i < list.length; i++) acc[i] = drive(list[i]!, P, dt);
    for (let i = 0; i < list.length; i++) this.move(list[i]!, acc[i]!, dt);
    if (list.some((v) => v.dead)) this.vehicles = list.filter((v) => !v.dead);
  }

  private move(A: Vehicle, accel: number, dt: number) {
    const { edges } = this.graph;
    const p = A.p;
    A.a = accel;
    A.v = Math.max(0, A.v + accel * dt);
    if (accel < 0 && A.v < 0.05) A.v = 0;
    A.s += A.v * dt;
    if (A.laneCd > 0) A.laneCd -= dt;
    if (A.state === "yielding" && A.v < 1) A.waitT += dt;
    if (A.pickupT > 0 && A.v < 0.3) A.pickupT = Math.max(0, A.pickupT - dt);

    let E = edges[A.route[A.ri]!]!;
    while (A.s >= E.len) {
      A.s -= E.len;
      A.ri++;
      A.waitT = 0;
      if (A.ri >= A.route.length) {
        A.trips++;
        this.trips++;
        if (!this.assignRoute(A, E.to, E.rev)) {
          A.dead = true;
          return;
        }
      }
      E = edges[A.route[A.ri]!]!;
      if (A.lane >= E.lanes) A.lane = E.lanes - 1;
    }

    // Lateral motion towards lane centre + personal bias (+ kerb-side drift for roadside stops)
    const [lo, hi] = latBounds(E, p.width);
    const target = Math.min(hi, Math.max(lo, laneCenter(E, A.lane) + A.bias + (A.pickupT > 0 ? 1 : 0)));
    const maxStep = p.latSpeed * dt * Math.min(1, 0.3 + A.v / 5);
    const latVel = Math.max(-maxStep, Math.min(maxStep, target - A.lat));
    A.lat += latVel;

    // Deadlock prevention and route recovery
    if (A.v < 0.3 && A.state !== "signal" && A.pickupT <= 0) A.stuckT += dt;
    else if (A.v > 1) {
      A.stuckT = 0;
      A.rerouted = false;
    }
    if (A.stuckT > RESPAWN_AFTER) {
      A.dead = true;
      this.recoveries++;
      return;
    }
    if (A.stuckT > REROUTE_AFTER && !A.rerouted) {
      A.rerouted = true;
      const dest = this.pickDest(E.to);
      const path = findRoute(this.graph, this.net, E.to, dest);
      if (path) {
        A.route = [E.id, ...path];
        A.ri = 0;
        A.dest = dest;
        A.waitT = 99;
        A.state = "recovering";
        this.recoveries++;
      }
    }

    // Render pose (lightly smoothed so corners and lane offsets don't snap)
    pointAt(E, A.s, this.pt);
    const x = this.pt.x + Math.sin(this.pt.angle) * A.lat;
    const y = this.pt.y - Math.cos(this.pt.angle) * A.lat;
    const k = Math.min(1, dt * 12);
    if (Math.hypot(x - A.x, y - A.y) > 15) {
      A.x = x;
      A.y = y;
    } else {
      A.x += (x - A.x) * k;
      A.y += (y - A.y) * k;
    }
    const want = this.pt.angle - Math.atan2(latVel / dt, Math.max(A.v, 2));
    let d = want - A.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    A.heading += d * Math.min(1, dt * 10);
  }

  stats(): SimStats {
    const counts = { car: 0, bike: 0, auto: 0, truck: 0 } as Record<VehicleType, number>;
    let speed = 0;
    let stopped = 0;
    for (const v of this.vehicles) {
      counts[v.type]++;
      speed += v.v;
      if (v.v < 0.5) stopped++;
    }
    const n = this.vehicles.length;
    return {
      total: n,
      counts,
      avgSpeedKmh: n ? (speed / n) * 3.6 : 0,
      density: this.net.laneKm > 0 ? n / this.net.laneKm : 0,
      stopped,
      trips: this.trips,
      recoveries: this.recoveries,
      time: this.time,
    };
  }

  remainingKm(A: Vehicle): number {
    let d = -A.s;
    for (let i = A.ri; i < A.route.length; i++) d += this.graph.edges[A.route[i]!]!.len;
    return d / 1000;
  }

  find(id: number): Vehicle | undefined {
    return this.vehicles.find((v) => v.id === id);
  }
}

export { VEHICLE_ORDER };
