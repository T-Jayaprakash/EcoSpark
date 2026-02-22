"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SensorReading } from "@/lib/api";
import { statusBg, gaugeColor, timeAgo, statusDot } from "@/lib/helpers";
import { MapPin, Battery, Wifi, Clock, MessageCircle } from "lucide-react";

interface LidCardProps {
    data: SensorReading;
}

export function LidCard({ data }: LidCardProps) {
    const pct = data.water_level.value.toFixed(1);
    const loc = data.location ?? {};
    const meta = data.sensor_meta ?? {};

    const getWhatsAppUrl = () => {
        const phone = "917397139329";
        const time = new Date(data.timestamp).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const text = `*ECOSPARK CRITICAL REPORT*%0A---------------------------%0A*LID:* ${data.lid_id}%0A*LOCATION:* ${loc.area}%0A*LEVEL:* ${pct}%%0A*TIME:* ${time}%0A---------------------------%0A_Immediate dispatch required!_`;
        return `https://wa.me/${phone}?text=${text}`;
    };

    return (
        <Card className={`relative overflow-hidden border-slate-200 bg-white p-5 h-full transition-all duration-500 hover:border-cyan-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] group flex flex-col justify-between ${data.status === 'CRITICAL' ? 'ring-2 ring-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]' : 'shadow-sm'}`}>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[12px] font-black tracking-widest text-slate-800 uppercase">
                        {data.lid_id}
                    </span>
                    <Badge
                        variant="outline"
                        className={`text-[9px] font-black px-2 py-0.5 border-0 ${statusBg(data.status)}`}
                    >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${statusDot(data.status)} ${data.status === "CRITICAL" ? "animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" : ""}`} />
                        {data.status}
                    </Badge>
                </div>

                {/* Location */}
                <p className="text-[11px] font-bold text-slate-500 mb-5 flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" /> {loc.area || "—"}
                </p>

                {/* Water Level */}
                <div className="mb-6">
                    <div className="flex items-end justify-between mb-2.5">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Capacity Utilisation</span>
                        <span className={`text-2xl font-black tabular-nums transition-colors duration-500 ${data.status === "CRITICAL" ? "text-red-500" :
                            data.status === "WARNING" ? "text-amber-500" : "text-cyan-600"
                            }`}>
                            {pct}%
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-in-out ${gaugeColor(data.status)} ${data.status === 'CRITICAL' ? 'shadow-[0_0_10px_rgba(239,68,68,0.4)]' : ''}`}
                            style={{
                                width: `${Math.min(parseFloat(pct), 100)}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Sensor Meta */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-400 mt-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 uppercase text-[8px] font-black text-slate-300"><Battery size={10} /> Battery</span>
                        <span className="text-slate-600">{meta.battery_level ?? "—"}%</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 uppercase text-[8px] font-black text-slate-300"><Wifi size={10} /> Signal</span>
                        <span className="text-slate-600 uppercase">{meta.signal_strength ?? "—"}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right items-end">
                        <span className="flex items-center gap-1 uppercase text-[8px] font-black text-slate-300"><Clock size={10} /> Latency</span>
                        <span className="text-slate-600">{timeAgo(data.timestamp)}</span>
                    </div>
                </div>
            </div>

            {data.status === 'CRITICAL' && (
                <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full py-2.5 rounded-xl bg-[#25D366] text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:shadow-[0_12px_24px_rgba(37,211,102,0.3)] active:scale-95 shadow-md shadow-emerald-100"
                >
                    <MessageCircle size={14} />
                    Send Report
                </a>
            )}
        </Card>
    );
}
