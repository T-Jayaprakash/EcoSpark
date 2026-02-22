// lib/helpers.ts — formatting & status utilities

export function statusColor(status: string) {
    switch (status) {
        case "CRITICAL":
            return "text-red-400";
        case "WARNING":
            return "text-amber-400";
        default:
            return "text-emerald-400";
    }
}

export function statusBg(status: string) {
    switch (status) {
        case "CRITICAL":
            return "bg-red-500/15 text-red-400 border-red-500/30";
        case "WARNING":
            return "bg-amber-500/15 text-amber-400 border-amber-500/30";
        default:
            return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
}

export function statusDot(status: string) {
    switch (status) {
        case "CRITICAL":
            return "bg-red-500";
        case "WARNING":
            return "bg-amber-500";
        default:
            return "bg-emerald-500";
    }
}

export function gaugeColor(status: string) {
    switch (status) {
        case "CRITICAL":
            return "bg-gradient-to-r from-red-600 to-red-400";
        case "WARNING":
            return "bg-gradient-to-r from-amber-600 to-amber-400";
        default:
            return "bg-gradient-to-r from-emerald-600 to-emerald-400";
    }
}

export function formatTime(iso: string) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("en-IN", { hour12: false });
    } catch {
        return iso;
    }
}

export function timeAgo(iso: string) {
    if (!iso) return "—";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return `${Math.round(s)}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    return `${Math.round(s / 3600)}h ago`;
}

