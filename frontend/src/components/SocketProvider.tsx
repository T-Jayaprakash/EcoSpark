"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { SensorReading, Alert } from "@/lib/api";
import { fetchLids, fetchAlerts } from "@/lib/api";

// ── Context shape ────────────────────────────────────────────────────────────
interface SocketState {
    connected: boolean;
    lids: Record<string, SensorReading>;
    alerts: Alert[];
}

const SocketCtx = createContext<SocketState>({
    connected: false,
    lids: {},
    alerts: [],
});

export const useSocketData = () => useContext(SocketCtx);

// ── Provider component ──────────────────────────────────────────────────────
export function SocketProvider({ children }: { children: React.ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [lids, setLids] = useState<Record<string, SensorReading>>({});
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const knownAlertIds = useRef<Set<string>>(new Set());

    // 1. Initial REST fetch for baseline data
    useEffect(() => {
        fetchLids().then((data) => {
            const map: Record<string, SensorReading> = {};
            data.forEach((d) => (map[d.lid_id] = d));
            setLids(map);
        });

        fetchAlerts().then((data) => {
            data.forEach((a) => knownAlertIds.current.add(a._id));
            setAlerts(data);
        });
    }, []);

    // 2. Socket.IO connection for real-time events
    useEffect(() => {
        const socket = io("http://localhost:3001", {
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            console.log("⚡ Socket.IO connected:", socket.id);
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        // sensor:update → merge into lids map
        socket.on("sensor:update", (doc: SensorReading) => {
            setLids((prev) => ({ ...prev, [doc.lid_id]: doc }));
        });

        // alert:new → prepend to alerts array
        socket.on("alert:new", (alert: Alert) => {
            if (!knownAlertIds.current.has(alert._id)) {
                knownAlertIds.current.add(alert._id);
                setAlerts((prev) => [alert, ...prev]);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // 3. Light fallback polling every 30s
    useEffect(() => {
        const interval = setInterval(async () => {
            const [lidsData, alertsData] = await Promise.all([
                fetchLids(),
                fetchAlerts(),
            ]);
            const map: Record<string, SensorReading> = {};
            lidsData.forEach((d) => (map[d.lid_id] = d));
            setLids(map);
            alertsData.forEach((a) => knownAlertIds.current.add(a._id));
            setAlerts(alertsData);
        }, 30_000);
        return () => clearInterval(interval);
    }, []);

    return (
        <SocketCtx.Provider value={{ connected, lids, alerts }}>
            {children}
        </SocketCtx.Provider>
    );
}
