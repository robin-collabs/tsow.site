import { useEffect, useState } from "react";

const FACTS = [
  "Anna Salai carries over a lakh vehicles a day.",
  "Kathipara is one of Asia's largest cloverleaf interchanges.",
  "Chennai drives on the left — so do our autonomous drivers.",
  "Auto rickshaws here weave between lanes; ours do too.",
  "OMR and ECR are the city's southern traffic arteries.",
];

function stage(p: number) {
  if (p < 80) return "Fetching real Chennai roads";
  if (p < 95) return "Building the road network & signals";
  return "Spawning cars, bikes, autos and trucks";
}

export function LoadingScreen({ pct }: { pct: number }) {
  const [fact, setFact] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFact((f) => (f + 1) % FACTS.length), 2500);
    return () => clearInterval(t);
  }, []);
  const p = Math.round(pct);
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <h1 className="text-3xl font-bold">
        Chennai <span className="text-primary">Traffic Sim</span>
      </h1>
      <div className="w-full max-w-sm">
        <div className="relative h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${p}%` }} />
          <span className="absolute top-1/2 -translate-y-1/2 text-xs transition-[left] duration-300" style={{ left: `calc(${p}% - 10px)` }}>🛺</span>
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{stage(p)}…</span>
          <span>{p}%</span>
        </div>
      </div>
      <p key={fact} className="max-w-sm animate-in fade-in text-sm text-muted-foreground">{FACTS[fact]}</p>
    </div>
  );
}
