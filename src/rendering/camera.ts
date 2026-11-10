import type { BoundsM } from "@/geographic/zones";

export interface Camera {
  cx: number;
  cy: number;
  /** screen pixels per metre */
  zoom: number;
}

export const MIN_ZOOM = 0.02;
export const MAX_ZOOM = 14;

export function fitBounds(cam: Camera, b: BoundsM, w: number, h: number) {
  const bw = Math.max(1, b.maxX - b.minX);
  const bh = Math.max(1, b.maxY - b.minY);
  cam.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(w / bw, h / bh) * 0.92));
  cam.cx = (b.minX + b.maxX) / 2;
  cam.cy = (b.minY + b.maxY) / 2;
}

export function screenToWorld(cam: Camera, sx: number, sy: number, w: number, h: number) {
  return { x: cam.cx + (sx - w / 2) / cam.zoom, y: cam.cy + (sy - h / 2) / cam.zoom };
}

/** Zoom keeping the world point under (sx, sy) fixed on screen. */
export function zoomAt(cam: Camera, next: number, sx: number, sy: number, w: number, h: number) {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
  const world = screenToWorld(cam, sx, sy, w, h);
  cam.zoom = z;
  cam.cx = world.x - (sx - w / 2) / z;
  cam.cy = world.y - (sy - h / 2) / z;
}
