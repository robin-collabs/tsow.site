import { Maximize2, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMapInput } from "@/controls/useMapInput";
import { loadSettings, saveSettings } from "@/controls/settings-storage";
import type { RoadDataset } from "@/geographic/dataset";
import { ZONES, zoneBoundsM, type ZoneId } from "@/geographic/zones";
import type { RoadGraph } from "@/road-network/graph";
import { buildZoneNetwork, type ZoneNetwork } from "@/road-network/zone-network";
import { fitBounds, screenToWorld, zoomAt, type Camera } from "@/rendering/camera";
import { readPalette } from "@/rendering/palette";
import { Renderer } from "@/rendering/renderer";
import { Simulation, type SimStats } from "@/simulation/engine";
import { DEFAULT_SETTINGS, MAX_VEHICLES, clampVehicleCount, type SimSettings } from "@/simulation/settings";
import type { SignalSystem } from "@/simulation/signals";
import type { VehicleType } from "@/vehicles/types";
import { DRIVE_STATE_LABEL, type Vehicle } from "@/vehicles/vehicle";
import { ControlPanel } from "./ControlPanel";
import { LegendPanel } from "./LegendPanel";
import { Panel } from "./Panel";
import { SettingsPanel } from "./SettingsPanel";
import { StatsPanel } from "./StatsPanel";
import { VehicleInspector, type SelectedInfo } from "./VehicleInspector";

export interface World {
  ds: RoadDataset;
  graph: RoadGraph;
  signals: SignalSystem;
  nets: Map<ZoneId, ZoneNetwork>;
}

const STEP = 1 / 30;
const START_ZONE: ZoneId = "central";

function describe(sim: Simulation, v: Vehicle): SelectedInfo {
  const E = sim.graph.edges[v.route[v.ri]!]!;
  return {
    id: v.id,
    type: v.type,
    label: v.p.label,
    color: v.color,
    speedKmh: v.v * 3.6,
    road: E.name || "Unnamed road",
    state: DRIVE_STATE_LABEL[v.state],
    lane: v.lane,
    lanes: E.lanes,
    remainingKm: sim.remainingKm(v),
    trips: v.trips,
  };
}

export function SimulatorView({ world }: { world: World }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef<Camera>({ cx: 0, cy: 0, zoom: 0.1 });
  const simRef = useRef<Simulation | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const zoneRef = useRef<ZoneId>(START_ZONE);
  const seedRef = useRef(1);

  const [running, setRunning] = useState(true);
  const runningRef = useRef(running);
  runningRef.current = running;
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const [hidden, setHidden] = useState<Set<VehicleType>>(() => new Set());
  const hiddenRef = useRef(hidden);
  hiddenRef.current = hidden;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  const [zoneId, setZoneId] = useState<ZoneId>(START_ZONE);
  const [settings, setSettings] = useState<SimSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<SimStats | null>(null);
  const [selected, setSelected] = useState<SelectedInfo | null>(null);

  const getNet = useCallback(
    (id: ZoneId) => {
      let n = world.nets.get(id);
      if (!n) {
        n = buildZoneNetwork(world.graph, zoneBoundsM(world.ds, ZONES.find((z) => z.id === id)!));
        world.nets.set(id, n);
      }
      return n;
    },
    [world],
  );

  const zoneBounds = useCallback(
    (id: ZoneId) => zoneBoundsM(world.ds, ZONES.find((z) => z.id === id)!),
    [world],
  );

  // Simulation + render loop. Simulation steps at a fixed 30 Hz; drawing runs every frame.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const saved = loadSettings();
    setSettings(saved);
    const sim = new Simulation(world.graph, world.signals, getNet(START_ZONE), saved, seedRef.current);
    simRef.current = sim;
    const renderer = new Renderer(world.graph, world.signals, readPalette());
    let fitted = false;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (!fitted && w > 0 && h > 0) {
        fitBounds(camRef.current, zoneBounds(START_ZONE), w, h);
        fitted = true;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let lastUi = 0;
    let readyMarked = false;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (runningRef.current) {
        acc += dt * speedRef.current;
        let n = 0;
        while (acc >= STEP && n < 12) {
          sim.step(STEP);
          acc -= STEP;
          n++;
        }
        if (n === 12) acc = 0;
      }
      const { w, h, dpr } = sizeRef.current;
      const zone = zoneRef.current === "overview" ? null : zoneBounds(zoneRef.current);
      renderer.draw(ctx, camRef.current, w, h, dpr, sim, {
        hidden: hiddenRef.current,
        selectedId: selectedRef.current,
        zone,
      });
      if (!readyMarked) {
        wrap.dataset.sceneReady = "true";
        readyMarked = true;
      }
      if (now - lastUi > 250) {
        lastUi = now;
        setStats(sim.stats());
        const sid = selectedRef.current;
        if (sid != null) {
          const v = sim.find(sid);
          if (v) setSelected(describe(sim, v));
          else {
            setSelected(null);
            setSelectedId(null);
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      simRef.current = null;
    };
  }, [world, getNet, zoneBounds]);

  useMapInput(canvasRef, camRef, (sx, sy) => {
    const sim = simRef.current;
    if (!sim) return;
    const { w, h } = sizeRef.current;
    const cam = camRef.current;
    const p = screenToWorld(cam, sx, sy, w, h);
    let best: Vehicle | null = null;
    let bd = Math.max(16 / cam.zoom, 4);
    for (const v of sim.vehicles) {
      if (hiddenRef.current.has(v.type)) continue;
      const d = Math.hypot(v.x - p.x, v.y - p.y);
      if (d < bd) {
        bd = d;
        best = v;
      }
    }
    setSelectedId(best ? best.id : null);
    setSelected(best ? describe(sim, best) : null);
  });

  const changeZone = (id: ZoneId) => {
    setZoneId(id);
    zoneRef.current = id;
    seedRef.current += 1;
    simRef.current?.reset(getNet(id), seedRef.current);
    const { w, h } = sizeRef.current;
    fitBounds(camRef.current, zoneBounds(id), w, h);
    setSelectedId(null);
    setSelected(null);
  };

  const reset = () => {
    seedRef.current += 1;
    simRef.current?.reset(undefined, seedRef.current);
    setSelectedId(null);
    setSelected(null);
  };

  const updateSettings = (s: SimSettings) => {
    setSettings(s);
    if (simRef.current) simRef.current.settings = s;
    saveSettings(s);
  };

  const spawn = (t: VehicleType) => {
    const sim = simRef.current;
    if (!sim || sim.vehicles.length >= MAX_VEHICLES) return;
    if (sim.spawnType(t)) updateSettings({ ...settings, vehicleCount: clampVehicleCount(sim.vehicles.length) });
  };

  const zoomBy = (f: number) => {
    const { w, h } = sizeRef.current;
    zoomAt(camRef.current, camRef.current.zoom * f, w / 2, h / 2, w, h);
  };

  return (
    <div ref={wrapRef} className="relative h-screen w-screen overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      <div className="pointer-events-none absolute inset-0 flex justify-between p-3">
        <div className="flex flex-col justify-between gap-3">
          <ControlPanel
            running={running}
            speed={speed}
            zoneId={zoneId}
            onToggle={() => setRunning((r) => !r)}
            onReset={reset}
            onSpeed={setSpeed}
            onZone={changeZone}
          />
          <LegendPanel
            hidden={hidden}
            canSpawn={(stats?.total ?? 0) < MAX_VEHICLES}
            onToggle={(t) =>
              setHidden((h) => {
                const n = new Set(h);
                if (n.has(t)) n.delete(t);
                else n.add(t);
                return n;
              })
            }
            onSpawn={spawn}
            fetchedAt={world.ds.fetchedAt}
          />
        </div>
        <div className="flex flex-col items-end justify-between gap-3">
          <div className="flex flex-col items-end gap-3">
            <StatsPanel stats={stats} running={running} speed={speed} />
            <SettingsPanel settings={settings} onChange={updateSettings} />
          </div>
          <div className="flex items-end gap-3">
            {selected && (
              <VehicleInspector
                info={selected}
                onClose={() => {
                  setSelectedId(null);
                  setSelected(null);
                }}
              />
            )}
            <Panel className="flex flex-col p-1">
              <button onClick={() => zoomBy(1.4)} className="rounded p-2 hover:bg-accent" aria-label="Zoom in">
                <Plus className="size-4" />
              </button>
              <button onClick={() => zoomBy(1 / 1.4)} className="rounded p-2 hover:bg-accent" aria-label="Zoom out">
                <Minus className="size-4" />
              </button>
              <button
                onClick={() => {
                  const { w, h } = sizeRef.current;
                  fitBounds(camRef.current, zoneBounds(zoneId), w, h);
                }}
                className="rounded p-2 hover:bg-accent"
                aria-label="Fit zone"
              >
                <Maximize2 className="size-4" />
              </button>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
