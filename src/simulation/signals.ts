import type { RoadGraph } from "@/road-network/graph";

export type LightState = "green" | "amber" | "red";

export const GREEN_TIME = 14;
export const AMBER_TIME = 3;
const PHASE = GREEN_TIME + AMBER_TIME;
const CYCLE = PHASE * 2;
const CLUSTER_RADIUS = 45;

const axis = (h: number) => ((h % Math.PI) + Math.PI) % Math.PI;
const axisDiff = (a: number, b: number) => {
  const d = Math.abs(a - b);
  return Math.min(d, Math.PI - d);
};

/**
 * Two-phase controllers at OSM traffic_signals nodes. Signal nodes within 45 m are treated as one
 * junction; approaches are split into two phases by road axis.
 */
export class SignalSystem {
  readonly controlled: number[] = [];
  private ctl = new Map<number, { offset: number; group: number }>();

  constructor(graph: RoadGraph, rand: () => number) {
    const sig = graph.nodes.filter((n) => n.signal);
    const parent = sig.map((_, i) => i);
    const find = (i: number): number => {
      while (parent[i] !== i) i = parent[i] = parent[parent[i]!]!;
      return i;
    };
    for (let i = 0; i < sig.length; i++) {
      for (let j = i + 1; j < sig.length; j++) {
        const a = sig[i]!;
        const b = sig[j]!;
        if (Math.abs(a.x - b.x) < CLUSTER_RADIUS && Math.hypot(a.x - b.x, a.y - b.y) < CLUSTER_RADIUS) {
          parent[find(i)] = find(j);
        }
      }
    }
    const clusters = new Map<number, number[]>();
    sig.forEach((n, i) => {
      const r = find(i);
      const list = clusters.get(r) ?? [];
      list.push(n.id);
      clusters.set(r, list);
    });
    for (const ids of clusters.values()) {
      const set = new Set(ids);
      const inc = ids.flatMap((id) => graph.nodes[id]!.inc).filter((e) => !set.has(graph.edges[e]!.from));
      if (!inc.length) continue;
      const offset = rand() * CYCLE;
      const ref = axis(graph.edges[inc[0]!]!.endHeading);
      for (const e of inc) {
        const group = axisDiff(axis(graph.edges[e]!.endHeading), ref) < Math.PI / 4 ? 0 : 1;
        this.ctl.set(e, { offset, group });
        this.controlled.push(e);
      }
    }
  }

  state(edgeId: number, t: number): LightState | null {
    const c = this.ctl.get(edgeId);
    if (!c) return null;
    const local = (((t + c.offset + c.group * PHASE) % CYCLE) + CYCLE) % CYCLE;
    return local < GREEN_TIME ? "green" : local < PHASE ? "amber" : "red";
  }
}
