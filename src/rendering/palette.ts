/** Canvas colours come from CSS tokens in styles.css (--sim-*), read once at start-up. */
export interface Palette {
  ground: string;
  roadEdge: string;
  road: string;
  marking: string;
  median: string;
  zoneDim: string;
  zoneLine: string;
  accent: string;
  shadow: string;
  glass: string;
  rider: string;
  green: string;
  amber: string;
  red: string;
  label: string;
}

const KEYS: Record<keyof Palette, string> = {
  ground: "--sim-ground",
  roadEdge: "--sim-road-edge",
  road: "--sim-road",
  marking: "--sim-marking",
  median: "--sim-median",
  zoneDim: "--sim-zone-dim",
  zoneLine: "--sim-zone-line",
  accent: "--primary",
  shadow: "--sim-shadow",
  glass: "--sim-glass",
  rider: "--sim-rider",
  green: "--sim-signal-green",
  amber: "--sim-signal-amber",
  red: "--sim-signal-red",
  label: "--foreground",
};

export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const out = {} as Palette;
  for (const k of Object.keys(KEYS) as (keyof Palette)[]) {
    out[k] = cs.getPropertyValue(KEYS[k]).trim() || "#888888";
  }
  return out;
}
