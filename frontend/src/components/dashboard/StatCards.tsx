"use client";

import { Card } from "@/components/ui/card";

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    accent: string;
    bgAccent: string;
}

function StatCard({ label, value, icon, accent, bgAccent }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-5 group hover:border-border transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgAccent} shrink-0`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                        {label}
                    </p>
                    <p className={`text-3xl font-bold tracking-tight ${accent}`}>
                        {value}
                    </p>
                </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${bgAccent} opacity-40`} />
        </Card>
    );
}

/* Simple SVG icons to replace emojis */
function SensorIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
            <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49" /><path d="M7.76 16.24a6 6 0 0 1 0-8.49" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    );
}

function AlertTriangleIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function AlertCircleIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}

interface StatCardsProps {
    total: number;
    normal: number;
    warning: number;
    critical: number;
}

export function StatCards({ total, normal, warning, critical }: StatCardsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                label="Total Lids"
                value={total}
                icon={<SensorIcon />}
                accent="text-foreground"
                bgAccent="bg-primary/10"
            />
            <StatCard
                label="Normal"
                value={normal}
                icon={<CheckIcon />}
                accent="text-emerald-600"
                bgAccent="bg-emerald-500/10"
            />
            <StatCard
                label="Warning"
                value={warning}
                icon={<AlertTriangleIcon />}
                accent="text-amber-600"
                bgAccent="bg-amber-500/10"
            />
            <StatCard
                label="Critical"
                value={critical}
                icon={<AlertCircleIcon />}
                accent="text-red-600"
                bgAccent="bg-red-500/10"
            />
        </div>
    );
}
