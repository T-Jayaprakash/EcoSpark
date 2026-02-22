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
import { statusBg, formatTime } from "@/lib/helpers";
import { History, Battery, Wifi, MapPin } from "lucide-react";

interface HistoryTableProps {
    lids: Record<string, SensorReading>;
}

export function HistoryTable({ lids }: HistoryTableProps) {
    const [records, setRecords] = useState<SensorReading[]>([]);

    useEffect(() => {
        async function load() {
            const lidIds = Object.keys(lids);
            if (!lidIds.length) return;

            const promises = lidIds.slice(0, 10).map((id) => fetchLidHistory(id, 5));
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
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                <History size={14} className="text-slate-400" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Telemetry History Log
                </h2>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Capacity</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400"><Battery size={14} /></TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400"><Wifi size={14} /></TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!records.length ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-slate-300 py-16 text-[10px] font-black uppercase tracking-[0.3em]">
                                    No historical context available
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((r) => (
                                <TableRow
                                    key={r._id}
                                    className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                                >
                                    <TableCell className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">
                                        {r.lid_id}
                                    </TableCell>
                                    <TableCell className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                                        {r.location?.area || "—"}
                                    </TableCell>
                                    <TableCell className={`text-right text-[11px] font-black tabular-nums ${r.status === 'CRITICAL' ? 'text-red-500' : 'text-slate-800'}`}>
                                        {r.water_level.value.toFixed(1)}%
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`text-[9px] font-black px-2 py-0 border-0 ${statusBg(r.status)}`}
                                        >
                                            {r.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-[11px] font-bold text-slate-400">
                                        {r.sensor_meta?.battery_level != null ? `${r.sensor_meta.battery_level}%` : "—"}
                                    </TableCell>
                                    <TableCell className="text-[11px] font-bold text-slate-400 uppercase">
                                        {r.sensor_meta?.signal_strength || "—"}
                                    </TableCell>
                                    <TableCell className="text-[10px] font-black text-slate-400 text-right font-mono uppercase">
                                        {formatTime(r.timestamp).split(' ')[1] || formatTime(r.timestamp)}
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
