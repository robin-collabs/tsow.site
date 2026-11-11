import { Crosshair, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VehicleType } from "@/vehicles/types";
import { Panel, PanelTitle } from "./Panel";

export interface RouteSeg {
  pts: number[];
  level: 0 | 1 | 2;
  name: string;
  len: number;
}

export interface SelectedInfo {
  id: number;
  type: VehicleType;
  label: string;
  color: string;
  speedKmh: number;
  road: string;
  state: string;
  lane: number;
  lanes: number;
  remainingKm: number;
  trips: number;
  /** remaining route edges with traffic level 0 free, 1 slow, 2 jammed */
  path: RouteSeg[];
  heading: number;
  x: number;
  y: number;
  etaMin: number;
}

export function VehicleInspector({
  info,
  following,
  onFollow,
  onClose,
}: {
  info: SelectedInfo;
  following: boolean;
  onFollow: () => void;
  onClose: () => void;
}) {
  const rows: [string, string][] = [
    ["Speed", `${info.speedKmh.toFixed(0)} km/h`],
    ["Doing", info.state],
    ["Road", info.road],
    ["Lane", `${info.lane + 1} of ${info.lanes}`],
    ["To destination", `${info.remainingKm.toFixed(2)} km`],
    ["Trips done", String(info.trips)],
  ];
  return (
    <Panel className="w-[340px] p-3">
      <div className="flex items-start justify-between">
        <PanelTitle>Selected vehicle</PanelTitle>
        <button onClick={onClose} className="-mt-1 rounded p-1 hover:bg-accent" aria-label="Deselect">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: info.color }} />
        {info.label} <span className="font-mono text-xs text-muted-foreground">#{info.id}</span>
        <Button size="sm" variant={following ? "default" : "secondary"} className="ml-auto h-7" onClick={onFollow}>
          <Crosshair />
          {following ? "Following" : "Follow"}
        </Button>
      </div>
      <div className="space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 text-xs">
            <span className="shrink-0 text-muted-foreground">{k}</span>
            <span className="break-words text-right font-mono">{v}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
