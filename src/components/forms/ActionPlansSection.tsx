import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useDimensionAnalysis } from '../../hooks/useDimensionAnalysis';
import { AlertTriangle, Info, ChevronRight, ShieldAlert } from 'lucide-react';

interface ActionPlansSectionProps {
    unidadeId: number | null;
    setorId: number | null;
    formIds: number[];
}

interface RiskRule {
    dimension_id: number;
    min_val: number;
    max_val: number;
    risk_label: string;
    texto_analise: string;
    is_ponto_forte: boolean;
}

export const ActionPlansSection: React.FC<ActionPlansSectionProps> = ({ unidadeId, setorId, formIds }) => {
    const { loading: dataLoading, chartData } = useDimensionAnalysis({
        unidadeId,
        setorId,
        formIds
    });

    const [rules, setRules] = useState<RiskRule[]>([]);
    const [loadingRules, setLoadingRules] = useState(true);

    useEffect(() => {
        const fetchRules = async () => {
            setLoadingRules(true);
            try {
                const { data, error } = await supabase
                    .from('form_hse_rules')
                    .select('*');

                if (error) throw error;
                setRules(data || []);
            } catch (err) {
                console.error('Error fetching risk rules:', err);
            } finally {
                setLoadingRules(false);
            }
        };

        fetchRules();
    }, []);

    if (dataLoading || loadingRules) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#35b6cf] mb-4"></div>
                <p>Analisando riscos e gerando planos de ação...</p>
            </div>
        );
    }

    // Filter dimensions that match "Moderado" or "Alto" risk rules
    const actionPlans = chartData.flatMap(dim => {
        // Find the rule that matches this dimension's score
        const matchingRule = rules.find(rule =>
            rule.dimension_id === dim.id &&
            dim.value >= rule.min_val &&
            dim.value <= rule.max_val
        );

        // Only include if it's Moderate or High risk (usually not a "ponto forte")
        if (matchingRule && !matchingRule.is_ponto_forte && (matchingRule.risk_label.includes('Moderado') || matchingRule.risk_label.includes('Alto'))) {
            return [{
                ...matchingRule,
                dimensionName: dim.name,
                score: dim.value
            }];
        }
        return [];
    });

    if (actionPlans.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm px-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Excelente!</h3>
                <p className="text-slate-500">
                    Nenhuma dimensão foi classificada com risco moderado ou alto sob os filtros selecionados. Sua equipe apresenta indicadores saudáveis nestas áreas.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">Planos de Ação Recomendados</h3>
                    <p className="text-slate-500 mt-1">Baseado nos indicadores de risco moderado e alto identificados.</p>
                </div>
                <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
                    <ShieldAlert size={18} className="text-rose-500" />
                    <span className="text-sm font-bold text-rose-600">{actionPlans.length} Demandas Críticas</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {actionPlans.map((plan, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
                    >
                        {/* Card Header */}
                        <div className="p-6 pb-4 flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${plan.risk_label.includes('Alto')
                                            ? 'bg-rose-50 text-rose-500 border-rose-100'
                                            : 'bg-orange-50 text-orange-600 border-orange-100'
                                        }`}>
                                        {plan.risk_label}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">•</span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{plan.dimensionName}</span>
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-[#35b6cf] transition-colors">
                                    {plan.risk_label} em {plan.dimensionName}
                                </h4>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Média</span>
                                <span className="text-lg font-bold text-slate-700 leading-none">{plan.score.toFixed(1)}</span>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="px-6 py-4 flex-1">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
                                <div className="flex gap-3">
                                    <div className="shrink-0 mt-0.5">
                                        <AlertTriangle size={16} className={plan.risk_label.includes('Alto') ? 'text-rose-400' : 'text-orange-400'} />
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                                        "{plan.texto_analise}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                            <button className="text-xs font-bold text-[#35b6cf] hover:text-[#2ca3bc] flex items-center gap-1 transition-colors">
                                Detalhar plano completo
                                <ChevronRight size={14} />
                            </button>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
