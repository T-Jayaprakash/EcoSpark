"use client";

import { Card } from "@/components/ui/card";

interface StatCardProps {
    label: string;
    value: number;
    icon: string;
    accent: string;       // tailwind text color
    bgAccent: string;     // tailwind bg for icon circle
}

function StatCard({ label, value, icon, accent, bgAccent }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm p-5 group hover:border-border transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgAccent} text-xl shrink-0`}>
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
            {/* Subtle glow line at bottom */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${bgAccent} opacity-40`} />
        </Card>
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
                icon="📡"
                accent="text-foreground"
                bgAccent="bg-primary/10"
            />
            <StatCard
                label="Normal"
                value={normal}
                icon="✅"
                accent="text-emerald-400"
                bgAccent="bg-emerald-500/10"
            />
            <StatCard
                label="Warning"
                value={warning}
                icon="⚠️"
                accent="text-amber-400"
                bgAccent="bg-amber-500/10"
            />
            <StatCard
                label="Critical"
                value={critical}
                icon="🚨"
                accent="text-red-400"
                bgAccent="bg-red-500/10"
            />
        </div>
    );
}
