"use client";

import type { SensorReading } from "@/lib/api";
import { LidCard } from "./LidCard";

interface LidGridProps {
    lids: Record<string, SensorReading>;
}

export function LidGrid({ lids }: LidGridProps) {
    const arr = Object.values(lids).sort((a, b) =>
        a.lid_id.localeCompare(b.lid_id)
    );

    if (!arr.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <span className="text-4xl mb-3">📡</span>
                <p className="text-sm">No sensor data yet — start the simulator to see live readings.</p>
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
