import { supabase } from '../services/supabase';
import type { HSEReportData } from '../components/reports/HSEReportModal';

const getRiskLevel = (avg: number, isPositive: boolean): string => {
    if (isPositive) {
        if (avg <= 1) return 'Alto';
        if (avg <= 2) return 'Moderado';
        if (avg <= 3) return 'Médio';
        return 'Baixo';
    } else {
        if (avg <= 1) return 'Baixo';
        if (avg <= 2) return 'Médio';
        if (avg <= 3) return 'Moderado';
        return 'Alto';
    }
};

export const generateHSEReport = async (formId: number): Promise<HSEReportData> => {
    // Fetch form data
    const { data: formData, error: formError } = await supabase
        .from('forms')
        .select(`
            *,
            unidades!inner (
                id,
                nome,
                empresa_mae,
                clientes!inner (nome_fantasia)
            )
        `)
        .eq('id', formId)
        .single();

    if (formError) throw formError;

    const companyName = formData?.unidades?.clientes?.nome_fantasia || 'Empresa';

    // Fetch all answers for this form
    const { data: rawData, error: answerError } = await supabase
        .from('form_answers')
        .select(`
            answer_number,
            respondedor,
            question_id,
            colaboradores!inner (unidade_id, setor_id),
            form_questions!inner (
                id,
                label,
                titulo_relatorio,
                plano_acao_item,
                form_hse_dimensions!inner (id, name, is_positive)
            )
        `)
        .in('form_id', [formId]);

    if (answerError) throw answerError;

    // Calculate dimension averages and per-question averages
    const dimGroups: Record<number, { name: string; total: number; count: number; is_positive: boolean }> = {};
    const questionGroups: Record<number, { label: string; tituloRelatorio: string; planoAcaoItem: string; dimId: number; total: number; count: number }> = {};
    const uniqueRespondents = new Set<string>();

    rawData?.forEach((row: any) => {
        if (typeof row.answer_number !== 'number') return;
        const qData = row.form_questions;
        const dimData = qData?.form_hse_dimensions;
        if (!dimData?.id || !dimData?.name) return;
        const qId = qData?.id || row.question_id;
        if (!qId) return;

        if (row.respondedor) uniqueRespondents.add(String(row.respondedor));

        // Dimension aggregation
        if (!dimGroups[dimData.id]) {
            dimGroups[dimData.id] = {
                name: dimData.name,
                total: 0,
                count: 0,
                is_positive: dimData.is_positive === true
            };
        }
        dimGroups[dimData.id].total += row.answer_number;
        dimGroups[dimData.id].count += 1;

        // Per-question aggregation
        if (!questionGroups[qId]) {
            questionGroups[qId] = {
                label: qData.label || `Pergunta ${qId}`,
                tituloRelatorio: qData.titulo_relatorio || '',
                planoAcaoItem: qData.plano_acao_item || '',
                dimId: dimData.id,
                total: 0,
                count: 0
            };
        }
        questionGroups[qId].total += row.answer_number;
        questionGroups[qId].count += 1;
    });

    // Build dimensions with items
    const dimensions = Object.entries(dimGroups).map(([id, stats]) => {
        const avg = stats.total / stats.count;
        const isPositive = stats.is_positive;

        const dimItems = Object.entries(questionGroups)
            .filter(([, q]) => q.dimId === Number(id))
            .map(([, q]) => {
                const qAvg = q.total / q.count;
                return {
                    questionLabel: q.label,
                    average: qAvg,
                    riskText: getRiskLevel(qAvg, isPositive)
                };
            });

        return {
            id: Number(id),
            name: stats.name,
            average: avg,
            isPositive: isPositive,
            riskLevel: getRiskLevel(avg, isPositive),
            items: dimItems
        };
    });

    // Generate strengths & weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    dimensions.forEach(d => {
        const level = d.riskLevel.toLowerCase();
        if (level === 'baixo') {
            strengths.push(`A dimensão "${d.name}" apresenta risco baixo (média ${d.average.toFixed(2)}), indicando um ponto forte da organização.`);
        } else if (level === 'médio') {
            strengths.push(`A dimensão "${d.name}" apresenta risco médio (média ${d.average.toFixed(2)}), sendo um aspecto adequado com espaço para melhoria.`);
        } else if (level === 'moderado') {
            weaknesses.push(`A dimensão "${d.name}" apresenta risco moderado (média ${d.average.toFixed(2)}), requerendo atenção e acompanhamento.`);
        } else if (level === 'alto') {
            weaknesses.push(`A dimensão "${d.name}" apresenta risco alto (média ${d.average.toFixed(2)}), demandando intervenção prioritária.`);
        }
    });

    // Fetch analysis text
    let analysisText = '';
    const { data: analysisData } = await supabase
        .from('view_hse_texto_analise')
        .select('texto_final_pronto')
        .in('form_id', [formId]);
    if (analysisData && analysisData.length > 0) {
        analysisText = analysisData.map((r: any) => r.texto_final_pronto).filter(Boolean).join('\n\n');
    }

    // Build action plans
    const actionPlans: { title: string; action: string }[] = [];
    Object.values(questionGroups).forEach(q => {
        const dimGroup = dimGroups[q.dimId];
        if (!dimGroup) return;
        const qAvg = q.total / q.count;
        const risk = getRiskLevel(qAvg, dimGroup.is_positive).toLowerCase();
        if ((risk === 'moderado' || risk === 'alto') && q.planoAcaoItem) {
            actionPlans.push({
                title: q.tituloRelatorio || q.label,
                action: q.planoAcaoItem
            });
        }
    });

    // Fetch conclusion text
    let conclusionText = '';
    const { data: conclusionData } = await supabase
        .from('view_hse_texto_conclusao')
        .select('texto_conclusao_pronto')
        .in('form_id', [formId]);
    if (conclusionData && conclusionData.length > 0) {
        conclusionText = conclusionData.map((r: any) => r.texto_conclusao_pronto).filter(Boolean).join('\n\n');
    }

    // Build report
    return {
        companyName,
        respondentsCount: uniqueRespondents.size,
        reportDate: new Date().toLocaleDateString('pt-BR'),
        dimensions,
        texts: { strengths, weaknesses },
        analysisText: analysisText || undefined,
        actionPlans,
        conclusionText: conclusionText || undefined
    };
};
