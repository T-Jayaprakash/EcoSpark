"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { SensorReading } from "@/lib/api";
import { fetchLidHistory } from "@/lib/api";
import { statusBg, formatTime, statusIcon } from "@/lib/helpers";

interface HistoryTableProps {
    lids: Record<string, SensorReading>;
}

export function HistoryTable({ lids }: HistoryTableProps) {
    const [records, setRecords] = useState<SensorReading[]>([]);

    // Refetch history for first available lid periodically
    useEffect(() => {
        async function load() {
            const lidIds = Object.keys(lids);
            if (!lidIds.length) return;

            // Gather recent history from all lids (up to 5)
            const promises = lidIds.slice(0, 5).map((id) => fetchLidHistory(id, 5));
            const results = await Promise.all(promises);
            const all = results
                .flat()
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 20);
            setRecords(all);
        }

        load();
        const interval = setInterval(load, 15_000);
        return () => clearInterval(interval);
    }, [Object.keys(lids).length]);

    return (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    📋 Recent History
                </h2>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/30">
                            <TableHead className="text-xs font-semibold w-24">Lid ID</TableHead>
                            <TableHead className="text-xs font-semibold">Area</TableHead>
                            <TableHead className="text-xs font-semibold text-right w-20">Level</TableHead>
                            <TableHead className="text-xs font-semibold w-24">Status</TableHead>
                            <TableHead className="text-xs font-semibold w-16">🔋</TableHead>
                            <TableHead className="text-xs font-semibold w-20">📶</TableHead>
                            <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!records.length ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-center text-muted-foreground py-10 text-sm"
                                >
                                    No history records yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((r) => (
                                <TableRow
                                    key={r._id}
                                    className="border-border/20 hover:bg-muted/20 transition-colors"
                                >
                                    <TableCell className="font-semibold text-sm">
                                        {r.lid_id}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {r.location?.area || "—"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-sm tabular-nums">
                                        {r.water_level.value.toFixed(1)}%
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`text-[11px] font-semibold ${statusBg(r.status)}`}
                                        >
                                            {statusIcon(r.status)} {r.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {r.sensor_meta?.battery_level != null
                                            ? `${r.sensor_meta.battery_level}%`
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {r.sensor_meta?.signal_strength || "—"}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatTime(r.timestamp)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
