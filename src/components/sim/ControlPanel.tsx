import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZONES, type ZoneId } from "@/geographic/zones";
import { cn } from "@/lib/utils";
import { Panel } from "./Panel";

const SPEEDS = [0.5, 1, 2, 4];

interface Props {
  running: boolean;
  speed: number;
  zoneId: ZoneId;
  onToggle: () => void;
  onReset: () => void;
  onSpeed: (s: number) => void;
  onZone: (z: ZoneId) => void;
}

export function ControlPanel({ running, speed, zoneId, onToggle, onReset, onSpeed, onZone }: Props) {
  const zone = ZONES.find((z) => z.id === zoneId)!;
  return (
    <Panel className="w-[320px] p-3">
      <div className="flex items-baseline justify-between">
        <h1 className="text-base font-bold tracking-tight">
          Chennai <span className="text-primary">Traffic Sim</span>
        </h1>
        <span className="font-mono text-[10px] text-muted-foreground">MVP · OSM roads</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1">
        {ZONES.map((z) => (
          <button
            key={z.id}
            onClick={() => onZone(z.id)}
            className={cn(
              "rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors",
              z.id === zoneId
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            {z.name}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{zone.areas}</p>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" onClick={onToggle} className="w-24" aria-label={running ? "Pause" : "Start"}>
          {running ? <Pause /> : <Play />}
          {running ? "Pause" : "Resume"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onReset} aria-label="Reset simulation">
          <RotateCcw />
          Reset
        </Button>
        <div className="ml-auto flex overflow-hidden rounded-md border border-border">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeed(s)}
              className={cn(
                "px-1.5 py-1 font-mono text-[11px] transition-colors",
                s === speed ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}
