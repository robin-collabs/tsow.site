import { Eye, EyeOff, Plus } from "lucide-react";
import { VEHICLE_ORDER, VEHICLE_TYPES, type VehicleType } from "@/vehicles/types";
import { Panel, PanelTitle } from "./Panel";

interface Props {
  hidden: Set<VehicleType>;
  canSpawn: boolean;
  onToggle: (t: VehicleType) => void;
  onSpawn: (t: VehicleType) => void;
  fetchedAt: string;
}

export function LegendPanel({ hidden, canSpawn, onToggle, onSpawn, fetchedAt }: Props) {
  return (
    <Panel className="w-[240px] p-3">
      <PanelTitle>Vehicles</PanelTitle>
      <div className="space-y-1">
        {VEHICLE_ORDER.map((t) => {
          const p = VEHICLE_TYPES[t];
          const off = hidden.has(t);
          return (
            <div key={t} className="flex items-center gap-2 text-xs">
              {/* swatch colour is vehicle data, matching what is drawn on the map */}
              <span
                className="inline-block h-2.5 rounded-sm"
                style={{ backgroundColor: p.colors[0], width: `${Math.max(6, p.length * 3)}px` }}
              />
              <span className={off ? "text-muted-foreground line-through" : ""}>{p.label}</span>
              <span className="ml-auto flex gap-0.5">
                <button
                  onClick={() => onToggle(t)}
                  className="rounded p-1 hover:bg-accent"
                  aria-label={`${off ? "Show" : "Hide"} ${p.plural}`}
                >
                  {off ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <button
                  onClick={() => onSpawn(t)}
                  disabled={!canSpawn}
                  className="rounded p-1 hover:bg-accent disabled:opacity-40"
                  aria-label={`Spawn one ${p.label}`}
                >
                  <Plus className="size-3.5" />
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--sim-signal-green)]" /> Signal
        </span>
        <span>Drag to pan · scroll to zoom · click a vehicle</span>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
        Road data ©{" "}
        <a
          className="underline hover:text-foreground"
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap contributors
        </a>{" "}
        (ODbL){fetchedAt ? `, snapshot ${fetchedAt.slice(0, 10)}` : ""}.
      </p>
    </Panel>
  );
}
