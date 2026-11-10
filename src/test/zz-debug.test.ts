import { it } from "vitest";
import { buildGraph } from "@/road-network/graph";
import { buildZoneNetwork } from "@/road-network/zone-network";
import { Simulation } from "@/simulation/engine";
import { mulberry32 } from "@/simulation/random";
import { SignalSystem } from "@/simulation/signals";
import type { RoadDataset } from "@/geographic/dataset";
const ds: RoadDataset = { attribution: "t", origin: [13, 80.25], kx: 108000, ky: 110540, bbox: [0,0,0,0], fetchedAt: "",
  nodes: [[0,0,0],[500,0,0],[500,500,1],[0,500,0]],
  edges: [[0,1,1,0,50,2,0,[0,0,500,0]],[1,2,1,0,50,2,0,[500,0,500,500]],[2,3,1,0,50,2,0,[500,500,0,500]],[3,0,1,0,50,2,0,[0,500,0,0]],[0,2,2,1,40,1,0,[0,0,500,500]]], names: ["T"] };
it("debug", () => {
  const graph = buildGraph(ds);
  const net = buildZoneNetwork(graph, { minX: -10, minY: -10, maxX: 510, maxY: 510 });
  const sim = new Simulation(graph, new SignalSystem(graph, mulberry32(3)), net, { vehicleCount: 30, mix: { car: 1, bike: 1, auto: 1, truck: 1 } }, 5);
  let count = 0;
  const prev = new Map<string, number>();
  for (let i = 0; i < 120 * 30; i++) {
    sim.step(1 / 30);
    for (const a of sim.vehicles) for (const b of sim.vehicles) {
      if (a.id >= b.id || a.route[a.ri] !== b.route[b.ri]) continue;
      if (Math.abs(a.lat - b.lat) >= (a.p.width + b.p.width) / 2) continue;
      const ov = (a.p.length + b.p.length) / 2 - Math.abs(a.s - b.s);
      const key = a.id + "-" + b.id;
      if (ov > 1.0 && !prev.has(key) && count < 12) {
        count++; prev.set(key, i);
        console.log(`t=${(i/30).toFixed(1)} edge=${a.route[a.ri]} ov=${ov.toFixed(2)} A#${a.id} ${a.type} s=${a.s.toFixed(1)} v=${a.v.toFixed(1)} lat=${a.lat.toFixed(2)} ${a.state} wait=${a.waitT.toFixed(1)} stuck=${a.stuckT.toFixed(0)} | B#${b.id} ${b.type} s=${b.s.toFixed(1)} v=${b.v.toFixed(1)} lat=${b.lat.toFixed(2)} ${b.state} wait=${b.waitT.toFixed(1)} stuck=${b.stuckT.toFixed(0)}`);
      }
    }
  }
});
