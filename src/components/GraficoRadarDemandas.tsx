import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Sector, Cell } from 'recharts';

interface DimensionData {
    name: string;
    value: number;
    fill: string;
    is_positive: boolean;
}

interface GraficoRadarDemandasProps {
    data: DimensionData[];
    loading?: boolean;
}

export const GraficoRadarDemandas: React.FC<GraficoRadarDemandasProps> = ({ data, loading }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Sort data for the chart: Positive First (Right Hemisphere), Negative Second (Left Hemisphere)
    // We create a copy to avoid mutating props
    const chartData = [...data].sort((a, b) => {
        // Positive first
        if (a.is_positive && !b.is_positive) return -1;
        if (!a.is_positive && b.is_positive) return 1;
        // Then Alphabetical
        return a.name.localeCompare(b.name);
    });

    const renderCustomPolarSector = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, value, index } = props;
        const maxValue = 4;
        const safeValue = Math.min(value, maxValue);
        // Calculate dynamic radius based on value relative to maxValue
        // Base innerRadius is preserved, we extend outwards
        const r = innerRadius + (outerRadius - innerRadius) * (safeValue / maxValue);
        const isHovered = index === hoveredIndex;

        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={r}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    stroke={isHovered ? "#fff" : "none"}
                    strokeWidth={2}
                    style={{ filter: isHovered ? 'brightness(1.1)' : 'none', transition: 'all 0.3s ease' }}
                />
                {isHovered && (
                    <text
                        x={cx + (innerRadius + (r - innerRadius) * 0.55) * Math.cos(-((startAngle + endAngle) / 2) * Math.PI / 180)}
                        y={cy + (innerRadius + (r - innerRadius) * 0.55) * Math.sin(-((startAngle + endAngle) / 2) * Math.PI / 180)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fff"
                        className="text-base font-bold drop-shadow-md pointer-events-none"
                    >
                        {value.toFixed(1)}
                    </text>
                )}
            </g>
        );
    };

    if (loading) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#35b6cf] rounded-full animate-spin" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-[400px] flex flex-col items-center justify-center text-slate-400">
                <p>Sem dados suficientes para análise.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[400px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={150} // Increased size as requested implicitly by "exact dimension"
                        startAngle={90}   // Start at Top
                        endAngle={-270}   // Full circle clockwise
                        shape={renderCustomPolarSector}
                        onMouseEnter={(_, index) => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        isAnimationActive={true}
                        label={({ cx, cy, midAngle, outerRadius, value, name }) => {
                            const RADIAN = Math.PI / 180;
                            const angle = -(midAngle || 0) * RADIAN;
                            // Labels positioned outside
                            const radius = outerRadius * 1.15;
                            const x = cx + radius * Math.cos(angle);
                            const y = cy + radius * Math.sin(angle);

                            const textAnchor = Math.abs(x - cx) < 10 ? 'middle' : (x > cx ? 'start' : 'end');

                            return (
                                <text
                                    x={x}
                                    y={y}
                                    fill="#64748b"
                                    textAnchor={textAnchor}
                                    dominantBaseline="central"
                                    className="text-xs font-bold"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {name}
                                </text>
                            );
                        }}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            {/* Center Global Average */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100">
                    <span className="text-xl font-bold text-slate-700">
                        {(data.reduce((acc, curr) => acc + curr.value, 0) / data.length).toFixed(1)}
                    </span>
                </div>
            </div>
        </div>
    );
};
