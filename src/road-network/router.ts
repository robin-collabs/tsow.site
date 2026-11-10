import type { RoadGraph } from "./graph";
import type { ZoneNetwork } from "./zone-network";

class MinHeap {
  private keys: number[] = [];
  private vals: number[] = [];
  get size() {
    return this.keys.length;
  }
  push(k: number, v: number) {
    const keys = this.keys;
    const vals = this.vals;
    let i = keys.length;
    keys.push(k);
    vals.push(v);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (keys[p]! <= k) break;
      keys[i] = keys[p]!;
      vals[i] = vals[p]!;
      i = p;
    }
    keys[i] = k;
    vals[i] = v;
  }
  pop(): number {
    const keys = this.keys;
    const vals = this.vals;
    const top = vals[0]!;
    const lk = keys.pop()!;
    const lv = vals.pop()!;
    const n = keys.length;
    if (n > 0) {
      let i = 0;
      while (true) {
        const l = 2 * i + 1;
        if (l >= n) break;
        const r = l + 1;
        const c = r < n && keys[r]! < keys[l]! ? r : l;
        if (keys[c]! >= lk) break;
        keys[i] = keys[c]!;
        vals[i] = vals[c]!;
        i = c;
      }
      keys[i] = lk;
      vals[i] = lv;
    }
    return top;
  }
}

const U_TURN_PENALTY = 90;

/**
 * A* over travel time, restricted to the zone's drivable edges. Respects one-way roads because
 * one-way OSM ways only produce a single directed edge. Returns edge ids, or null when unreachable.
 */
export function findRoute(
  graph: RoadGraph,
  net: Pick<ZoneNetwork, "allowed">,
  from: number,
  to: number,
  avoidFirstEdge = -1,
): number[] | null {
  if (from === to) return [];
  const { nodes, edges } = graph;
  const N = nodes.length;
  const g = new Float64Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const target = nodes[to]!;
  const h = (n: number) => Math.hypot(nodes[n]!.x - target.x, nodes[n]!.y - target.y) / 25;
  const heap = new MinHeap();
  g[from] = 0;
  heap.push(h(from), from);
  while (heap.size) {
    const u = heap.pop();
    if (closed[u]) continue;
    closed[u] = 1;
    if (u === to) break;
    for (const eid of nodes[u]!.out) {
      if (!net.allowed[eid]) continue;
      const e = edges[eid]!;
      const cost = e.len / e.speed + (u === from && eid === avoidFirstEdge ? U_TURN_PENALTY : 0);
      const ng = g[u]! + cost;
      if (ng < g[e.to]!) {
        g[e.to] = ng;
        prev[e.to] = eid;
        heap.push(ng + h(e.to), e.to);
      }
    }
  }
  if (prev[to] === -1) return null;
  const path: number[] = [];
  let v = to;
  let guard = 0;
  while (v !== from && guard++ < N) {
    const eid = prev[v]!;
    path.push(eid);
    v = edges[eid]!.from;
  }
  if (v !== from) return null;
  return path.reverse();
}
