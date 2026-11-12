import type { SelectedInfo } from "./VehicleInspector";
import { Panel } from "./Panel";

const LEVEL_COLOR = ["var(--route-free)", "var(--route-slow)", "var(--route-jam)"];
const VIEW = 400; // metres shown around the vehicle

/** Heading-up navigation view: the vehicle points up, the map turns with it. */
export function RouteMinimap({ info }: { info: SelectedInfo }) {
  const deg = (-info.heading * 180) / Math.PI - 90;
  const toStr = (p: number[]) => p.reduce((s, v, i) => s + (i % 2 ? `,${v} ` : `${v}`), "");
  const sw = VIEW / 45;
  return (
    <Panel className="w-[340px] overflow-hidden p-0">
      <div className="relative h-52 bg-muted">
        <svg viewBox={`${-VIEW / 2} ${-VIEW * 0.7} ${VIEW} ${VIEW}`} className="absolute inset-0 h-full w-full">
          <g transform={`rotate(${deg}) translate(${-info.x} ${-info.y})`}>
            {info.path.map((e, i) => (
              <polyline key={i} points={toStr(e.pts)} fill="none" stroke={LEVEL_COLOR[e.level]} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </g>
          <path d={`M0 ${-sw * 1.6} L${sw * 1.1} ${sw * 1.2} L0 ${sw * 0.5} L${-sw * 1.1} ${sw * 1.2} Z`} fill="var(--route-free)" stroke="var(--background)" strokeWidth={sw / 3} />
        </svg>
        <div className="absolute left-1/2 top-2 max-w-[90%] -translate-x-1/2 truncate rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg">
          {info.road}
        </div>
      </div>
      <div className="flex items-baseline justify-between px-3 py-2">
        <span className="text-lg font-semibold">{Math.max(1, Math.round(info.etaMin))} min</span>
        <span className="font-mono text-sm text-muted-foreground">{info.remainingKm.toFixed(1)} km</span>
      </div>
    </Panel>
  );
}
