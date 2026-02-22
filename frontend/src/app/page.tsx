"use client";

import { useEffect, useState } from "react";
import { useSocketData } from "@/components/SocketProvider";
import { StatCards } from "@/components/dashboard/StatCards";
import { MapView } from "@/components/dashboard/MapView";
import { LidGrid } from "@/components/dashboard/LidGrid";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { WeatherPanel } from "@/components/dashboard/WeatherPanel";
import { LidReportPanel } from "@/components/dashboard/LidReportPanel";
import { LayoutGrid, Map as MapIcon, BarChart3, Settings, Activity, ShieldAlert } from "lucide-react";

export default function DashboardPage() {
  const { connected, lids, alerts } = useSocketData();
  const [clock, setClock] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("en-IN", { hour12: false }) +
        " • " +
        now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const arr = Object.values(lids);
  const counts = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
  arr.forEach((d) => {
    counts[d.status] = (counts[d.status] || 0) + 1;
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-cyan-500/30">

      {/* Premium Mini Sidebar (Light Theme) */}
      <aside className="w-20 hidden md:flex flex-col items-center py-8 gap-10 border-r border-slate-200 bg-white sticky top-0 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_8px_16px_rgba(6,182,212,0.25)]">
          <Activity size={24} />
        </div>

        <div className="mt-auto">
          <div className="w-10 h-10 rounded-full border border-slate-200 p-0.5 hover:border-cyan-500 cursor-pointer transition-all">
            <img src="/mkce-logo.png" className="rounded-full" alt="User" />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative">
        {/* Background Decorative Image */}
        <div className="absolute top-0 right-0 w-full h-[500px] pointer-events-none opacity-[0.4] overflow-hidden">
          <img src="/hero-bg.png" className="w-full h-full object-cover object-right-top mask-linear-b" alt="" />
        </div>

        {/* Premium Header */}
        <header className="h-24 sticky top-0 z-50 px-8 flex items-center justify-between backdrop-blur-md border-b border-slate-200 bg-white/80">
          <div>
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 text-slate-900">
              EcoSpark <span className="text-cyan-600">•</span> <span className="text-slate-400">MKCE</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
              Infrastructure Intelligence Platform
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-full px-5 py-2 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse" : "bg-red-500"}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{connected ? "System Active" : "Offline"}</span>
            </div>
            <div className="text-[11px] font-black font-mono text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              {clock}
            </div>
          </div>
        </header>

        {/* Dash Scroll Area */}
        <main className="p-8 space-y-10 max-w-[1600px] mx-auto w-full relative z-10">

          {/* Section 1: Key Metrics */}
          <StatCards
            total={arr.length}
            normal={counts.NORMAL}
            warning={counts.WARNING}
            critical={counts.CRITICAL}
          />

          {/* Section 2: Environment & Analytics */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-600">Campus Sensor Map</h2>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              <div className="h-[430px] rounded-3xl overflow-hidden border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] bg-white">
                <MapView lids={lids} />
              </div>
            </div>
            <div className="xl:col-span-4 space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Environmental Data</h2>
              </div>
              <WeatherPanel />
            </div>
          </div>

          {/* Section 3: Sensor Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Active Node Matrix</h2>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <LidGrid lids={lids} />
          </div>

          {/* Section 4: Telemetry & Log stream */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <AlertPanel alerts={alerts} />
            </div>
            <div className="lg:col-span-8">
              <HistoryTable lids={lids} />
            </div>
          </div>

          {/* Section 5: Intelligence Insights */}
          <LidReportPanel lids={lids} />

        </main>

        <footer className="p-8 border-t border-slate-200 bg-white text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            © 2026 EcoSpark Engineering • Karur Campus Operation
          </p>
        </footer>
      </div>
    </div>
  );
}
