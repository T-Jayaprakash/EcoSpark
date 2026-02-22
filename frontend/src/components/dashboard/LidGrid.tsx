"use client";

import type { SensorReading } from "@/lib/api";
import { LidCard } from "./LidCard";

import { Radio } from "lucide-react";

interface LidGridProps {
    lids: Record<string, SensorReading>;
}

export function LidGrid({ lids }: LidGridProps) {
    const arr = Object.values(lids).sort((a, b) =>
        a.lid_id.localeCompare(b.lid_id)
    );

    if (!arr.length) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                    <Radio size={32} className="text-slate-200" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Matrix Offline: No Active Telemetry</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">Initialize simulator to stream live diagnostics</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {arr.map((d) => (
                <LidCard key={d.lid_id} data={d} />
            ))}
        </div>
    );
}
