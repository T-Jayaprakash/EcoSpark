"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Alert } from "@/lib/api";
import { statusBg, statusDot, timeAgo } from "@/lib/helpers";

interface AlertPanelProps {
    alerts: Alert[];
}

export function AlertPanel({ alerts }: AlertPanelProps) {
    return (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                    🚨 Active Alerts
                    {alerts.length > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full bg-red-500/20 text-red-400">
                            {alerts.length}
                        </span>
                    )}
                </h2>
            </div>

            <div className="max-h-80 overflow-y-auto">
                {!alerts.length ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <span className="text-2xl mb-2">✅</span>
                        <p className="text-sm">All systems normal — no active alerts</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-border/30">
                        {alerts.map((a) => (
                            <li
                                key={a._id}
                                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                            >
                                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${statusDot(a.status)} ${a.status === "CRITICAL" ? "animate-pulse" : ""}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {a.lid_id} — {a.area || "Unknown"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Water level: <strong>{a.water_level_value}%</strong> · {a.city || "—"}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`text-[11px] font-semibold shrink-0 ${statusBg(a.status)}`}
                                >
                                    {a.status}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground/60 shrink-0 w-14 text-right">
                                    {timeAgo(a.timestamp)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Card>
    );
}
