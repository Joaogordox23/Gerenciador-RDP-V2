// src/components/dashboard/StatusPieChart.js
// ✨ v5.0: Migrado para Tailwind CSS com melhorias visuais
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChartIcon } from '../MuiIcons';

const StatusPieChart = ({ data }) => {
    // Cores Premium: Primary (Online), Pink (Offline), Amber (Alert)
    const COLORS = ['#1de9b6', '#e91e63', '#ffc107'];

    // Total para calcular percentuais
    const total = data.reduce((sum, item) => sum + item.value, 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const percentage = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0;
            return (
                <div className="
                    bg-dark-surface/95 backdrop-blur-lg
                    border border-white/10 
                    px-4 py-3 rounded-xl
                    shadow-xl shadow-black/30
                ">
                    <p className="font-bold text-base" style={{ color: payload[0].payload.fill }}>
                        {payload[0].name}
                    </p>
                    <p className="text-white/80 text-sm mt-1">
                        <span className="font-semibold">{payload[0].value}</span> servidores
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                        {percentage}% do total
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLegend = ({ payload }) => (
        <div className="flex justify-center gap-6 mt-4">
            {payload.map((entry, index) => {
                const item = data[index];
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                return (
                    <div key={entry.value} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-400">
                            {entry.value}
                            <span className="ml-1 font-semibold text-white">
                                {item.value}
                            </span>
                            <span className="ml-1 text-xs opacity-60">
                                ({percentage}%)
                            </span>
                        </span>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="
            bg-cream-100/80 dark:bg-dark-surface/80 backdrop-blur-sm
            border border-gray-200 dark:border-gray-700 
            rounded-xl p-6
            hover:shadow-lg transition-all duration-300
        ">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
                <BarChartIcon className="text-primary" sx={{ fontSize: 20 }} />
                Distribuição de Status
            </h3>

            {/* Resumo visual rápido */}
            <div className="flex justify-center gap-4 mb-4">
                {data.map((item, idx) => (
                    <div
                        key={item.name}
                        className="text-center px-4 py-2 rounded-lg"
                        style={{ backgroundColor: `${COLORS[idx]}15` }}
                    >
                        <div className="text-2xl font-bold" style={{ color: COLORS[idx] }}>
                            {item.value}
                        </div>
                        <div className="text-xs text-gray-500">{item.name}</div>
                    </div>
                ))}
            </div>

            {/* Gráfico */}
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            {COLORS.map((color, idx) => (
                                <linearGradient key={idx} id={`pieGradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                                </linearGradient>
                            ))}
                        </defs>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={`url(#pieGradient${index})`}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<CustomLegend />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Centro do donut com total */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-60px' }}>
                <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                </div>
            </div>
        </div>
    );
};

export default StatusPieChart;
