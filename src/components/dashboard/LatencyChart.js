// src/components/dashboard/LatencyChart.js
// ✨ v5.0: Migrado para Tailwind CSS com melhorias visuais
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SpeedIcon, CircleIcon } from '../MuiIcons';

const LatencyChart = ({ data }) => {

    // Calcular estatísticas
    const stats = useMemo(() => {
        if (!data || data.length === 0) return { avg: 0, min: 0, max: 0 };
        const latencies = data.map(d => d.latency);
        return {
            avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
            min: Math.min(...latencies),
            max: Math.max(...latencies)
        };
    }, [data]);

    // Determinar cor baseada na latência média
    const getLatencyColor = (latency) => {
        if (latency < 50) return '#1de9b6'; // Green/Primary
        if (latency < 150) return '#ffc107'; // Yellow
        return '#e91e63'; // Red
    };

    const primaryColor = getLatencyColor(stats.avg);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const latency = payload[0].value;
            return (
                <div className="
                    bg-dark-surface/95 backdrop-blur-lg
                    border border-white/10 
                    px-4 py-3 rounded-xl
                    shadow-xl shadow-black/30
                ">
                    <p className="text-white/60 text-xs mb-1">{label}</p>
                    <p className="font-bold text-lg" style={{ color: getLatencyColor(latency) }}>
                        {latency} <span className="text-sm font-normal">ms</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <CircleIcon sx={{ fontSize: 8 }} style={{ color: getLatencyColor(latency) }} />
                        {latency < 50 ? 'Excelente' : latency < 150 ? 'Normal' : 'Alto'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="
            bg-cream-100/80 dark:bg-dark-surface/80 backdrop-blur-sm
            border border-gray-200 dark:border-gray-700 
            rounded-xl p-6
            hover:shadow-lg transition-all duration-300
        ">
            <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <SpeedIcon className="text-primary" sx={{ fontSize: 20 }} />
                    Latência Média
                </h3>

                {/* Estatísticas rápidas */}
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Mín</div>
                        <div className="text-sm font-semibold text-primary">{stats.min}ms</div>
                    </div>
                    <div className="text-center px-4 py-1 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
                        <div className="text-xs text-gray-500">Média</div>
                        <div className="text-lg font-bold" style={{ color: primaryColor }}>{stats.avg}ms</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Máx</div>
                        <div className="text-sm font-semibold text-red-400">{stats.max}ms</div>
                    </div>
                </div>
            </div>

            {/* Indicador de qualidade */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${Math.min(100, (stats.avg / 200) * 100)}%`,
                            backgroundColor: primaryColor
                        }}
                    />
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">
                    {stats.avg < 50 ? 'Ótimo' : stats.avg < 150 ? 'Bom' : 'Alto'}
                </span>
            </div>

            {/* Gráfico */}
            <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorLatencyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={primaryColor} stopOpacity={0.4} />
                                <stop offset="50%" stopColor={primaryColor} stopOpacity={0.1} />
                                <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.05)"
                            vertical={false}
                        />

                        {/* Linhas de referência */}
                        <ReferenceLine y={50} stroke="#1de9b6" strokeDasharray="3 3" strokeOpacity={0.3} />
                        <ReferenceLine y={150} stroke="#ffc107" strokeDasharray="3 3" strokeOpacity={0.3} />

                        <XAxis
                            dataKey="time"
                            stroke="rgba(255,255,255,0.3)"
                            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.3)"
                            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 'auto']}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="latency"
                            stroke={primaryColor}
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorLatencyGradient)"
                            filter="url(#glow)"
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legenda de referência */}
            <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-primary/50 rounded"></span>
                    &lt; 50ms Excelente
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-yellow-500/50 rounded"></span>
                    50-150ms Normal
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-red-500/50 rounded"></span>
                    &gt; 150ms Alto
                </span>
            </div>
        </div>
    );
};

export default LatencyChart;
