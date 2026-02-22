"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Alert } from "@/lib/api";
import { statusBg, statusDot, timeAgo } from "@/lib/helpers";
import { ShieldAlert, Info, BellRing } from "lucide-react";

interface AlertPanelProps {
    alerts: Alert[];
}

export function AlertPanel({ alerts }: AlertPanelProps) {
    return (
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-500 flex items-center gap-2">
                    <BellRing size={14} className="text-slate-400" />
                    System Alerts
                </h2>
                {alerts.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-red-100 text-red-600 border border-red-200 animate-pulse shadow-sm">
                        {alerts.length} ACTIVE
                    </span>
                )}
            </div>

            <div className="max-h-[380px] overflow-y-auto">
                {!alerts.length ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                            <Info size={24} className="text-emerald-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Environment Stable</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {alerts.map((a) => (
                            <li
                                key={a._id}
                                className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group"
                            >
                                <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${statusDot(a.status)} ${a.status === "CRITICAL" ? "shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" : ""}`} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[12px] font-black text-slate-800 truncate uppercase tracking-tight">
                                            {a.lid_id}
                                        </p>
                                        <span className="text-[10px] font-bold text-slate-300">•</span>
                                        <span className="text-[10px] font-bold text-slate-400 truncate">{a.area}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500">
                                        Level: <span className={a.status === 'CRITICAL' ? 'text-red-500 font-extrabold' : 'text-slate-700'}>{a.water_level_value}%</span>
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <Badge
                                        variant="outline"
                                        className={`text-[9px] font-black px-2 py-0 border-0 ${statusBg(a.status)} scale-100 group-hover:scale-105 transition-transform`}
                                    >
                                        {a.status}
                                    </Badge>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                        {timeAgo(a.timestamp)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Card>
    );
}
