"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import type { WeatherData } from "@/lib/api";
import { fetchWeather } from "@/lib/api";
import { CloudRain, Wind, Droplets, Thermometer, Calendar, Sun, Cloud, CloudSun, CloudFog, CloudLightning, Snowflake } from "lucide-react";

function formatDay(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = d.getTime() - today.getTime();
    const days = Math.round(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return d.toLocaleDateString("en-IN", { weekday: "short" });
}

/**
 * Maps common weather emojis or codes to Lucide icons
 */
function GetWeatherIcon({ icon, code, size = 24 }: { icon?: string, code?: number, size?: number }) {
    // If we have a code, use that primarily
    const c = code ?? -1;

    if (c === 0) return <Sun size={size} className="text-amber-400" />;
    if (c >= 1 && c <= 3) return <CloudSun size={size} className="text-slate-400" />;
    if (c >= 45 && c <= 48) return <CloudFog size={size} className="text-slate-300" />;
    if (c >= 51 && c <= 67) return <CloudRain size={size} className="text-blue-400" />;
    if (c >= 71 && c <= 77) return <Snowflake size={size} className="text-blue-200" />;
    if (c >= 80 && c <= 82) return <CloudRain size={size} className="text-blue-500" />;
    if (c >= 95) return <CloudLightning size={size} className="text-amber-500" />;

    // Fallback based on emoji if code is missing
    if (icon === "☀️") return <Sun size={size} className="text-amber-400" />;
    if (icon === "⛅" || icon === "🌤️") return <CloudSun size={size} className="text-slate-400" />;
    if (icon === "🌫️") return <CloudFog size={size} className="text-slate-300" />;
    if (icon === "🌧️" || icon === "🌦️") return <CloudRain size={size} className="text-blue-400" />;
    if (icon === "❄️") return <Snowflake size={size} className="text-blue-200" />;
    if (icon === "⛈️") return <CloudLightning size={size} className="text-amber-500" />;

    return <Cloud size={size} className="text-slate-400" />;
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
            <Card className="border-slate-200 bg-white p-6 h-full shadow-sm">
                <div className="animate-pulse space-y-5">
                    <div className="h-4 bg-slate-50 rounded w-1/3" />
                    <div className="h-28 bg-slate-50 rounded" />
                    <div className="grid grid-cols-7 gap-2">
                        {[...Array(7)].map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded" />)}
                    </div>
                </div>
            </Card>
        );
    }

    if (!weather) return null;

    const { current, daily } = weather;

    return (
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col justify-between p-6">
            {/* Current weather */}
            <div className="flex items-center gap-6 mb-8">
                <div className="bg-slate-50 p-4 rounded-3xl">
                    <GetWeatherIcon code={current.weather_code} icon={current.weather_icon} size={48} />
                </div>
                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tabular-nums tracking-tighter text-slate-900">
                            {current.temperature_2m}°C
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            {current.weather_description}
                        </span>
                    </div>
                    <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        <span className="flex items-center gap-1.5"><Droplets size={12} className="text-cyan-500" /> {current.relative_humidity_2m}%</span>
                        <span className="flex items-center gap-1.5"><CloudRain size={12} className="text-blue-500" /> {current.rain}mm</span>
                        <span className="flex items-center gap-1.5"><Wind size={12} className="text-slate-400" /> {current.wind_speed_10m}km/h</span>
                    </div>
                </div>
            </div>

            {/* 7-day small forecast */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Extended 7-Day Context</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {daily.dates.map((date, i) => {
                        const isRainy = daily.rain_sum[i] > 2;
                        return (
                            <div
                                key={date}
                                className={`text-center p-2.5 rounded-xl border transition-all ${i === 0
                                    ? "bg-cyan-50 border-cyan-100 shadow-sm"
                                    : "bg-slate-50 border-transparent"
                                    } ${isRainy ? "border-blue-100 bg-blue-50/50" : ""}`}
                            >
                                <p className={`text-[8px] font-black uppercase mb-2 tracking-tighter ${i === 0 ? 'text-cyan-600' : 'text-slate-400'}`}>
                                    {formatDay(date)}
                                </p>
                                <div className="flex justify-center mb-2">
                                    <GetWeatherIcon code={daily.weather_code[i]} icon={daily.weather_icons[i]} size={18} />
                                </div>
                                <p className={`text-[10px] font-black tabular-nums ${i === 0 ? 'text-cyan-700' : 'text-slate-700'}`}>
                                    {daily.temperature_max[i]}°
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}
