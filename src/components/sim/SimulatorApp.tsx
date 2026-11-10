import { useEffect, useState } from "react";
import { loadChennaiRoads } from "@/geographic/dataset";
import { buildGraph } from "@/road-network/graph";
import { mulberry32 } from "@/simulation/random";
import { SignalSystem } from "@/simulation/signals";
import { SimulatorView, type World } from "./SimulatorView";

export function SimulatorApp() {
  const [world, setWorld] = useState<World | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadChennaiRoads()
      .then((ds) => {
        if (!alive) return;
        const graph = buildGraph(ds);
        const signals = new SignalSystem(graph, mulberry32(7));
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
  if (!world) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">Loading Chennai road network…</p>
      </div>
    );
  }
  return <SimulatorView world={world} />;
}
