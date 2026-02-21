"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { WeatherData } from "@/lib/api";
import { fetchWeather } from "@/lib/api";

function formatDay(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = d.getTime() - today.getTime();
    const days = Math.round(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

export function WeatherPanel() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await fetchWeather();
            setWeather(data);
            setLoading(false);
        }
        load();
        const interval = setInterval(load, 15 * 60 * 1000); // refresh every 15 min
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-5">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-20 bg-muted rounded" />
                </div>
            </Card>
        );
    }

    if (!weather) {
        return (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-5">
                <p className="text-sm text-muted-foreground text-center py-4">
                    Weather data unavailable — intelligence service may be offline
                </p>
            </Card>
        );
    }

    const { current, daily } = weather;

    return (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    🌤️ MKCE Campus Weather
                </h2>
            </div>

            <div className="p-5">
                {/* Current weather */}
                <div className="flex items-center gap-6 mb-5">
                    <div className="text-5xl leading-none">
                        {current.weather_icon}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tabular-nums">
                                {current.temperature_2m}°C
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {current.weather_description}
                            </span>
                        </div>
                        <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                            <span>💧 Humidity: {current.relative_humidity_2m}%</span>
                            <span>🌧️ Rain: {current.rain} mm</span>
                            <span>💨 Wind: {current.wind_speed_10m} km/h</span>
                        </div>
                    </div>
                    {current.rain > 0 && (
                        <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <span className="text-xs font-bold text-blue-600">
                                Active Rain
                            </span>
                        </div>
                    )}
                </div>

                {/* 7-day forecast */}
                <div className="grid grid-cols-7 gap-2">
                    {daily.dates.map((date, i) => {
                        const rainToday = daily.rain_sum[i];
                        return (
                            <div
                                key={date}
                                className={`text-center p-2.5 rounded-lg border transition-colors ${i === 0
                                        ? "bg-blue-500/5 border-blue-500/20"
                                        : "bg-muted/30 border-border/30"
                                    } ${rainToday > 5 ? "ring-1 ring-blue-400/30" : ""}`}
                            >
                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                                    {formatDay(date)}
                                </p>
                                <p className="text-xl leading-none mb-1.5">
                                    {daily.weather_icons[i]}
                                </p>
                                <p className="text-xs font-bold tabular-nums">
                                    {daily.temperature_max[i]}°
                                </p>
                                <p className="text-[10px] text-muted-foreground tabular-nums">
                                    {daily.temperature_min[i]}°
                                </p>
                                {rainToday > 0 && (
                                    <p className="text-[9px] text-blue-600 font-semibold mt-1">
                                        {rainToday.toFixed(1)} mm
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}
