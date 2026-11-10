/** Bundled OpenStreetMap road dataset (built by scripts/osm/build_roads.py). */
export type RawEdge = [
  from: number,
  to: number,
  cls: number,
  oneway: number,
  speedKmh: number,
  lanes: number,
  nameIdx: number,
  pts: number[],
];

export interface RoadDataset {
  attribution: string;
  origin: [number, number];
  kx: number;
  ky: number;
  bbox: [number, number, number, number];
  fetchedAt: string;
  nodes: [number, number, number][];
  edges: RawEdge[];
  names: string[];
}

/** Relative to the Vite base path, so the file also resolves under a GitHub Pages subpath. */
export async function loadChennaiRoads(): Promise<RoadDataset> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/chennai-roads.json`);
  if (!res.ok) throw new Error(`Road data failed to load (${res.status})`);
  return (await res.json()) as RoadDataset;
}

/** Lat/lon to the dataset's local metre grid (y grows southwards). */
export function project(ds: Pick<RoadDataset, "origin" | "kx" | "ky">, lat: number, lon: number) {
  return { x: (lon - ds.origin[1]) * ds.kx, y: -(lat - ds.origin[0]) * ds.ky };
}
