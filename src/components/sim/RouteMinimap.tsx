import { Panel, PanelTitle } from "./Panel";

const LEVEL_COLOR = ["var(--route-free)", "var(--route-slow)", "var(--route-jam)"];

export function RouteMinimap({ path, color }: { path: { pts: number[]; level: 0 | 1 | 2 }[]; color: string }) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of path)
    for (let i = 0; i < e.pts.length; i += 2) {
      minX = Math.min(minX, e.pts[i]!); maxX = Math.max(maxX, e.pts[i]!);
      minY = Math.min(minY, e.pts[i + 1]!); maxY = Math.max(maxY, e.pts[i + 1]!);
    }
  if (!path.length) return null;
  const pad = Math.max(maxX - minX, maxY - minY, 50) * 0.08;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;
  const sw = Math.max(maxX - minX, maxY - minY, 50) / 60;
  const first = path[0]!.pts, last = path[path.length - 1]!.pts;
  const toStr = (p: number[]) => p.reduce((s, v, i) => s + (i % 2 ? `,${v} ` : `${v}`), "");
  return (
    <Panel className="w-[340px] p-3">
      <PanelTitle>Journey</PanelTitle>
      <svg viewBox={vb} className="h-48 w-full rounded bg-muted">
        {path.map((e, i) => (
          <polyline key={i} points={toStr(e.pts)} fill="none" stroke={LEVEL_COLOR[e.level]} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        <circle cx={first[0]} cy={first[1]} r={sw * 1.6} fill={color} stroke="var(--background)" strokeWidth={sw / 2} />
        <circle cx={last[last.length - 2]} cy={last[last.length - 1]} r={sw * 1.6} fill="var(--route-jam)" stroke="var(--background)" strokeWidth={sw / 2} />
      </svg>
      <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
        <span><span className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: LEVEL_COLOR[0] }} />Free</span>
        <span><span className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: LEVEL_COLOR[1] }} />Slow</span>
        <span><span className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: LEVEL_COLOR[2] }} />Jammed</span>
      </div>
    </Panel>
  );
}
