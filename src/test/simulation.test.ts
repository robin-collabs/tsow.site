import { describe, expect, it } from "vitest";
import { idmAccel } from "@/ai/idm";
import type { RoadDataset } from "@/geographic/dataset";
import { buildGraph } from "@/road-network/graph";
import { findRoute } from "@/road-network/router";
import { buildZoneNetwork } from "@/road-network/zone-network";
import { Simulation } from "@/simulation/engine";
import { mulberry32 } from "@/simulation/random";
import { clampVehicleCount, pickWeighted } from "@/simulation/settings";
import { SignalSystem } from "@/simulation/signals";
import { VEHICLE_TYPES } from "@/vehicles/types";

// Square loop of two-way roads 500 m a side, plus a one-way diagonal 0 -> 2.
function testDataset(): RoadDataset {
  return {
    attribution: "test",
    origin: [13, 80.25],
    kx: 108000,
    ky: 110540,
    bbox: [12.9, 80.2, 13.1, 80.3],
    fetchedAt: "",
    nodes: [
      [0, 0, 0],
      [500, 0, 0],
      [500, 500, 1],
      [0, 500, 0],
    ],
    edges: [
      [0, 1, 1, 0, 50, 2, 0, [0, 0, 500, 0]],
      [1, 2, 1, 0, 50, 2, 0, [500, 0, 500, 500]],
      [2, 3, 1, 0, 50, 2, 0, [500, 500, 0, 500]],
      [3, 0, 1, 0, 50, 2, 0, [0, 500, 0, 0]],
      [0, 2, 2, 1, 40, 1, 0, [0, 0, 500, 500]],
    ],
    names: ["Test Road"],
  };
}

describe("vehicle count", () => {
  it("is limited to between 30 and 100", () => {
    expect(clampVehicleCount(10)).toBe(30);
    expect(clampVehicleCount(150)).toBe(100);
    expect(clampVehicleCount(64)).toBe(64);
  });
});

describe("vehicle types", () => {
  it("trucks accelerate slower and brake gentler than bikes", () => {
    expect(VEHICLE_TYPES.truck.accel).toBeLessThan(VEHICLE_TYPES.bike.accel);
    expect(VEHICLE_TYPES.truck.comfortDecel).toBeLessThan(VEHICLE_TYPES.bike.comfortDecel);
  });
  it("autos have a lower top speed than cars", () => {
    expect(VEHICLE_TYPES.auto.maxSpeed).toBeLessThan(VEHICLE_TYPES.car.maxSpeed);
  });
  it("only bikes and autos filter through gaps", () => {
    expect(VEHICLE_TYPES.bike.filters).toBe(true);
    expect(VEHICLE_TYPES.auto.filters).toBe(true);
    expect(VEHICLE_TYPES.car.filters).toBe(false);
    expect(VEHICLE_TYPES.truck.filters).toBe(false);
  });
  it("picks only types with weight", () => {
    for (let r = 0; r < 1; r += 0.05) {
      expect(pickWeighted({ car: 0, bike: 0, auto: 1, truck: 0 }, r)).toBe("auto");
    }
  });
});

describe("car following", () => {
  it("brakes hard when closing on a stopped vehicle", () => {
    expect(idmAccel(VEHICLE_TYPES.car, 12, 14, 8, 12)).toBeLessThan(-3);
  });
  it("accelerates at full rate on a free road from standstill", () => {
    expect(idmAccel(VEHICLE_TYPES.car, 0, 14, Infinity, 0)).toBeCloseTo(VEHICLE_TYPES.car.accel);
  });
});

describe("road graph", () => {
  const graph = buildGraph(testDataset());
  const net = buildZoneNetwork(graph, { minX: -10, minY: -10, maxX: 510, maxY: 510 });

  it("makes two directed edges per two-way road and one per one-way road", () => {
    expect(graph.edges.length).toBe(9);
  });
  it("never routes against a one-way road", () => {
    const route = findRoute(graph, net, 2, 0)!;
    expect(route).not.toBeNull();
    for (const e of route) expect(graph.edges[e]!.from === 2 && graph.edges[e]!.to === 0).toBe(false);
  });
  it("uses the one-way shortcut in its legal direction", () => {
    const route = findRoute(graph, net, 0, 2)!;
    expect(route.length).toBe(1);
  });
});

describe("simulation", () => {
  it("keeps vehicles on the road network without overlapping for two simulated minutes", () => {
    const graph = buildGraph(testDataset());
    const net = buildZoneNetwork(graph, { minX: -10, minY: -10, maxX: 510, maxY: 510 });
    const sim = new Simulation(
      graph,
      new SignalSystem(graph, mulberry32(3)),
      net,
      { vehicleCount: 30, mix: { car: 1, bike: 1, auto: 1, truck: 1 } },
      5,
    );
    expect(sim.vehicles.length).toBe(30);
    let worstOverlap = 0;
    let offNetwork = 0;
    for (let i = 0; i < 120 * 30; i++) {
      sim.step(1 / 30);
      const byEdge = new Map<number, typeof sim.vehicles>();
      for (const v of sim.vehicles) {
        const e = v.route[v.ri]!;
        if (net.allowed[e] !== 1 || v.s < 0 || v.s > graph.edges[e]!.len) offNetwork++;
        byEdge.set(e, [...(byEdge.get(e) ?? []), v]);
      }
      for (const list of byEdge.values()) {
        for (const a of list)
          for (const b of list) {
            // ignore side-scrapes: only count bodies that overlap sideways by more than 30 cm
            if (a === b || Math.abs(a.lat - b.lat) >= (a.p.width + b.p.width) / 2 - 0.3) continue;
            const overlap = (a.p.length + b.p.length) / 2 - Math.abs(a.s - b.s);
            worstOverlap = Math.max(worstOverlap, overlap);
          }
      }
    }
    expect(sim.stats().avgSpeedKmh).toBeGreaterThan(0);
    expect(offNetwork).toBe(0);
    expect(worstOverlap).toBeLessThan(1.5);
  }, 30000);
});
