"use client";

import { Card } from "@/components/ui/card";
import { Zap, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    accent: string;
    bgAccent: string;
    isCritical?: boolean;
}

function StatCard({ label, value, icon, accent, bgAccent, isCritical }: StatCardProps) {
    return (
        <Card className={`relative overflow-hidden border-slate-200 bg-white p-6 group transition-all duration-500 hover:border-cyan-200 hover:shadow-xl hover:-translate-y-1 ${isCritical && value as number > 0 ? 'ring-2 ring-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bgAccent} border border-transparent group-hover:border-white/50 transition-all`}>
                    {icon}
                </div>
                {isCritical && value as number > 0 && (
                    <div className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                    </div>
                )}
            </div>
            <div>
                <p className={`text-4xl font-black tracking-tighter transition-all ${accent}`}>
                    {value}
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1.5">
                    {label}
                </p>
            </div>

            {/* Visual bottom accent */}
            <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-${accent.split('-')[1] || 'cyan'}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
        </Card>
    );
}

export function StatCards({ total, normal, warning, critical }: { total: number, normal: number, warning: number, critical: number }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                label="Total Lids"
                value={total}
                icon={<Zap size={20} className="text-blue-600" />}
                accent="text-slate-900"
                bgAccent="bg-blue-50"
            />
            <StatCard
                label="Stable"
                value={normal}
                icon={<CheckCircle2 size={20} className="text-emerald-600" />}
                accent="text-emerald-600"
                bgAccent="bg-emerald-50"
            />
            <StatCard
                label="Warnings"
                value={warning}
                icon={<AlertTriangle size={20} className="text-amber-600" />}
                accent="text-amber-600"
                bgAccent="bg-amber-50"
            />
            <StatCard
                label="Critical"
                value={critical}
                icon={<ShieldAlert size={20} className="text-red-600" />}
                accent="text-red-600"
                bgAccent="bg-red-50"
                isCritical
            />
        </div>
    );
}
