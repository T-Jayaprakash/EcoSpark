"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SensorReading } from "@/lib/api";

interface LidReport {
    lid_id: string;
    water_level_percentage: number;
    status: string;
    confidence: string;
    priority: string;
    anomaly_flag: boolean;
    report: string;
    cleaning_schedule: string;
    next_action: string;
    weather_impact: string;
    source: string;
    timestamp: string;
}

interface LidReportPanelProps {
    lids: Record<string, SensorReading>;
}

const priorityColor: Record<string, string> = {
    HIGH: "bg-red-500/10 text-red-600 border-red-500/30",
    MEDIUM: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    LOW: "bg-green-500/10 text-green-600 border-green-500/30",
};

const statusColor: Record<string, string> = {
    CRITICAL: "bg-red-500/10 text-red-600 border-red-500/30",
    WARNING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    NORMAL: "bg-green-500/10 text-green-600 border-green-500/30",
};

export function LidReportPanel({ lids }: LidReportPanelProps) {
    const [reports, setReports] = useState<Record<string, LidReport>>({});
    const [activeLid, setActiveLid] = useState<string | null>(null);
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const lidIds = Object.keys(lids).sort();

    const fetchReport = useCallback(async (lidId: string) => {
        const d = lids[lidId];
        if (!d) return;

        setLoading((prev) => ({ ...prev, [lidId]: true }));

        try {
            const res = await fetch("http://localhost:3003/api/raw-sensor-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lid_id: lidId,
                    distance_cm: Math.round(100 - d.water_level.value),
                    manhole_depth_cm: 100,
                    temperature_c: 30,
                    signal_quality: d.sensor_meta?.signal_strength || "GOOD",
                    timestamp: d.timestamp,
                }),
            });
            const result = await res.json();
            if (result.data) {
                setReports((prev) => ({ ...prev, [lidId]: result.data }));
            }
        } catch (err) {
            console.error(`Failed to fetch report for ${lidId}:`, err);
        } finally {
            setLoading((prev) => ({ ...prev, [lidId]: false }));
        }
    }, [lids]);

    // Auto-fetch report when a lid is selected
    useEffect(() => {
        if (activeLid && !reports[activeLid]) {
            fetchReport(activeLid);
        }
    }, [activeLid, reports, fetchReport]);

    // Set first lid as active by default
    useEffect(() => {
        if (!activeLid && lidIds.length > 0) {
            setActiveLid(lidIds[0]);
        }
    }, [lidIds, activeLid]);

    const activeReport = activeLid ? reports[activeLid] : null;
    const activeData = activeLid ? lids[activeLid] : null;

    return (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    🤖 AI-Powered Lid Analysis Reports
                </h2>
            </div>

            <div className="flex min-h-[400px]">
                {/* Lid selector sidebar */}
                <div className="w-48 border-r border-border/30 overflow-y-auto">
                    {lidIds.map((lidId) => {
                        const d = lids[lidId];
                        const isActive = activeLid === lidId;
                        const hasReport = !!reports[lidId];
                        return (
                            <button
                                key={lidId}
                                onClick={() => setActiveLid(lidId)}
                                className={`w-full px-4 py-3 text-left border-b border-border/20 transition-colors ${isActive
                                        ? "bg-blue-500/5 border-l-2 border-l-blue-500"
                                        : "hover:bg-muted/30"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold truncate">
                                        {lidId}
                                    </span>
                                    <span
                                        className={`w-2 h-2 rounded-full ${d?.status === "CRITICAL"
                                                ? "bg-red-500 animate-pulse"
                                                : d?.status === "WARNING"
                                                    ? "bg-yellow-500"
                                                    : "bg-green-500"
                                            }`}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                    {d?.location?.area || "—"}
                                </p>
                                {hasReport && (
                                    <span className="text-[9px] text-blue-500 font-semibold mt-0.5 block">
                                        Report ready
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Report content */}
                <div className="flex-1 p-5 overflow-y-auto">
                    {!activeLid ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            Select a lid to view its analysis report
                        </div>
                    ) : loading[activeLid] ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">
                                Analyzing {activeLid}...
                            </p>
                            <p className="text-[10px] text-muted-foreground/60">
                                LLM is processing sensor + weather data
                            </p>
                        </div>
                    ) : activeReport ? (
                        <div className="space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">
                                        {activeReport.lid_id}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {activeData?.location?.area || "—"} ·{" "}
                                        {new Date(
                                            activeReport.timestamp
                                        ).toLocaleString("en-IN")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`text-[11px] font-bold ${statusColor[activeReport.status] ||
                                            statusColor.NORMAL
                                            }`}
                                    >
                                        {activeReport.status}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={`text-[11px] font-bold ${priorityColor[
                                            activeReport.priority
                                            ] || priorityColor.LOW
                                            }`}
                                    >
                                        {activeReport.priority} Priority
                                    </Badge>
                                </div>
                            </div>

                            {/* Quick stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-muted/30 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold tabular-nums">
                                        {activeReport.water_level_percentage}%
                                    </p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                        Water Level
                                    </p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-3 text-center">
                                    <p className="text-sm font-bold">
                                        {activeReport.confidence}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                        Confidence
                                    </p>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-3 text-center">
                                    <p className="text-sm font-bold">
                                        {activeReport.source === "ollama_analyst"
                                            ? "Ollama AI"
                                            : "Local"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                        Source
                                    </p>
                                </div>
                            </div>

                            {/* Key sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Next Action */}
                                {activeReport.next_action && (
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                                        <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">
                                            Next Action
                                        </p>
                                        <p className="text-sm text-foreground">
                                            {activeReport.next_action}
                                        </p>
                                    </div>
                                )}

                                {/* Cleaning Schedule */}
                                {activeReport.cleaning_schedule && (
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                                        <p className="text-[10px] font-bold uppercase text-amber-600 mb-1">
                                            Cleaning Schedule
                                        </p>
                                        <p className="text-sm text-foreground">
                                            {activeReport.cleaning_schedule}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Weather Impact */}
                            {activeReport.weather_impact && (
                                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                                    <p className="text-[10px] font-bold uppercase text-cyan-600 mb-1">
                                        🌤️ Weather Impact
                                    </p>
                                    <p className="text-sm text-foreground">
                                        {activeReport.weather_impact}
                                    </p>
                                </div>
                            )}

                            {/* Full report */}
                            <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-3">
                                    Full Analysis Report
                                </p>
                                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono text-[12px]">
                                    {activeReport.report}
                                </div>
                            </div>

                            {/* Refresh button */}
                            <button
                                onClick={() => fetchReport(activeLid)}
                                disabled={loading[activeLid]}
                                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading[activeLid]
                                    ? "Re-analyzing..."
                                    : "🔄 Refresh Analysis"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <p className="text-sm text-muted-foreground">
                                No report generated yet for{" "}
                                <strong>{activeLid}</strong>
                            </p>
                            <button
                                onClick={() => fetchReport(activeLid)}
                                disabled={loading[activeLid]}
                                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                Generate Report
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
