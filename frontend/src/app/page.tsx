"use client";

import { useEffect, useState } from "react";
import { useSocketData } from "@/components/SocketProvider";
import { StatCards } from "@/components/dashboard/StatCards";
import { MapView } from "@/components/dashboard/MapView";
import { LidGrid } from "@/components/dashboard/LidGrid";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const { connected, lids, alerts } = useSocketData();
  const [clock, setClock] = useState("");

  // Live clock
  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-IN", { hour12: false }) +
        " — " +
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Compute stats
  const arr = Object.values(lids);
  const counts = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
  arr.forEach((d) => {
    counts[d.status] = (counts[d.status] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-lg">
              💧
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">EcoSpark</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Smart Sewage Monitoring System
              </p>
            </div>
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              SDG 11
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`}
              />
              <span>{connected ? "Live" : "Connecting..."}</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono tabular-nums" suppressHydrationWarning>
              {clock}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <StatCards
          total={arr.length}
          normal={counts.NORMAL}
          warning={counts.WARNING}
          critical={counts.CRITICAL}
        />

        <Separator className="opacity-30" />

        {/* Section: Map View */}
        <section>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4 flex items-center gap-2">
            🗺️ Sensor Map
          </h2>
          <div className="h-[420px]">
            <MapView lids={lids} />
          </div>
        </section>

        <Separator className="opacity-30" />

        {/* Section: Live Sensor Status */}
        <section>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4 flex items-center gap-2">
            📡 Live Sensor Status
          </h2>
          <LidGrid lids={lids} />
        </section>

        <Separator className="opacity-30" />

        {/* Section: Alerts + History side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <AlertPanel alerts={alerts} />
          </div>
          <div className="lg:col-span-3">
            <HistoryTable lids={lids} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-8">
        <div className="max-w-[1400px] mx-auto px-6 py-4 text-center text-[11px] text-muted-foreground/50">
          EcoSpark v2.0 · SDG 11 · Smart Sewage Monitoring System
        </div>
      </footer>
    </div>
  );
}
