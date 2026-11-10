import type { BoundsM } from "@/geographic/zones";
import { LANE_WIDTH, pointAt, type EdgePoint, type RoadGraph } from "@/road-network/graph";
import type { Simulation } from "@/simulation/engine";
import type { SignalSystem } from "@/simulation/signals";
import type { VehicleType } from "@/vehicles/types";
import type { Camera } from "./camera";
import type { Palette } from "./palette";
import { drawSelection, drawVehicle } from "./vehicle-sprite";

interface RoadGroup {
  path: Path2D;
  width: number;
  minPx: number;
}

export interface DrawOptions {
  hidden: Set<VehicleType>;
  selectedId: number | null;
  zone: BoundsM | null;
}

const MIN_PX = [2.8, 2.2, 1.6, 1.1];

function offsetPolyline(pts: number[], d: number): number[] {
  const n = pts.length / 2;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = pts[2 * i]!;
    const y = pts[2 * i + 1]!;
    let nx = 0;
    let ny = 0;
    if (i > 0) {
      const dx = x - pts[2 * i - 2]!;
      const dy = y - pts[2 * i - 1]!;
      const l = Math.hypot(dx, dy) || 1;
      nx += dy / l;
      ny += -dx / l;
    }
    if (i < n - 1) {
      const dx = pts[2 * i + 2]! - x;
      const dy = pts[2 * i + 3]! - y;
      const l = Math.hypot(dx, dy) || 1;
      nx += dy / l;
      ny += -dx / l;
    }
    const l = Math.hypot(nx, ny) || 1;
    out.push(x + (nx / l) * d, y + (ny / l) * d);
  }
  return out;
}

function addLine(path: Path2D, pts: number[]) {
  path.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) path.lineTo(pts[i]!, pts[i + 1]!);
}

/** Draws the static road network (prebuilt Path2D batches) and the moving vehicles on top. */
export class Renderer {
  private groups: RoadGroup[] = [];
  private lanes = new Path2D();
  private centre = new Path2D();
  private median = new Path2D();
  private lights: { e: number; x: number; y: number }[] = [];
  private pt: EdgePoint = { x: 0, y: 0, angle: 0 };

  constructor(
    private graph: RoadGraph,
    signals: SignalSystem,
    private pal: Palette,
  ) {
    const byKey = new Map<string, RoadGroup>();
    for (const r of graph.roads) {
      const key = `${r.cls}:${Math.round(r.width)}`;
      let g = byKey.get(key);
      if (!g) {
        g = { path: new Path2D(), width: r.width, minPx: MIN_PX[r.cls] ?? 1 };
        byKey.set(key, g);
      }
      addLine(g.path, r.pts);
      if (r.twoWay) {
        addLine(r.cls <= 1 ? this.median : this.centre, r.pts);
        for (let k = 1; k < r.lanes; k++) {
          addLine(this.lanes, offsetPolyline(r.pts, k * LANE_WIDTH));
          addLine(this.lanes, offsetPolyline(r.pts, -k * LANE_WIDTH));
        }
      } else {
        for (let k = 1; k < r.lanes; k++) {
          addLine(this.lanes, offsetPolyline(r.pts, (-r.lanes / 2 + k) * LANE_WIDTH));
        }
      }
    }
    this.groups = [...byKey.values()].sort((a, b) => a.width - b.width);
    for (const e of signals.controlled) {
      const E = graph.edges[e]!;
      pointAt(E, Math.max(0, E.len - 1.5), this.pt);
      const lat = E.twoWay ? (E.lanes * LANE_WIDTH) / 2 : 0;
      this.lights.push({
        e,
        x: this.pt.x + Math.sin(this.pt.angle) * lat,
        y: this.pt.y - Math.cos(this.pt.angle) * lat,
      });
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    w: number,
    h: number,
    dpr: number,
    sim: Simulation,
    opts: DrawOptions,
  ) {
    const pal = this.pal;
    const z = cam.zoom;
    const px = 1 / z;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, 0, w, h);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (w / 2 - cam.cx * z), dpr * (h / 2 - cam.cy * z));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (z > 0.25) {
      ctx.strokeStyle = pal.roadEdge;
      for (const g of this.groups) {
        ctx.lineWidth = Math.max(g.width, g.minPx * px) + Math.max(1.2, 2 * px);
        ctx.stroke(g.path);
      }
    }
    ctx.strokeStyle = pal.road;
    for (const g of this.groups) {
      ctx.lineWidth = Math.max(g.width, g.minPx * px);
      ctx.stroke(g.path);
    }
    if (z > 0.9) {
      ctx.strokeStyle = pal.marking;
      ctx.lineWidth = Math.max(0.15, 0.8 * px);
      ctx.setLineDash([3, 5]);
      ctx.stroke(this.lanes);
      ctx.stroke(this.centre);
      ctx.setLineDash([]);
      ctx.strokeStyle = pal.median;
      ctx.lineWidth = Math.max(0.4, 1.2 * px);
      ctx.stroke(this.median);
    }

    // View rectangle in world units, for culling
    const vx0 = cam.cx - w / 2 / z - 20;
    const vx1 = cam.cx + w / 2 / z + 20;
    const vy0 = cam.cy - h / 2 / z - 20;
    const vy1 = cam.cy + h / 2 / z + 20;
    const inView = (x: number, y: number) => x > vx0 && x < vx1 && y > vy0 && y < vy1;

    if (z > 0.5) {
      const r = Math.max(0.9, 2.6 * px);
      for (const l of this.lights) {
        if (!inView(l.x, l.y)) continue;
        const st = sim.signals.state(l.e, sim.time);
        ctx.fillStyle = st === "green" ? pal.green : st === "amber" ? pal.amber : pal.red;
        ctx.beginPath();
        ctx.arc(l.x, l.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (opts.zone) {
      const b = opts.zone;
      const G = this.graph.bounds;
      ctx.fillStyle = pal.zoneDim;
      ctx.beginPath();
      ctx.rect(G.minX - 20000, G.minY - 20000, G.maxX - G.minX + 40000, G.maxY - G.minY + 40000);
      ctx.rect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY);
      ctx.fill("evenodd");
      ctx.strokeStyle = pal.zoneLine;
      ctx.lineWidth = 1.5 * px;
      ctx.setLineDash([8 * px, 6 * px]);
      ctx.strokeRect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY);
      ctx.setLineDash([]);
    }

    const selected = opts.selectedId != null ? sim.find(opts.selectedId) : undefined;
    if (selected) {
      ctx.strokeStyle = pal.accent;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = Math.max(1.2, 3 * px);
      ctx.beginPath();
      for (let i = selected.ri; i < selected.route.length; i++) {
        const pts = this.graph.edges[selected.route[i]!]!.pts;
        if (i === selected.ri) ctx.moveTo(selected.x, selected.y);
        for (let k = 0; k < pts.length; k += 2) ctx.lineTo(pts[k]!, pts[k + 1]!);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const v of sim.vehicles) {
      if (opts.hidden.has(v.type) || !inView(v.x, v.y)) continue;
      drawVehicle(ctx, v, cam, pal);
    }
    if (selected && !opts.hidden.has(selected.type)) drawSelection(ctx, selected, cam, pal);
  }
}
