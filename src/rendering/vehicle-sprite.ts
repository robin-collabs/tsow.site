import type { Vehicle } from "@/vehicles/vehicle";
import type { Camera } from "./camera";
import type { Palette } from "./palette";

type Pt = [number, number];

function poly(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
  ctx.fill();
}

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Roof outline as [front, rear, side] fractions of the half-length / half-width. */
const ROOF: Record<Vehicle["type"], [number, number, number]> = {
  car: [0.42, -0.72, 0.84],
  bike: [0, 0, 0],
  auto: [0.5, -0.95, 0.92],
  truck: [0.48, -1, 1],
};

/**
 * Fake-3D vehicle in the style of Virtual World: the roof is pushed away from the view centre in
 * proportion to height, side walls join footprint and roof, and a soft shadow sits underneath.
 */
export function drawVehicle(
  ctx: CanvasRenderingContext2D,
  A: Vehicle,
  cam: Camera,
  pal: Palette,
) {
  const z = cam.zoom;
  const p = A.p;
  const px = 1 / z;
  const fx = Math.cos(A.heading);
  const fy = Math.sin(A.heading);
  const lx = fy;
  const ly = -fx;
  const hl = p.length / 2;
  const hw = p.width / 2;
  const corner = (f: number, l: number): Pt => [A.x + fx * f + lx * l, A.y + fy * f + ly * l];

  if (z < 0.35) {
    ctx.fillStyle = A.color;
    ctx.strokeStyle = pal.rider;
    ctx.lineWidth = px;
    ctx.beginPath();
    ctx.arc(A.x, A.y, Math.max(hl, (p.type === "truck" ? 4.2 : p.type === "bike" ? 2.8 : 3.4) * px), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    return;
  }
  // Exaggerate small vehicles at mid zoom so they stay readable.
  const grow = z < 1.4 ? Math.max(1, 1.6 / z) : 1;
  const base: Pt[] = [
    corner(hl * grow, hw * grow),
    corner(hl * grow, -hw * grow),
    corner(-hl * grow, -hw * grow),
    corner(-hl * grow, hw * grow),
  ];
  if (z < 0.9) {
    ctx.fillStyle = A.color;
    poly(ctx, base);
    return;
  }

  const sh = p.height * 0.35;
  ctx.fillStyle = pal.shadow;
  poly(ctx, base.map(([x, y]) => [x + sh, y + sh * 1.3] as Pt));

  const dx = A.x - cam.cx;
  const dy = A.y - cam.cy;
  const dist = Math.hypot(dx, dy) || 1;
  const lean = (Math.atan((dist * z) / 600) / (Math.PI / 2)) * p.height * 0.8;
  const ox = (dx / dist) * lean;
  const oy = (dy / dist) * lean;

  ctx.fillStyle = A.color;
  poly(ctx, base);

  if (p.type === "bike") {
    ctx.fillStyle = pal.rider;
    ctx.beginPath();
    ctx.arc(A.x - fx * 0.15 + ox, A.y - fy * 0.15 + oy, 0.38, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const [rf, rr, rs] = ROOF[p.type];
  const roof: Pt[] = [
    corner(hl * rf, hw * rs),
    corner(hl * rf, -hw * rs),
    corner(hl * rr, -hw * rs),
    corner(hl * rr, hw * rs),
  ].map(([x, y]) => [x + ox, y + oy] as Pt);
  const foot: Pt[] = [
    corner(hl * rf, hw * rs),
    corner(hl * rf, -hw * rs),
    corner(hl * rr, -hw * rs),
    corner(hl * rr, hw * rs),
  ];
  const sides = [0, 1, 2, 3]
    .map((i) => {
      const j = (i + 1) % 4;
      const m = lerp(foot[i]!, foot[j]!, 0.5);
      return { i, j, d: Math.hypot(m[0] - cam.cx, m[1] - cam.cy) };
    })
    .sort((a, b) => b.d - a.d);
  ctx.fillStyle = A.side;
  for (const { i, j } of sides) poly(ctx, [foot[i]!, foot[j]!, roof[j]!, roof[i]!]);

  ctx.fillStyle = p.roofColor ?? A.color;
  poly(ctx, roof);
  if (p.type === "car") {
    ctx.fillStyle = pal.glass;
    poly(ctx, [roof[0]!, roof[1]!, lerp(roof[1]!, roof[2]!, 0.28), lerp(roof[0]!, roof[3]!, 0.28)]);
  }
}

export function drawSelection(ctx: CanvasRenderingContext2D, A: Vehicle, cam: Camera, pal: Palette) {
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = Math.max(0.4, 2 / cam.zoom);
  ctx.beginPath();
  ctx.arc(A.x, A.y, Math.max(A.p.length * 0.9, 9 / cam.zoom), 0, Math.PI * 2);
  ctx.stroke();
}
