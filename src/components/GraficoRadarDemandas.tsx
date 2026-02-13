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

const RADIAN = Math.PI / 180;

export const GraficoRadarDemandas: React.FC<GraficoRadarDemandasProps> = ({ data, loading }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Ordenação: Positivos (Direita), Negativos (Esquerda)
    const chartData = [...data]
        .sort((a, b) => {
            if (a.is_positive && !b.is_positive) return -1;
            if (!a.is_positive && b.is_positive) return 1;
            return a.name.localeCompare(b.name);
        })
        .map(d => ({ ...d, share: 1 })); // Fatias iguais

    const renderCustomPolarSector = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, index } = props;
        const value = payload.value;
        const maxValue = 4;
        const safeValue = Math.min(value, maxValue);

        // Calcula o ângulo médio para posicionar os textos
        const midAngle = (startAngle + endAngle) / 2;
        const RADIAN = Math.PI / 180;
        const angleRad = -midAngle * RADIAN;

        // Raio da barra colorida
        const r = innerRadius + (outerRadius - innerRadius) * (safeValue / maxValue);
        const isHovered = index === hoveredIndex;

        // --- POSIÇÃO DA NOTA INTERNA (Dentro da barra) ---
        const textRadius = innerRadius + (r - innerRadius) * 0.85;
        const textX = cx + textRadius * Math.cos(angleRad);
        const textY = cy + textRadius * Math.sin(angleRad);

        // --- POSIÇÃO DO RÓTULO EXTERNO (Nome da Demanda) ---
        // Definimos uma distância fixa fora da barra máxima para alinhar tudo em círculo
        // ou usamos 'r + 20' se quiser que o texto acompanhe a altura da barra.
        // Vamos usar outerRadius fixo + espaço para ficar alinhado e bonito:
        const labelRadius = outerRadius + 20;
        const labelX = cx + labelRadius * Math.cos(angleRad);
        const labelY = cy + labelRadius * Math.sin(angleRad);

        // Alinhamento do texto externo (Esquerda ou Direita do gráfico)
        const textAnchor = labelX > cx ? 'start' : 'end';
        const labelOffsetX = labelX > cx ? 5 : -5;

        return (
            <g>
                {/* 1. A Barra (Sector) */}
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

                {/* 2. A Nota Interna (Sem condicional, aparece sempre) */}
                <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff"
                    fontSize={12}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                    {value.toFixed(1)}
                </text>

                {/* 3. O Rótulo Externo + Linha (Desenhado manualmente para nunca sumir) */}
                <path
                    d={`M${cx + r * Math.cos(angleRad)},${cy + r * Math.sin(angleRad)}L${labelX},${labelY}`}
                    stroke="#94a3b8"
                    strokeWidth={1}
                    fill="none"
                    opacity={0.5}
                />
                <circle cx={cx + r * Math.cos(angleRad)} cy={cy + r * Math.sin(angleRad)} r={2} fill="#94a3b8" />
                <text
                    x={labelX + labelOffsetX}
                    y={labelY}
                    dominantBaseline="central"
                    textAnchor={textAnchor}
                    fill="#64748b"
                    fontSize={11}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                >
                    {payload.name}
                </text>
            </g>
        );
    };

    if (loading) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#35b6cf] rounded-full animate-spin" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="w-full h-[500px] flex flex-col items-center justify-center text-slate-400">
                <p>Sem dados suficientes para análise.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[500px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
                    <Pie
                        data={chartData}
                        dataKey="share"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={120}
                        startAngle={90}
                        endAngle={-270}
                        activeShape={renderCustomPolarSector}
                        shape={renderCustomPolarSector} // Isso garante o desenho customizado
                        isAnimationActive={false} // Desligue a animação para garantir renderização imediata das posições
                        onMouseEnter={(_, index) => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            {/* Centro com Média Global (Decorativo) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100">
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                </div>
            </div>
        </div>
    );
};