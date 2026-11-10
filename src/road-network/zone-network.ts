import type { BoundsM } from "@/geographic/zones";
import type { RoadGraph } from "./graph";

/** The drivable part of the graph for one zone: the largest strongly connected component inside it. */
export interface ZoneNetwork {
  allowed: Uint8Array;
  edgeList: number[];
  nodeList: number[];
  laneKm: number;
  bounds: BoundsM;
}

export function buildZoneNetwork(graph: RoadGraph, bounds: BoundsM): ZoneNetwork {
  const { nodes, edges } = graph;
  const N = nodes.length;
  const inside = new Uint8Array(N);
  for (const n of nodes) {
    if (n.x >= bounds.minX && n.x <= bounds.maxX && n.y >= bounds.minY && n.y <= bounds.maxY) {
      inside[n.id] = 1;
    }
  }
  const cand = new Uint8Array(edges.length);
  for (const e of edges) if (inside[e.from] && inside[e.to]) cand[e.id] = 1;

  // Kosaraju, iterative. Pass 1: post-order on the forward graph.
  const visited = new Uint8Array(N);
  const order: number[] = [];
  for (let start = 0; start < N; start++) {
    if (!inside[start] || visited[start]) continue;
    visited[start] = 1;
    const stack: [number, number][] = [[start, 0]];
    while (stack.length) {
      const top = stack[stack.length - 1]!;
      const outs = nodes[top[0]]!.out;
      let pushed = false;
      while (top[1] < outs.length) {
        const e = outs[top[1]++]!;
        if (!cand[e]) continue;
        const v = edges[e]!.to;
        if (!visited[v]) {
          visited[v] = 1;
          stack.push([v, 0]);
          pushed = true;
          break;
        }
      }
      if (!pushed) {
        order.push(top[0]);
        stack.pop();
      }
    }
  }
  // Pass 2: reverse graph in reverse post-order.
  const comp = new Int32Array(N).fill(-1);
  const sizes: number[] = [];
  for (let i = order.length - 1; i >= 0; i--) {
    const u = order[i]!;
    if (comp[u] !== -1) continue;
    const c = sizes.length;
    let size = 0;
    comp[u] = c;
    const stack = [u];
    while (stack.length) {
      const x = stack.pop()!;
      size++;
      for (const e of nodes[x]!.inc) {
        if (!cand[e]) continue;
        const w = edges[e]!.from;
        if (comp[w] === -1) {
          comp[w] = c;
          stack.push(w);
        }
      }
    }
    sizes.push(size);
  }
  let best = 0;
  sizes.forEach((s, i) => {
    if (s > sizes[best]!) best = i;
  });

  const allowed = new Uint8Array(edges.length);
  const edgeList: number[] = [];
  let laneKm = 0;
  for (const e of edges) {
    if (cand[e.id] && comp[e.from] === best && comp[e.to] === best) {
      allowed[e.id] = 1;
      edgeList.push(e.id);
      laneKm += (e.len * e.lanes) / 1000;
    }
  }
  const nodeList: number[] = [];
  for (let i = 0; i < N; i++) if (comp[i] === best && inside[i]) nodeList.push(i);
  return { allowed, edgeList, nodeList, laneKm, bounds };
}
