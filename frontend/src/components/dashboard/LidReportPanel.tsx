"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SensorReading } from "@/lib/api";
import { Cpu, BrainCircuit, RefreshCw, BarChart, HardDrive, Thermometer, Wifi, ShieldAlert } from "lucide-react";

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

    useEffect(() => {
        if (activeLid && !reports[activeLid]) {
            fetchReport(activeLid);
        }
    }, [activeLid, reports, fetchReport]);

    useEffect(() => {
        if (!activeLid && lidIds.length > 0) {
            setActiveLid(lidIds[0]);
        }
    }, [lidIds, activeLid]);

    const activeReport = activeLid ? reports[activeLid] : null;
    const activeData = activeLid ? lids[activeLid] : null;

    return (
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                <BrainCircuit size={16} className="text-cyan-600" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    AI-Intelligence Diagnostic System
                </h2>
            </div>

            <div className="flex h-[550px]">
                {/* Lid selector sidebar */}
                <div className="w-64 border-r border-slate-100 overflow-y-auto bg-slate-50/20">
                    {lidIds.map((lidId) => {
                        const d = lids[lidId];
                        const isActive = activeLid === lidId;
                        return (
                            <button
                                key={lidId}
                                onClick={() => setActiveLid(lidId)}
                                className={`w-full px-6 py-4 text-left border-b border-slate-50 transition-all ${isActive
                                    ? "bg-white shadow-[inset_4px_0_0_#06b6d4] z-10"
                                    : "hover:bg-slate-50/50"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className={`text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-cyan-600' : 'text-slate-500'}`}>
                                        {lidId}
                                    </span>
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${d?.status === "CRITICAL"
                                            ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                                            : d?.status === "WARNING"
                                                ? "bg-amber-400"
                                                : "bg-emerald-500"
                                            }`}
                                    />
                                </div>
                                <p className={`text-[10px] font-bold truncate leading-tight ${isActive ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {d?.location?.area || "—"}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Report content */}
                <div className="flex-1 p-8 overflow-y-auto bg-white relative">
                    {!activeLid ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
                            <Cpu size={48} className="opacity-10" />
                            <p className="text-[10px] uppercase font-black tracking-widest">Select Node for Deep Scan</p>
                        </div>
                    ) : loading[activeLid] ? (
                        <div className="flex flex-col items-center justify-center h-full gap-5">
                            <div className="relative">
                                <div className="w-12 h-12 border-2 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" />
                                <BrainCircuit size={16} className="absolute inset-0 m-auto text-cyan-500 animate-pulse" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">
                                Parsing Telemetry Matrix...
                            </p>
                        </div>
                    ) : activeReport ? (
                        <div className="space-y-10 max-w-4xl mx-auto">
                            {/* Header */}
                            <div className="flex items-end justify-between border-b border-slate-100 pb-8">
                                <div>
                                    <Badge variant="outline" className="bg-slate-100 text-slate-500 border-0 text-[8px] font-black px-2 py-0.5 mb-3 tracking-[0.1em]">
                                        DIAGNOSTIC ALPHA v2.0
                                    </Badge>
                                    <h3 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                                        {activeReport.lid_id}
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <BarChart size={12} /> {activeData?.location?.area} • Campus Operation Center
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <Badge variant="outline" className={`bg-red-50 text-red-600 border-red-100 text-[10px] font-black px-4 py-1.5 shadow-sm`}>
                                        PEAK ACTION: {activeReport.priority}
                                    </Badge>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Confidence: {activeReport.confidence}</span>
                                </div>
                            </div>

                            {/* Key metrics grid */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl group hover:shadow-md transition-all">
                                    <p className="text-3xl font-black tabular-nums text-slate-900 group-hover:text-cyan-600 transition-colors">{activeReport.water_level_percentage}%</p>
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-2 tracking-widest flex items-center gap-1.5"><HardDrive size={10} /> Node Capacity</p>
                                </div>
                                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl group hover:shadow-md transition-all">
                                    <p className="text-lg font-black text-slate-700 uppercase">{activeReport.confidence}</p>
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-2 tracking-widest flex items-center gap-1.5"><ShieldAlert size={10} /> Reliability</p>
                                </div>
                                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-3xl group hover:shadow-md transition-all">
                                    <p className="text-lg font-black text-slate-700 uppercase">Ollama-LENS v3</p>
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-2 tracking-widest flex items-center gap-1.5"><Cpu size={10} /> Model Cluster</p>
                                </div>
                            </div>

                            {/* Report Text */}
                            <div className="relative">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Analysis Narrative</span>
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </div>
                                <div className="p-8 rounded-3xl bg-slate-50/30 border border-slate-100 italic relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                                        <BrainCircuit size={120} />
                                    </div>
                                    <p className="text-[14px] leading-[1.7] text-slate-600 font-medium relative z-10 whitespace-pre-wrap">
                                        {activeReport.report}
                                    </p>
                                </div>
                            </div>

                            {/* Actions & Logistics */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 rounded-3xl bg-cyan-50/50 border border-cyan-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 bg-cyan-100/30 w-16 h-16 rounded-full blur-2xl"></div>
                                    <p className="text-[10px] font-black uppercase text-cyan-600 mb-3 tracking-widest">Protocol Response</p>
                                    <p className="text-[13px] font-bold text-slate-700 leading-relaxed">{activeReport.next_action}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 bg-amber-100/30 w-16 h-16 rounded-full blur-2xl"></div>
                                    <p className="text-[10px] font-black uppercase text-amber-600 mb-3 tracking-widest">Maintenance Window</p>
                                    <p className="text-[13px] font-bold text-slate-700 leading-relaxed">{activeReport.cleaning_schedule}</p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={() => fetchReport(activeLid!)}
                                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-lg shadow-slate-200"
                                >
                                    <RefreshCw size={14} />
                                    Re-Sync Analysis
                                </button>
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-8">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center opacity-40">
                                <BrainCircuit size={40} className="text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-black tracking-widest uppercase text-slate-300 mb-2">Diagnostic Data Unavailable</p>
                                <p className="text-[10px] font-bold text-slate-400">Node synchronization required for {activeLid}</p>
                            </div>
                            <button
                                onClick={() => fetchReport(activeLid!)}
                                className="px-10 py-3.5 rounded-2xl bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-cyan-600 transition-all shadow-xl shadow-cyan-100"
                            >
                                Re-scan Data Streams
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
