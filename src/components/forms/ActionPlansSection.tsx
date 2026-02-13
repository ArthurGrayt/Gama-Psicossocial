import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Info } from 'lucide-react';

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
    const [actionPlans, setActionPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateActionPlans = async () => {
            if (!formIds || formIds.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // 1. Fetch rules
                const { data: rulesData } = await supabase.from('form_hse_rules').select('*');
                const rules: RiskRule[] = rulesData || [];

                // 2. Fetch answers grouped by question
                let query = supabase
                    .from('form_answers')
                    .select('answer_number, question_id')
                    .in('form_id', formIds)
                    .not('answer_number', 'is', null);

                if (unidadeId) query = query.eq('unidade_colaborador', unidadeId);
                if (setorId) {
                    // Filter by sector via collaborator's cargo
                    const { data: roles } = await supabase.from('cargos').select('id').eq('setor_id', setorId);
                    const roleIds = (roles || []).map(r => r.id);
                    if (roleIds.length > 0) query = query.in('cargo', roleIds);
                    else {
                        setLoading(false);
                        return;
                    }
                }

                const { data: answersData } = await query;
                if (!answersData) {
                    setLoading(false);
                    return;
                }

                // Aggregate average per question
                const questionStats: Record<number, { total: number, count: number }> = {};
                answersData.forEach(ans => {
                    if (!questionStats[ans.question_id]) questionStats[ans.question_id] = { total: 0, count: 0 };
                    questionStats[ans.question_id].total += Number(ans.answer_number);
                    questionStats[ans.question_id].count += 1;
                });

                const questionAverages = Object.entries(questionStats).map(([id, stats]) => ({
                    questionId: Number(id),
                    avg: stats.total / stats.count
                }));

                // 3. Fetch question details for these questions
                const questionIds = questionAverages.map(q => q.questionId);
                const { data: questionsData } = await supabase
                    .from('form_questions')
                    .select('id, label, hse_dimension_id, plano_acao_item, titulo_relatorio')
                    .in('id', questionIds);

                const questionsMap: Record<number, any> = {};
                questionsData?.forEach(q => { questionsMap[q.id] = q; });

                // 4. Combine and Filter by Risk
                const plans: any[] = [];
                questionAverages.forEach(qAvg => {
                    const question = questionsMap[qAvg.questionId];
                    if (!question || !question.hse_dimension_id) return;

                    // Find matching rule for this question's dimension and score
                    const rule = rules.find(r =>
                        r.dimension_id === question.hse_dimension_id &&
                        qAvg.avg >= r.min_val &&
                        qAvg.avg <= r.max_val
                    );

                    if (rule && !rule.is_ponto_forte && (rule.risk_label.includes('Moderado') || rule.risk_label.includes('Alto'))) {
                        plans.push({
                            id: qAvg.questionId,
                            title: question.titulo_relatorio || question.label, // Fallback to label if title is missing
                            text: question.plano_acao_item || "Nenhuma recomendação cadastrada para este item.",
                            riskLabel: rule.risk_label,
                            score: qAvg.avg,
                        });
                    }
                });

                setActionPlans(plans);
            } catch (err) {
                console.error('Error calculating action plans:', err);
            } finally {
                setLoading(false);
            }
        };

        calculateActionPlans();
    }, [unidadeId, setorId, JSON.stringify(formIds)]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#35b6cf] mb-4"></div>
                <p>Analisando itens e gerando planos de ação...</p>
            </div>
        );
    }

    if (actionPlans.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm px-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Excelente!</h3>
                <p className="text-slate-500">
                    Nenhum item individual foi classificado com risco moderado ou alto sob os filtros selecionados.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {actionPlans.map((plan, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
                    >
                        {/* Card Header & Content unified */}
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-slate-800 leading-tight">
                                        {plan.riskLabel} em {plan.title}
                                    </h4>
                                </div>
                                <div
                                    className={`rounded-xl px-3 py-2 text-center shrink-0 border transition-colors ${plan.riskLabel.includes('Alto')
                                        ? 'bg-rose-50 border-rose-100 text-rose-600'
                                        : 'bg-orange-50 border-orange-100 text-orange-600'
                                        }`}
                                >
                                    <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5 opacity-70">Média</p>
                                    <p className="text-lg font-black leading-none">{plan.score.toFixed(1)}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#35b6cf] to-transparent rounded-full opacity-20"></div>
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Info size={12} className="text-[#35b6cf]" />
                                    Plano Recomendado
                                </h5>
                                <p className="text-slate-600 leading-relaxed font-medium text-[14px]">
                                    {plan.text}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
