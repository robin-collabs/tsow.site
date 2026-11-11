import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "pointer-events-auto rounded-lg border border-border bg-card/85 text-card-foreground shadow-lg backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </div>
  );
}

import { ChevronDown, ChevronUp } from "lucide-react";

export function CollapseTitle({ open, onToggle, children }: { open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button className="flex w-full items-center justify-between" onClick={onToggle} aria-expanded={open}>
      <PanelTitle>{children}</PanelTitle>
      {open ? <ChevronUp className="mb-2 size-3.5" /> : <ChevronDown className="mb-2 size-3.5" />}
    </button>
  );
}
