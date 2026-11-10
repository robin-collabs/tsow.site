import { useEffect, useRef, type RefObject } from "react";
import { zoomAt, type Camera } from "@/rendering/camera";

/** Drag to pan, wheel / trackpad pinch to zoom at the cursor, tap to select. */
export function useMapInput(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  camRef: RefObject<Camera>,
  onTap: (sx: number, sy: number) => void,
  onPan?: () => void,
) {
  const tapRef = useRef(onTap);
  tapRef.current = onTap;
  const panRef = useRef(onPan);
  panRef.current = onPan;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;

    const down = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const cam = camRef.current;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved >= 5) panRef.current?.();
      cam.cx -= dx / cam.zoom;
      cam.cy -= dy / cam.zoom;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = "grab";
      if (moved < 5) {
        const r = el.getBoundingClientRect();
        tapRef.current(e.clientX - r.left, e.clientY - r.top);
      }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = camRef.current;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const r = el.getBoundingClientRect();
      zoomAt(cam, cam.zoom * Math.exp(-dy * 0.0015), e.clientX - r.left, e.clientY - r.top, r.width, r.height);
    };

    el.style.cursor = "grab";
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [canvasRef, camRef]);
}
