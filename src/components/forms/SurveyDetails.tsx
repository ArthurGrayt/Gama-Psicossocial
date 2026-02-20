import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Copy, Search, FileText, X, Building2, Tags, ChevronDown } from 'lucide-react';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Select } from '../ui/Select';
import type { Form } from '../../types';
import { DimensionAnalysisSection } from './DimensionAnalysisSection';
import { ActionPlansSection } from './ActionPlansSection';
import { HSEReportModal } from '../reports/HSEReportModal';
import type { HSEReportData } from '../reports/HSEReportModal';

interface SurveyDetailsProps {
    form: Form;
    onBack: () => void;
}

// RADIAL_DATA and QUESTIONS_LIST would ideally be fetched based on the form type (HSE vs others)
// For now keeping them as UI demonstration while focusing on Collaborator/Sector data as requested.


const QUESTIONS_LIST = [
    { id: 1, text: "O meu trabalho exige que eu trabalhe muito rápido.", category: "Demanda" },
    { id: 2, text: "O meu trabalho exige muito de mim intelectualmente.", category: "Demanda" },
    { id: 3, text: "Tenho possibilidade de decidir como realizar o meu trabalho.", category: "Controle" },
    { id: 4, text: "Recebo apoio dos meus colegas para realizar o trabalho.", category: "Apoio Social" },
];

export const SurveyDetails: React.FC<SurveyDetailsProps> = ({ form, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedSector, setSelectedSector] = useState<string>('');
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [units, setUnits] = useState<{ id: number, nome: string }[]>([]);
    const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);


    // REAL DATA STATE
    const [sectors, setSectors] = useState<{ id: number, nome: string }[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [totalColabs, setTotalColabs] = useState(0);
    const [totalResponses, setTotalResponses] = useState(0);
    const [recentResponses, setRecentResponses] = useState<any[]>([]);
    const [formIds, setFormIds] = useState<number[]>([]);

    // --- PARTICIPATION MODAL STATE ---
    const [showParticipationModal, setShowParticipationModal] = useState(false);
    const [participationTab, setParticipationTab] = useState<'participants' | 'pending'>('participants');
    const [participationSearch, setParticipationSearch] = useState('');
    const [participantsList, setParticipantsList] = useState<any[]>([]);
    const [pendingList, setPendingList] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [dbStats, setDbStats] = useState({ participants: 0, pending: 0 });

    // --- HSE REPORT STATE ---
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportData, setReportData] = useState<HSEReportData | null>(null);
    const [reportLoading, setReportLoading] = useState(false);



    const fetchSectors = async () => {
        try {
            let sectorIdsToFetch: number[] = [];

            if (selectedUnit) {
                // Fetch specific unit's sectors array
                const { data: unitData } = await supabase
                    .from('unidades')
                    .select('setores')
                    .eq('id', selectedUnit)
                    .single();

                if (unitData && unitData.setores) {
                    sectorIdsToFetch = unitData.setores;
                }
            } else {
                // Logic for "All Units" (Company View) or Single Form View
                const isCompanyLevel = !(form as any).slug && (form as any).cliente_uuid;

                if (isCompanyLevel) {
                    // Fetch all sectors for the company's units
                    const { data: companyUnits } = await supabase
                        .from('unidades')
                        .select('setores')
                        .eq('empresa_mae', (form as any).cliente_uuid);

                    if (companyUnits) {
                        // Flatten all sectors from all units
                        const allSectorIds = companyUnits.flatMap(u => u.setores || []);
                        sectorIdsToFetch = Array.from(new Set(allSectorIds));
                    }
                } else {
                    // Single Form/Unit View fallback
                    let sectorIds: number[] = (form as any).setores || [];
                    if (sectorIds.length === 0 && form.unidade_id) {
                        // Fetch unit sectors
                        const { data: unitData } = await supabase
                            .from('unidades')
                            .select('setores')
                            .eq('id', form.unidade_id)
                            .single();
                        if (unitData && unitData.setores) {
                            sectorIds = unitData.setores;
                        }
                    }
                    sectorIdsToFetch = sectorIds;
                }
            }

            if (sectorIdsToFetch.length > 0) {
                const { data: sectorsData } = await supabase
                    .from('setor')
                    .select('id, nome')
                    .in('id', sectorIdsToFetch);
                setSectors(sectorsData || []);
            } else {
                setSectors([]);
            }
        } catch (error) {
            console.error('Error fetching sectors:', error);
        }
    };


    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const isCompanyLevel = !(form as any).slug;
            const targetCompanyUuid = (form as any).cliente_uuid;

            // Strict Check: If company level, we MUST have a client UUID to filter by.
            if (isCompanyLevel && !targetCompanyUuid) {
                console.error("Missing client UUID for company level form.");
                setLoading(false);
                return;
            }

            // Parallel Fetching Groups
            const promises: any[] = [];

            // 1. Fetch Questions (Independent)
            const questionsPromise = supabase
                .from('form_questions')
                .select('*')
                .order('question_order')
                .then(({ data }) => setQuestions(data || []));
            promises.push(questionsPromise);

            // 2. Fetch Units (Filtered by Company)
            let unitsPromise = Promise.resolve();
            if (isCompanyLevel && targetCompanyUuid) {
                unitsPromise = supabase
                    .from('unidades')
                    .select('id, nome')
                    .eq('empresa_mae', targetCompanyUuid) // STRICT FILTER
                    .then(({ data }) => setUnits(data || [])) as any;
            }
            promises.push(unitsPromise);

            // 3. Resolve Form IDs & Fetch Recent Responses (Optimized)
            const responsesPromise = (async () => {
                let localFormIds: number[] = [];

                if (isCompanyLevel && targetCompanyUuid) {
                    // Optimized: Fetch form_ids directly linked to units of this company
                    // This replaces the "Units -> Colabs -> Answers" waterfall
                    const { data: answers } = await supabase
                        .from('form_answers')
                        .select(`
                            form_id,
                            colaboradores!inner (
                                unidade_id,
                                unidades!inner (
                                    id,
                                    empresa_mae
                                )
                            )
                        `)
                        .eq('colaboradores.unidades.empresa_mae', targetCompanyUuid); // STRICT FILTER via Join

                    localFormIds = Array.from(new Set((answers || []).map((a: any) => a.form_id)));
                } else {
                    localFormIds = [form.id];
                }

                // Update state for Radar Chart
                if (localFormIds.length > 0) {
                    setFormIds(localFormIds);
                } else {
                    setRecentResponses([]);
                    return;
                }

                // Fetch Recent Responses (Limit 50 & Filtered)
                const { data: recentData } = await supabase
                    .from('form_answers')
                    .select(`
                        id, 
                        created_at, 
                        respondedor,
                        colaboradores (nome, id)
                    `)
                    .in('form_id', localFormIds)
                    .order('created_at', { ascending: false })
                    .limit(50); // Performance Fix: Limit History

                const mappedRecent: any[] = [];
                const seenResponders = new Set();
                for (const r of (recentData || [])) {
                    if (!seenResponders.has(r.respondedor)) {
                        mappedRecent.push({
                            id: r.id,
                            name: (r as any).colaboradores?.nome || 'Anônimo',
                            submitted_at: new Date(r.created_at).toLocaleString(),
                            status: 'completed'
                        });
                        seenResponders.add(r.respondedor);
                    }
                }
                setRecentResponses(mappedRecent);
            })();
            promises.push(responsesPromise);

            await Promise.all(promises);

        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredStats = async () => {
        try {
            // 1. Determine Scope
            const isCompanyLevel = !(form as any).slug;
            const sectorId = selectedSector ? sectors.find(s => s.nome === selectedSector)?.id : null;

            // 2. Resolve Form IDs (Optimized)
            let formIds: number[] = [];
            const targetCompanyUuid = (form as any).cliente_uuid;

            if (isCompanyLevel && targetCompanyUuid) {
                const { data: answers } = await supabase
                    .from('form_answers')
                    .select(`
                        form_id,
                        colaboradores!inner (
                            unidade_id,
                            unidades!inner (
                                id,
                                empresa_mae
                            )
                        )
                    `)
                    .eq('colaboradores.unidades.empresa_mae', targetCompanyUuid);

                formIds = Array.from(new Set((answers || []).map((a: any) => a.form_id)));
            } else {
                formIds = [form.id];
            }

            // 3. Total Colabs (Denominator)
            let colabQuery = supabase
                .from('colaboradores')
                .select('*', { count: 'exact', head: true })
                .is('data_desligamento', null);

            if (selectedUnit) {
                colabQuery = colabQuery.eq('unidade_id', selectedUnit);
            } else if (isCompanyLevel) {
                // If company level, we need all collaborators of all units of this company
                // Since FormDashboard already calculated total_collaborators, we can use it as base
                // but for sector filtering we need a real query.
                const { data: units } = await supabase
                    .from('unidades')
                    .select('id')
                    .eq('empresa_mae', (form as any).cliente_uuid);
                const unitIds = (units || []).map(u => u.id);
                colabQuery = colabQuery.in('unidade_id', unitIds);
            } else {
                colabQuery = colabQuery.eq('unidade_id', form.unidade_id);
            }

            if (sectorId) {
                // Pre-fetch roles for the sector to filter BOTH colabQuery and responseQuery
                const { data: roles } = await supabase
                    .from('cargos')
                    .select('id')
                    .eq('setor_id', sectorId);

                const validRoleIds = (roles || []).map(r => r.id);

                if (validRoleIds.length > 0) {
                    colabQuery = colabQuery.in('cargo_id', validRoleIds);
                } else {
                    // Sector selected but no roles found? Force 0 results.
                    colabQuery = colabQuery.in('cargo_id', [-1]);
                }
            }

            const { count: colabCount } = await colabQuery;
            setTotalColabs(colabCount || 0);

            // 4. Responses Count (Numerator)
            if (formIds.length > 0) {
                let responseQuery = supabase
                    .from('form_answers')
                    .select('respondedor, cargo')
                    .in('form_id', formIds);

                const { data: respData } = await responseQuery;

                let filteredResps = respData || [];

                if (sectorId) {
                    // Filter responses by sector using PRE-FETCHED roles
                    // We need to fetch roles again if not already fetched? 
                    // No, we can re-query or reuse if we scope variables correctly.
                    // But here I'm replacing the block so I need to re-fetch if I didn't lift variable scope.
                    // Actually, simpler to just re-fetch or duplicate logic inside this block? 
                    // Wait, I can't easily share state between the two blocks unless I rewrite the WHOLE function.
                    // FOR NOW: I will re-fetch inside the second block or rely on independent query essentially keeping it safe.
                    // BUT for consisteny, the first block MODIFIES colabQuery.

                    // Let's just use the same logic: query roles again. It's an extra request but safe.
                    const { data: rolesInSector } = await supabase
                        .from('cargos')
                        .select('id')
                        .eq('setor_id', sectorId);
                    const roleIdsInSector = new Set((rolesInSector || []).map(r => r.id));
                    filteredResps = filteredResps.filter(r => roleIdsInSector.has(r.cargo));
                }

                const uniqueResponders = new Set(filteredResps.map(r => r.respondedor));
                setTotalResponses(uniqueResponders.size);
            } else {
                setTotalResponses(0);
            }

        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [form.id]);

    useEffect(() => {
        fetchSectors();
    }, [selectedUnit, form.id]);

    useEffect(() => {
        fetchFilteredStats();
    }, [selectedSector, selectedUnit, sectors]);

    // Custom shape function defined inside to access hoveredIndex


    const fetchParticipationDetails = async () => {
        setModalLoading(true);
        try {
            // 1. Determine Scope
            const isCompanyLevel = !(form as any).slug && (form as any).cliente_uuid;
            const targetClientUuid = (form as any).cliente_uuid;

            // 1.1 Get Unit IDs
            let unitIds: number[] = [];
            if (isCompanyLevel) {
                const { data: units } = await supabase
                    .from('unidades')
                    .select('id')
                    .eq('empresa_mae', targetClientUuid);
                unitIds = (units || []).map(u => u.id);
            } else if (selectedUnit) {
                unitIds = [Number(selectedUnit)];
            } else if (form.unidade_id) {
                unitIds = [form.unidade_id];
            }

            if (unitIds.length === 0) {
                setDbStats({ participants: 0, pending: 0 });
                setParticipantsList([]);
                setPendingList([]);
                return;
            }

            // 2. Fetch Forms & Respondents
            let formQuery = supabase.from('forms').select('id, colaboladores_inclusos');
            if (isCompanyLevel) {
                formQuery = formQuery.in('unidade_id', unitIds);
            } else {
                formQuery = formQuery.eq('id', form.id);
            }

            const { data: formsData, error: formsError } = await formQuery;
            if (formsError) throw formsError;

            const currentFormIds = (formsData || []).map(f => f.id);

            // Fetch actual respondents
            const { data: answersData, error: answersError } = await supabase
                .from('form_answers')
                .select('respondedor')
                .in('form_id', currentFormIds);

            if (answersError) throw answersError;

            const allInvitedIds = new Set<string>();
            const allRespondentIds = new Set<string>();

            (formsData || []).forEach((f: any) => {
                (f.colaboladores_inclusos || []).forEach((id: any) => {
                    if (id) allInvitedIds.add(String(id));
                });
            });

            (answersData || []).forEach((a: any) => {
                if (a.respondedor) allRespondentIds.add(String(a.respondedor));
            });


            // 2. Fetch Actual Collaborators for the List
            const sectorId = selectedSector ? sectors.find(s => s.nome === selectedSector)?.id : null;

            let colabQuery = supabase
                .from('colaboradores')
                .select('id, nome, email, sexo, data_nascimento, cargo_id, cargo, setor, cargos(nome), data_desligamento')
                .in('unidade_id', unitIds);

            if (sectorId) {
                const { data: roles } = await supabase
                    .from('cargos')
                    .select('id')
                    .eq('setor_id', sectorId);
                const validRoleIds = (roles || []).map(r => r.id);
                if (validRoleIds.length > 0) {
                    colabQuery = colabQuery.in('cargo_id', validRoleIds);
                } else {
                    colabQuery = colabQuery.in('cargo_id', [-1]);
                }
            }

            const { data: fetchedCollaborators, error: colabError } = await colabQuery;
            if (colabError) throw colabError;

            // 4. Filter & Categorize
            let relevantCollaborators = fetchedCollaborators || [];

            // If we have an explicit invite list, filter by it
            if (allInvitedIds.size > 0) {
                relevantCollaborators = relevantCollaborators.filter(c => allInvitedIds.has(String(c.id)));
            }

            // Split into Responded vs Pending
            const participated = relevantCollaborators.filter(c => allRespondentIds.has(String(c.id)));
            const pending = relevantCollaborators.filter(c => !allRespondentIds.has(String(c.id)) && !c.data_desligamento);

            setParticipantsList(participated);
            setPendingList(pending);

            setDbStats({
                participants: participated.length,
                pending: pending.length
            });

        } catch (error) {
            console.error('Error fetching participation details:', error);
        } finally {
            setModalLoading(false);
        }
    };

    // --- HSE REPORT LOGIC ---
    const getRiskLevel = (avg: number, isPositive: boolean): string => {
        if (!isPositive) {
            // DIRECT: Higher mean = Higher risk
            if (avg >= 3.0) return 'Alto';
            if (avg >= 2.0) return 'Moderado';
            if (avg >= 1.0) return 'Médio';
            return 'Baixo';
        } else {
            // INVERSE: Lower mean = Higher risk
            if (avg < 1.0) return 'Alto';
            if (avg < 2.0) return 'Moderado';
            if (avg < 3.0) return 'Médio';
            return 'Baixo';
        }
    };

    const handleOpenReport = async () => {
        setReportLoading(true);
        try {
            const isCompanyLevel = !(form as any).slug && (form as any).cliente_uuid;
            const targetClientUuid = (form as any).cliente_uuid;

            // 1. Resolve company name
            let companyName = form.title || 'Empresa';
            if (targetClientUuid) {
                const { data: clientData } = await supabase
                    .from('clientes')
                    .select('nome_fantasia')
                    .eq('cliente_uuid', targetClientUuid)
                    .single();
                if (clientData?.nome_fantasia) companyName = clientData.nome_fantasia;
            }

            // 2. Resolve form IDs (same logic as fetchFilteredStats)
            let localFormIds: number[] = [];
            if (isCompanyLevel && targetClientUuid) {
                const { data: answers } = await supabase
                    .from('form_answers')
                    .select(`
                        form_id,
                        colaboradores!inner (
                            unidade_id,
                            unidades!inner ( id, empresa_mae )
                        )
                    `)
                    .eq('colaboradores.unidades.empresa_mae', targetClientUuid);
                localFormIds = Array.from(new Set((answers || []).map((a: any) => a.form_id)));
            } else {
                localFormIds = formIds.length > 0 ? formIds : [form.id];
            }

            if (localFormIds.length === 0) {
                setReportLoading(false);
                return;
            }

            // 3. Fetch all answers with dimension info (respecting unit/sector filters)
            let query = supabase
                .from('form_answers')
                .select(`
                    answer_number,
                    respondedor,
                    question_id,
                    colaboradores!inner ( unidade_id, setor_id ),
                    form_questions!inner (
                        id,
                        label,
                        titulo_relatorio,
                        plano_acao_item,
                        form_hse_dimensions!inner ( id, name, is_positive )
                    )
                `)
                .in('form_id', localFormIds);

            if (selectedUnit) {
                query = query.eq('colaboradores.unidade_id', Number(selectedUnit));
            }
            const sectorId = selectedSector ? sectors.find(s => s.nome === selectedSector)?.id : null;
            if (sectorId) {
                query = query.eq('colaboradores.setor_id', sectorId);
            }

            const { data: rawData, error } = await query;
            if (error) throw error;

            // 4. Calculate dimension averages AND per-question averages
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

            const dimensions = Object.entries(dimGroups).map(([id, stats]) => {
                const avg = stats.total / stats.count;
                const isPositive = stats.is_positive;

                // Collect items for this dimension
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

            // 5. Generate strengths & weaknesses
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

            // 6. Fetch analysis text from view
            let analysisText = '';
            const reportFormIds = localFormIds;
            if (reportFormIds.length > 0) {
                const { data: analysisData } = await supabase
                    .from('view_hse_texto_analise')
                    .select('texto_final_pronto')
                    .in('form_id', reportFormIds);
                if (analysisData && analysisData.length > 0) {
                    analysisText = analysisData.map((r: any) => r.texto_final_pronto).filter(Boolean).join('\n\n');
                }
            }

            // 7. Build action plans from items with moderate/high risk
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

            // 8. Fetch conclusion text from view
            let conclusionText = '';
            if (reportFormIds.length > 0) {
                const { data: conclusionData } = await supabase
                    .from('view_hse_texto_conclusao')
                    .select('texto_conclusao_pronto')
                    .in('form_id', reportFormIds);
                if (conclusionData && conclusionData.length > 0) {
                    conclusionText = conclusionData.map((r: any) => r.texto_conclusao_pronto).filter(Boolean).join('\n\n');
                }
            }

            // 9. Build report data
            const report: HSEReportData = {
                companyName,
                respondentsCount: uniqueRespondents.size,
                reportDate: new Date().toLocaleDateString('pt-BR'),
                dimensions,
                texts: { strengths, weaknesses },
                analysisText: analysisText || undefined,
                actionPlans,
                conclusionText: conclusionText || undefined
            };

            setReportData(report);
            setIsReportOpen(true);
        } catch (err) {
            console.error('Error generating report:', err);
        } finally {
            setReportLoading(false);
        }
    };

    const handleOpenParticipation = () => {
        setShowParticipationModal(true);
        fetchParticipationDetails();
    };

    const filteredParticipationList = (participationTab === 'participants' ? participantsList : pendingList).filter(p =>
        p.nome.toLowerCase().includes(participationSearch.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(participationSearch.toLowerCase()))
    );

    if (loading) return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#35b6cf] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-bold text-slate-400">Carregando detalhes do levantamento...</p>
            </div>
        </div>
    );

    // Derive Sectors from State
    const distinctSectors = sectors.map(s => s.nome);

    const tabs = [
        { value: 'overview', label: 'Visão Geral' },
        { value: 'analysis', label: 'Análise Interpretativa' },
        { value: 'recorte', label: 'Planos de ação' },
    ];

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[calc(100vh-140px)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                {/* HERDER */}
                <div className="border-b border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="font-bold text-xl text-slate-800 tracking-tight">
                                    {form.title || (form as any).name || 'Detalhes do Levantamento'}
                                </h2>
                            </div>
                            {/* Sector Dropdown Replacement */}
                            <div className="mt-4 grid grid-cols-2 md:flex md:items-center gap-2 md:gap-3 w-full md:w-auto">
                                {units.length > 0 && (
                                    <div className="md:min-w-[180px]">
                                        <Select
                                            value={selectedUnit}
                                            onChange={(val) => {
                                                setSelectedUnit(val);
                                                setSelectedSector(''); // Reset sector when unit changes
                                            }}
                                            options={[
                                                { label: 'Todas as Unidades', value: '' },
                                                ...units.map(unit => ({ label: unit.nome, value: String(unit.id) }))
                                            ]}
                                            placeholder="Todas as Unidades"
                                            className="w-full"
                                        />
                                    </div>
                                )}

                                <div className="md:min-w-[180px]">
                                    <Select
                                        value={selectedSector}
                                        onChange={(val) => setSelectedSector(val)}
                                        options={[
                                            { label: 'Todos os Setores', value: '' },
                                            ...distinctSectors.map(sector => ({ label: sector, value: sector }))
                                        ]}
                                        placeholder="Todos os Setores"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <SegmentedControl
                            options={tabs}
                            value={activeTab}
                            onChange={setActiveTab}
                            className="flex-1 md:flex-none"
                        />
                        {(form as any).slug && (
                            <button className="flex items-center gap-2 bg-[#35b6cf] hover:bg-[#2ca1b7] text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm active:scale-95">
                                <Copy size={16} />
                                <span className="hidden sm:inline">Copiar Link</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 p-8 bg-slate-50/50 overflow-y-auto">

                    {/* --- TAB A: VISÃO GERAL --- */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 max-w-7xl mx-auto">
                            {/* Status Cards Row (New Design) */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                {/* Participação */}
                                <div
                                    onClick={handleOpenParticipation}
                                    className="p-4 md:p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors group relative"
                                >
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Search size={16} className="text-slate-400" />
                                    </div>
                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 md:mb-2">Participação</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl md:text-3xl font-bold text-slate-900">
                                            {totalResponses}
                                        </span>
                                        <span className="text-sm md:text-lg text-slate-400 font-medium">
                                            /{totalColabs}
                                        </span>
                                    </div>
                                </div>

                                {/* Total de Perguntas */}
                                <div className="p-4 md:p-6 flex flex-col items-center justify-center text-center">
                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 md:mb-2">Total de Perguntas</p>
                                    <span className="text-2xl md:text-3xl font-bold text-slate-900">
                                        {form.questions?.length || questions.length || 0}
                                    </span>
                                </div>

                                {/* Tempo Médio */}
                                <div className="p-4 md:p-6 flex flex-col items-center justify-center text-center">
                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 md:mb-2">Tempo Médio</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl md:text-3xl font-bold text-slate-900">--</span>
                                        <span className="text-sm md:text-lg text-slate-900 font-bold">min</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Responses Table (New Design) */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                                    <h3 className="font-bold text-lg text-slate-800">Respostas Recentes</h3>
                                    <div className="relative w-full md:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar colaborador..."
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="hidden md:table w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <th className="px-8 py-4">Participante</th>
                                                <th className="px-8 py-4">Data Envio</th>
                                                <th className="px-8 py-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {recentResponses.map((p) => (
                                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                                {p.name ? p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-700">{p.name || 'Anônimo'}</p>
                                                                <p className="text-xs text-slate-400">Identificado</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className="text-sm text-slate-500 font-medium">
                                                            {p.submitted_at}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4 text-right">
                                                        <button
                                                            onClick={() => setSelectedParticipant(p)}
                                                            className="text-slate-400 hover:text-[#35b6cf] transition-colors p-2 hover:bg-slate-50 rounded-lg"
                                                            title="Ver Respostas"
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Mobile View */}
                                    <div className="md:hidden divide-y divide-slate-100">
                                        {recentResponses.map((p) => (
                                            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                        {p.name ? p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700 text-sm">{p.name || 'Anônimo'}</p>
                                                        <p className="text-[10px] text-slate-400">{p.submitted_at}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedParticipant(p)}
                                                    className="p-2 text-[#35b6cf] bg-[#35b6cf]/10 rounded-lg"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB B: ANÁLISE INTERPRETATIVA --- */}
                    {activeTab === 'analysis' && (
                        <DimensionAnalysisSection
                            unidadeId={selectedUnit ? Number(selectedUnit) : (form.unidade_id || null)}
                            setorId={selectedSector ? sectors.find(s => s.nome === selectedSector)?.id || null : null}
                            formIds={formIds}
                        />
                    )}



                    {/* --- TAB C: PLANOS DE AÇÃO --- */}
                    {activeTab === 'recorte' && (
                        <ActionPlansSection
                            unidadeId={selectedUnit ? Number(selectedUnit) : (form.unidade_id || null)}
                            setorId={selectedSector ? sectors.find(s => s.nome === selectedSector)?.id || null : null}
                            formIds={formIds}
                        />
                    )}

                </div >

                {/* RESPONSE MODAL */}
                {
                    selectedParticipant && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4 animate-in zoom-in-95 duration-200">
                                {/* Header */}
                                <div className="flex items-start justify-between p-6 border-b border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#35b6cf]/10 flex items-center justify-center text-[#35b6cf] font-bold text-lg">
                                            {selectedParticipant.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{selectedParticipant.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <span>{selectedParticipant.sector}</span>
                                                <span>•</span>
                                                <span>{selectedParticipant.submitted_at}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedParticipant(null)}
                                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {QUESTIONS_LIST.map((q, idx) => (
                                        <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-[#35b6cf] uppercase tracking-wider">{q.category}</span>
                                                <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                                            </div>
                                            <p className="font-medium text-slate-800 mb-3">{q.text}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500">Resposta:</span>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((val) => {
                                                        // Mock random answer strictly for UI demo based on question ID + participant ID
                                                        const mockAnswer = ((q.id + selectedParticipant.id) % 5) + 1;
                                                        const isSelected = val === mockAnswer;
                                                        return (
                                                            <div
                                                                key={val}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${isSelected
                                                                    ? 'bg-[#35b6cf] border-[#35b6cf] text-white shadow-sm'
                                                                    : 'bg-white border-slate-200 text-slate-300'
                                                                    }`}
                                                            >
                                                                {val}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                                    <button
                                        onClick={() => setSelectedParticipant(null)}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* --- PARTICIPATION DETAILS MODAL --- */}
                {
                    showParticipationModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 fade-in animate-in duration-200">
                            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl scale-in zoom-in-95 duration-200">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800">Detalhes de Participação</h3>
                                    <button
                                        onClick={() => setShowParticipationModal(false)}
                                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Stats Row */}
                                <div className="px-6 py-6 grid grid-cols-2 gap-4">
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col">
                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Participantes</span>
                                        <span className="text-3xl font-bold text-emerald-700">{dbStats.participants}</span>
                                    </div>
                                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex flex-col">
                                        <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Pendentes</span>
                                        <span className="text-3xl font-bold text-orange-700">{dbStats.pending}</span>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="px-6 border-b border-slate-100 flex gap-1 bg-slate-50/50 mx-6 rounded-lg p-1 mb-4">
                                    <button
                                        onClick={() => setParticipationTab('participants')}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${participationTab === 'participants'
                                            ? 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Participantes
                                    </button>
                                    <button
                                        onClick={() => setParticipationTab('pending')}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${participationTab === 'pending'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Pendentes
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="px-6 pb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            value={participationSearch}
                                            onChange={(e) => setParticipationSearch(e.target.value)}
                                            placeholder="Buscar em participantes..."
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* List Area */}
                                <div className="flex-1 overflow-y-auto min-h-[300px] border-t border-slate-100 bg-slate-50/30">
                                    {modalLoading ? (
                                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                            Carregando dados...
                                        </div>
                                    ) : filteredParticipationList.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {/* Header Row for List */}
                                            <div className="px-4 md:px-6 py-3 bg-slate-50 flex items-center text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <div className="flex-1">Colaborador</div>
                                                <div className="w-40 hidden md:block">Cargo</div>
                                                <div className="w-20 hidden lg:block text-center">Sexo</div>
                                                <div className="w-28 hidden sm:block text-right">Nascimento</div>
                                            </div>
                                            {filteredParticipationList.map((p: any) => (
                                                <div key={p.id} className="px-4 md:px-6 py-3 flex items-center hover:bg-white transition-colors group text-sm">
                                                    {/* Nome */}
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="font-bold text-slate-700 truncate">{p.nome || 'Sem Nome'}</div>
                                                        <div className="md:hidden text-[10px] text-slate-400 truncate">
                                                            {p.cargos?.nome || p.cargo || p.cargo_rel?.nome || '-'}
                                                        </div>
                                                    </div>

                                                    {/* Cargo */}
                                                    {p.cargos?.nome || p.cargo || p.cargo_rel?.nome || '-'}

                                                    {/* Sexo */}
                                                    <div className="w-20 hidden lg:block text-slate-500 text-center">
                                                        {p.sexo || '-'}
                                                    </div>

                                                    {/* Data Nascimento */}
                                                    <div className="w-28 hidden sm:block text-slate-500 text-right text-xs">
                                                        {p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString() : '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm p-8">
                                            <p>Nenhuma resposta ainda.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* HSE REPORT MODAL */}
            <HSEReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                data={reportData}
            />
        </>
    );
};
