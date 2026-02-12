import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface DimensionData {
    name: string;
    value: number;
    fill: string; // Color based on value/risk
    is_positive: boolean;
}

interface UseDimensionAnalysisProps {
    unidadeId: number | null;
    setorId: number | null;
    formIds: number[];
}

export const useDimensionAnalysis = ({ unidadeId, setorId, formIds }: UseDimensionAnalysisProps) => {
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<DimensionData[]>([]);
    const [positiveDimensions, setPositiveDimensions] = useState<DimensionData[]>([]);
    const [negativeDimensions, setNegativeDimensions] = useState<DimensionData[]>([]);

    // Helper for colors
    const getColorForValue = (value: number) => {
        // High Risk (Red) -> Low Score
        // Low Risk (Green) -> High Score
        // Wait, for "Negative" dimensions (e.g. Demand), High Score = High Risk.
        // For "Positive" dimensions (e.g. Support), Low Score = High Risk.

        // However, the previous code just used value magnitude:
        // >= 3.0: Red (High)
        // >= 2.0: Orange (Moderate)
        // >= 1.0: Orange-Light
        // < 1.0: Blue/Green?

        // Let's stick to the REFERENCE IMAGE colors for now:
        // Red = Alto Risco
        // Blue/Indigo = Risk? 

        // The previous implementation had:
        // if (value >= 3.0) return '#f43f5e'; // Rose-500
        // if (value >= 2.0) return '#ea580c'; // Orange-600
        // ...

        return value >= 3.0 ? '#f43f5e' :
            value >= 2.0 ? '#ea580c' :
                value >= 1.0 ? '#6366f1' : '#10b981'; // Just a placeholder logic, will refine
    };

    // Correct Logic from Reference Image:
    // "Quanto MAIOR a média, MAIOR o risco" (implied for Negative dims like Demand)
    // Legend: 3.0-4.0 Alto (Red), 2.0-2.9 Moderado (Orange), 1.0-1.9 Médio (Blue), 0.0-0.9 Baixo (Green)

    // For Positive Dims (Support, Control):
    // "Quanto MENOR a média, MAIOR o risco" usually.
    // BUT the image shows "Risco Inverso" legend:
    // 0.0-0.9 Alto (Red), 1.0-1.9 Moderado (Orange), 2.0-2.9 Médio (Blue), 3.0-4.0 Baixo (Green)

    const getRiskColor = (value: number, is_positive: boolean) => {
        if (!is_positive) {
            // DIRECT RISK: Higher = Worse
            if (value >= 3.0) return '#f43f5e'; // Red (Alto)
            if (value >= 2.0) return '#fbc19c'; // Orange (Moderado) // Changed to match image distinct colors if possible, using standard tailwind map later
            if (value >= 1.0) return '#818cf8'; // Blue/Indigo (Médio)
            return '#34d399'; // Green (Baixo)
        } else {
            // INVERSE RISK: Lower = Worse
            if (value < 1.0) return '#f43f5e'; // Red (Alto)
            if (value < 2.0) return '#fbc19c'; // Orange (Moderado)
            if (value < 3.0) return '#818cf8'; // Blue/Indigo (Médio)
            return '#34d399'; // Green (Baixo)
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!formIds || formIds.length === 0) {
                setLoading(false);
                setChartData([]);
                return;
            }

            setLoading(true);
            try {
                let query = supabase
                    .from('form_answers')
                    .select(`
                        answer_number,
                        colaboradores!inner (
                            unidade_id,
                            setor_id
                        ),
                        form_questions!inner (
                            form_hse_dimensions!inner (
                                id,
                                name,
                                is_positive
                            )
                        )
                    `)
                    .in('form_id', formIds);

                if (unidadeId) {
                    query = query.eq('colaboradores.unidade_id', unidadeId);
                }
                if (setorId) {
                    query = query.eq('colaboradores.setor_id', setorId);
                }

                const { data: rawData, error } = await query;
                if (error) throw error;

                const groups: Record<string, { total: number; count: number; is_positive: boolean }> = {};

                rawData?.forEach((row: any) => {
                    if (typeof row.answer_number !== 'number') return;
                    const dimData = row.form_questions?.form_hse_dimensions;
                    const dimName = dimData?.name;
                    if (!dimName) return;

                    if (!groups[dimName]) {
                        groups[dimName] = {
                            total: 0,
                            count: 0,
                            is_positive: dimData.is_positive === true
                        };
                    }
                    groups[dimName].total += row.answer_number;
                    groups[dimName].count += 1;
                });

                const processedData = Object.entries(groups).map(([name, stats]) => {
                    const avg = stats.total / stats.count;
                    return {
                        name,
                        value: Number(avg.toFixed(1)),
                        fill: getRiskColor(avg, stats.is_positive),
                        is_positive: stats.is_positive
                    };
                });

                // Sort for Chart: Positive Right (Top->Bottom), Negative Left (Bottom->Top) 
                // This sorting logic in chart component might be better, but let's prepare distinct lists here.

                setChartData(processedData);
                setPositiveDimensions(processedData.filter(d => d.is_positive).sort((a, b) => b.value - a.value)); // High scores first?
                setNegativeDimensions(processedData.filter(d => !d.is_positive).sort((a, b) => b.value - a.value));

            } catch (err) {
                console.error('Error in useDimensionAnalysis:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [unidadeId, setorId, JSON.stringify(formIds)]);

    return { loading, chartData, positiveDimensions, negativeDimensions };
};
