import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  DENSITY_PRESETS,
  MAX_VEHICLES,
  MIN_VEHICLES,
  clampVehicleCount,
  type SimSettings,
} from "@/simulation/settings";
import { VEHICLE_ORDER, VEHICLE_TYPES } from "@/vehicles/types";
import { Panel, PanelTitle } from "./Panel";

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: SimSettings;
  onChange: (s: SimSettings) => void;
}) {
  const [open, setOpen] = useState(true);
  const total = VEHICLE_ORDER.reduce((s, t) => s + settings.mix[t], 0) || 1;
  return (
    <Panel className="w-[240px] p-3">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen((o) => !o)}>
        <PanelTitle>Traffic settings</PanelTitle>
        {open ? <ChevronUp className="mb-2 size-3.5" /> : <ChevronDown className="mb-2 size-3.5" />}
      </button>
      {open && (
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted-foreground">Vehicle count</span>
              <span className="font-mono">{settings.vehicleCount}</span>
            </div>
            <Slider
              min={MIN_VEHICLES}
              max={MAX_VEHICLES}
              step={1}
              value={[settings.vehicleCount]}
              onValueChange={([v]) =>
                onChange({ ...settings, vehicleCount: clampVehicleCount(v ?? settings.vehicleCount) })
              }
              aria-label="Vehicle count"
            />
            <div className="mt-2 grid grid-cols-3 gap-1">
              {DENSITY_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => onChange({ ...settings, vehicleCount: p.count })}
                  className={cn(
                    "rounded px-1 py-1 text-[11px] transition-colors",
                    settings.vehicleCount === p.count
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-accent",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-muted-foreground">Vehicle mix</div>
            <div className="space-y-2">
              {VEHICLE_ORDER.map((t) => (
                <div key={t}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span>{VEHICLE_TYPES[t].plural}</span>
                    <span className="font-mono text-muted-foreground">
                      {Math.round((settings.mix[t] / total) * 100)}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[settings.mix[t]]}
                    onValueChange={([v]) =>
                      onChange({ ...settings, mix: { ...settings.mix, [t]: v ?? 0 } })
                    }
                    aria-label={`${VEHICLE_TYPES[t].plural} share`}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
              Mix applies to newly spawned vehicles. Press Reset to respawn everyone.
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}
