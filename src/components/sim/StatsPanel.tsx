import type { SimStats } from "@/simulation/engine";
import { VEHICLE_ORDER, VEHICLE_TYPES } from "@/vehicles/types";
import { Panel, PanelTitle } from "./Panel";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function fmtTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function StatsPanel({ stats, running, speed }: { stats: SimStats | null; running: boolean; speed: number }) {
  return (
    <Panel className="w-[220px] p-3">
      <PanelTitle>Live stats</PanelTitle>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium">
        <span
          className={`inline-block h-2 w-2 rounded-full ${running ? "bg-primary animate-pulse" : "bg-muted-foreground"}`}
        />
        {running ? "Running" : "Paused"} · {speed}× · {fmtTime(stats?.time ?? 0)}
      </div>
      <div className="space-y-1">
        <Row label="Vehicles" value={String(stats?.total ?? 0)} />
        {VEHICLE_ORDER.map((t) => (
          <Row key={t} label={`  ${VEHICLE_TYPES[t].plural}`} value={String(stats?.counts[t] ?? 0)} />
        ))}
        <Row label="Avg speed" value={`${(stats?.avgSpeedKmh ?? 0).toFixed(1)} km/h`} />
        <Row label="Density" value={`${(stats?.density ?? 0).toFixed(2)} veh/lane-km`} />
        <Row label="Stopped" value={String(stats?.stopped ?? 0)} />
        <Row label="Trips done" value={String(stats?.trips ?? 0)} />
        <Row label="Recoveries" value={String(stats?.recoveries ?? 0)} />
      </div>
    </Panel>
  );
}
