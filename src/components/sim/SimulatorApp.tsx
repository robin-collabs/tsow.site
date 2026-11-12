import { useEffect, useState } from "react";
import { loadChennaiRoads } from "@/geographic/dataset";
import { buildGraph } from "@/road-network/graph";
import { mulberry32 } from "@/simulation/random";
import { SignalSystem } from "@/simulation/signals";
import { SimulatorView, type World } from "./SimulatorView";
import { LoadingScreen } from "./LoadingScreen";

export function SimulatorApp() {
  const [world, setWorld] = useState<World | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pct, setPct] = useState(3);

  useEffect(() => {
    let alive = true;
    loadChennaiRoads((f) => alive && setPct(5 + f * 75))
      .then(async (ds) => {
        if (!alive) return;
        setPct(85);
        await new Promise((r) => setTimeout(r, 30));
        const graph = buildGraph(ds);
        const signals = new SignalSystem(graph, mulberry32(7));
        setPct(100);
        setWorld({ ds, graph, signals, nets: new Map() });
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">The Chennai road map didn't load</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  if (!world) return <LoadingScreen pct={pct} />;
  return <SimulatorView world={world} />;
}
