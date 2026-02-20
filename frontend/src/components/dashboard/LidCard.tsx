"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SensorReading } from "@/lib/api";
import { statusBg, gaugeColor, timeAgo, statusDot } from "@/lib/helpers";

interface LidCardProps {
    data: SensorReading;
}

export function LidCard({ data }: LidCardProps) {
    const pct = data.water_level.value.toFixed(1);
    const loc = data.location ?? {};
    const meta = data.sensor_meta ?? {};

    return (
        <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-5 transition-all duration-300 hover:border-border hover:shadow-lg group">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold tracking-wide text-foreground">
                    {data.lid_id}
                </span>
                <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-2.5 py-0.5 ${statusBg(data.status)}`}
                >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${statusDot(data.status)} ${data.status === "CRITICAL" ? "animate-pulse" : ""}`} />
                    {data.status}
                </Badge>
            </div>

            {/* Location */}
            <p className="text-xs text-muted-foreground mb-4">
                📍 {loc.area || "—"}, {loc.city || "—"}
            </p>

            {/* Water Level */}
            <div className="mb-3">
                <div className="flex items-end justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Water Level</span>
                    <span className={`text-lg font-bold tabular-nums ${data.status === "CRITICAL" ? "text-red-400" :
                            data.status === "WARNING" ? "text-amber-400" : "text-emerald-400"
                        }`}>
                        {pct}%
                    </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${gaugeColor(data.status)}`}
                        style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
                    />
                </div>
            </div>

            {/* Sensor Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                <span>🔋 {meta.battery_level ?? "—"}%</span>
                <span className="text-border">•</span>
                <span>📶 {meta.signal_strength ?? "—"}</span>
                <span className="text-border">•</span>
                <span>{meta.sensor_type ?? "—"}</span>
            </div>

            {/* Updated timestamp */}
            <p className="text-[11px] text-muted-foreground/60 mt-2">
                Updated {timeAgo(data.timestamp)}
            </p>
        </Card>
    );
}
