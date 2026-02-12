import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Copy, Search, FileText, X, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { Form } from '../../types';

interface SurveyDetailsProps {
    form: Form;
    onBack: () => void;
}

// RADIAL_DATA and QUESTIONS_LIST would ideally be fetched based on the form type (HSE vs others)
// For now keeping them as UI demonstration while focusing on Collaborator/Sector data as requested.
const RADIAL_DATA = [
    { name: 'Demandas', value: 3.2, fill: '#f43f5e' }, // Rose-500
    { name: 'Relacionamentos', value: 2.2, fill: '#f43f5e' },
    { name: 'Controle', value: 2.6, fill: '#6366f1' }, // Indigo-500
    { name: 'Apoio da Chefia', value: 2.3, fill: '#6366f1' },
    { name: 'Apoio dos Colegas', value: 2.6, fill: '#6366f1' },
    { name: 'Cargo', value: 1.7, fill: '#6366f1' },
    { name: 'Comunicação', value: 1.9, fill: '#6366f1' },
];

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
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // REAL DATA STATE
    const [sectors, setSectors] = useState<{ id: number, nome: string }[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [totalColabs, setTotalColabs] = useState(0);
    const [totalResponses, setTotalResponses] = useState(0);
    const [recentResponses, setRecentResponses] = useState<any[]>([]);

    // --- PARTICIPATION MODAL STATE ---
    const [showParticipationModal, setShowParticipationModal] = useState(false);
    const [participationTab, setParticipationTab] = useState<'participants' | 'pending'>('participants');
    const [participationSearch, setParticipationSearch] = useState('');
    const [participantsList, setParticipantsList] = useState<any[]>([]);
    const [pendingList, setPendingList] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [dbStats, setDbStats] = useState({ participants: 0, pending: 0 });



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

            // 0. Fetch Units if Company Level
            if (isCompanyLevel && (form as any).cliente_uuid) {
                const { data: unitsData } = await supabase
                    .from('unidades')
                    .select('id, nome')
                    .eq('empresa_mae', (form as any).cliente_uuid);
                setUnits(unitsData || []);
            }

            // 1. Sectors are now handled by fetchSectors/useEffect
            // triggers on mount because form.id triggers fetchSectors via dependency or we call it here?
            // Actually useEffect [selectedUnit, form.id] will run on mount.

            // 2. Resolve Form IDs (if form.id is actually a company ID)
            let formIds: number[] = [];
            // Check if form object looks like a company (has cliente_uuid or name but is used in company context)


            if (isCompanyLevel) {
                // Since forms table doesn't have direct company link, we find forms via answers from company collaborators
                const { data: companyUnits } = await supabase
                    .from('unidades')
                    .select('id')
                    .eq('empresa_mae', (form as any).cliente_uuid);

                const unitIds = (companyUnits || []).map(u => u.id);

                if (unitIds.length > 0) {

                    // Get all collaborators to find form answers
                    const { data: collaborators } = await supabase
                        .from('colaboradores')
                        .select('id')
                        .in('unidade_id', unitIds);

                    const collaboratorIds = (collaborators || []).map((c: any) => c.id);

                    if (collaboratorIds.length > 0) {
                        const { data: answers } = await supabase
                            .from('form_answers')
                            .select('form_id')
                            .in('respondedor', collaboratorIds);

                        const uniqueFormIds = Array.from(new Set((answers || []).map(a => a.form_id)));
                        formIds = uniqueFormIds;
                    }
                }
            } else {
                formIds = [form.id];
            }

            // 3. Fetch Questions (Global list for all forms)
            const { data: qs } = await supabase
                .from('form_questions')
                .select('*')
                .order('question_order');
            setQuestions(qs || []);

            // 4. Fetch Recent Responses across all formIds
            if (formIds.length > 0) {
                const { data: recentData } = await supabase
                    .from('form_answers')
                    .select(`
                        id, 
                        created_at, 
                        respondedor,
                        colaboradores (nome, id)
                    `)
                    .in('form_id', formIds)
                    .order('created_at', { ascending: false });

                const mappedRecent = [];
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
            }

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

            // 2. Resolve Form IDs
            let formIds: number[] = [];
            if (isCompanyLevel) {
                const { data: companyUnits } = await supabase
                    .from('unidades')
                    .select('id')
                    .eq('empresa_mae', (form as any).cliente_uuid);
                const unitIds = (companyUnits || []).map(u => u.id);
                if (unitIds.length > 0) {
                    const { data: collaborators } = await supabase
                        .from('colaboradores')
                        .select('id')
                        .in('unidade_id', unitIds);
                    const collaboratorIds = (collaborators || []).map(c => c.id);
                    if (collaboratorIds.length > 0) {
                        const { data: answers } = await supabase
                            .from('form_answers')
                            .select('form_id')
                            .in('respondedor', collaboratorIds);
                        formIds = Array.from(new Set((answers || []).map(a => a.form_id)));
                    }
                }
            } else {
                formIds = [form.id];
            }

            // 3. Total Colabs (Denominator)
            let colabQuery = supabase
                .from('colaboradores')
                .select('*', { count: 'exact', head: true });

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
    const renderCustomPolarSector = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, value, index } = props;
        const maxValue = 4;
        // Calculate radius based on value (0 to 4) relative to the available radius space
        const r = innerRadius + (outerRadius - innerRadius) * (Math.min(value, maxValue) / maxValue);

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

    const fetchParticipationDetails = async () => {
        setModalLoading(true);
        try {
            // 1. Determine Scope & Fetch Stats from FORMS table
            const isCompanyLevel = !(form as any).slug && (form as any).cliente_uuid;
            let formQuery = supabase.from('forms').select('colaboladores_inclusos, respondentes');

            if (isCompanyLevel) {
                // Fetch units to filter forms
                const { data: units } = await supabase
                    .from('unidades')
                    .select('id')
                    .eq('empresa_mae', (form as any).cliente_uuid);
                const unitIds = (units || []).map(u => u.id);

                if (unitIds.length > 0) {
                    formQuery = formQuery.in('unidade_id', unitIds);
                } else {
                    // No units, no forms
                    setDbStats({ participants: 0, pending: 0 });
                    return;
                }
            } else {
                formQuery = formQuery.eq('id', form.id);
            }

            const { data: formsData } = await formQuery;

            // Calculate Stats from Forms Table
            const allParticipants = new Set<string>();
            const allRespondents = new Set<string>();

            (formsData || []).forEach((f: any) => {
                (f.colaboladores_inclusos || []).forEach((id: string) => allParticipants.add(id));
                (f.respondentes || []).forEach((id: string) => allRespondents.add(id));
            });

            setDbStats({
                participants: allRespondents.size,
                pending: Math.max(0, allParticipants.size - allRespondents.size)
            });


            // 2. Fetch Actual Collaborators for the List
            const sectorId = selectedSector ? sectors.find(s => s.nome === selectedSector)?.id : null;

            let colabQuery = supabase
                .from('colaboradores')
                .select('id, nome, email, sexo, data_nascimento, cargo_id, cargos(nome)');

            if (selectedUnit) {
                colabQuery = colabQuery.eq('unidade_id', selectedUnit);
            } else if (isCompanyLevel) {
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

            const { data: fetchedCollaborators } = await colabQuery;

            // 3. Filter & Categorize
            let relevantCollaborators = fetchedCollaborators || [];

            // Filter by "Invited" list if we have one (colaboladores_inclusos)
            if (allParticipants.size > 0) {
                relevantCollaborators = relevantCollaborators.filter(c => allParticipants.has(c.id));
            }

            // Split into Responded vs Pending
            const participated = relevantCollaborators.filter(c => allRespondents.has(c.id));
            const pending = relevantCollaborators.filter(c => !allRespondents.has(c.id));

            setParticipantsList(participated);
            setPendingList(pending);

            // Update stats to match displayed lists (more accurate than raw DB stats if filters applied)
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
        { value: 'recorte', label: 'Recorte Interpretativo' },
    ];

    return (
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
                        <div className="mt-1 flex items-center gap-2">
                            {/* Unit Dropdown (Only show if we have units) */}
                            {units.length > 0 && (
                                <select
                                    value={selectedUnit}
                                    onChange={(e) => {
                                        setSelectedUnit(e.target.value);
                                        setSelectedSector(''); // Reset sector when unit changes
                                    }}
                                    className="bg-slate-50 border-none text-sm text-slate-500 font-medium focus:ring-0 cursor-pointer hover:text-slate-700 py-0 pl-0 pr-8 transition-colors outline-none"
                                >
                                    <option value="">Todas as Unidades</option>
                                    {units.map(unit => (
                                        <option key={unit.id} value={unit.id}>{unit.nome}</option>
                                    ))}
                                </select>
                            )}

                            {units.length > 0 && <span className="text-slate-300">|</span>}

                            <select
                                value={selectedSector}
                                onChange={(e) => setSelectedSector(e.target.value)}
                                className="bg-slate-50 border-none text-sm text-slate-500 font-medium focus:ring-0 cursor-pointer hover:text-slate-700 py-0 pl-0 pr-8 transition-colors outline-none"
                            >
                                <option value="">Todos os Setores</option>
                                {distinctSectors.map(sector => (
                                    <option key={sector} value={sector}>{sector}</option>
                                ))}
                            </select>
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
                                className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors group relative"
                            >
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Search size={16} className="text-slate-400" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Participação</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-slate-900">
                                        {totalResponses}
                                    </span>
                                    <span className="text-lg text-slate-400 font-medium">
                                        /{totalColabs}
                                    </span>
                                </div>
                            </div>

                            {/* Total de Perguntas */}
                            <div className="p-6 flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total de Perguntas</p>
                                <span className="text-3xl font-bold text-slate-900">
                                    {form.questions?.length || questions.length || 0}
                                </span>
                            </div>

                            {/* Tempo Médio */}
                            <div className="p-6 flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tempo Médio</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-slate-900">--</span>
                                    <span className="text-lg text-slate-900 font-bold">min</span>
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
                                <table className="w-full text-left">
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
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB B: ANÁLISE INTERPRETATIVA --- */}
                {activeTab === 'analysis' && (
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

                            {/* LEFT COLUMN: DIRECT RISK CARD */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Risco Direto</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Demandas & Relacionamentos</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                                        <span>Dimensão</span>
                                        <span>Média</span>
                                    </div>
                                    {RADIAL_DATA.filter(d => d.fill === '#f43f5e').map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <span className="font-medium text-slate-600 text-sm group-hover:text-slate-900 transition-colors pl-2 border-l-2 border-slate-100 group-hover:border-rose-400 pl-3">
                                                {item.name}
                                            </span>
                                            <span className={`text-xs px-3 py-1 rounded-full font-bold w-16 text-center ${item.value >= 3 ? 'bg-red-50 text-red-600' :
                                                item.value >= 2 ? 'bg-orange-50 text-orange-600' :
                                                    'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Legend Restored */}
                                    <div className="pt-4 mt-2 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legenda de Risco</h4>
                                        <div className="space-y-2">
                                            {[
                                                { range: '3.0 - 4.0', label: 'Alto', color: 'bg-red-50 text-red-600 border border-red-100' },
                                                { range: '2.0 - 2.9', label: 'Moderado', color: 'bg-orange-50 text-orange-600 border border-orange-100' },
                                                { range: '1.0 - 1.9', label: 'Médio', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
                                                { range: '0.0 - 0.9', label: 'Baixo', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 font-medium">{item.range}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-20 text-center ${item.color}`}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="border-t border-slate-100 mt-6 pt-4 text-xs text-slate-400 italic text-center">
                                    Quanto <strong>maior</strong> a média, <strong>maior</strong> o risco.
                                </p>
                            </div>

                            {/* CENTER COLUMN: POLAR AREA CHART (2 COLS) */}
                            <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col justify-center relative">
                                <h3 className="font-bold text-lg text-slate-800 mb-6 text-center">Dimensões Psicossociais</h3>
                                <div className="w-full h-[400px] flex justify-center items-center relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={RADIAL_DATA}
                                                dataKey="value"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={150}
                                                shape={renderCustomPolarSector}
                                                onMouseEnter={(_, index) => setHoveredIndex(index)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                                isAnimationActive={false}
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                                    const RADIAN = Math.PI / 180;
                                                    // Ensure midAngle is valid
                                                    const angle = -(midAngle || 0) * RADIAN;

                                                    // Position for the label text (closer to chart)
                                                    const radius = outerRadius * 1.15;
                                                    const x = cx + radius * Math.cos(angle);
                                                    const y = cy + radius * Math.sin(angle);

                                                    // Position for the start of the line (at the edge of the specific bar)
                                                    const maxValue = 4;
                                                    // Re-calculate the bar's outer edge for this specific value
                                                    const barRadius = innerRadius + (outerRadius - innerRadius) * (Math.min(value, maxValue) / maxValue);

                                                    const startRadius = barRadius;
                                                    const startX = cx + startRadius * Math.cos(angle);
                                                    const startY = cy + startRadius * Math.sin(angle);

                                                    // Mid-point for polyline (optional knee)
                                                    const midRadius = outerRadius * 1.08;
                                                    const midX = cx + midRadius * Math.cos(angle);
                                                    const midY = cy + midRadius * Math.sin(angle);

                                                    return (
                                                        <g>
                                                            <path
                                                                d={`M${startX},${startY} L${midX},${midY} L${x},${y}`}
                                                                stroke="#cbd5e1"
                                                                fill="none"
                                                            />
                                                            <text
                                                                x={x}
                                                                y={y}
                                                                fill="#64748b"
                                                                textAnchor={x > cx ? 'start' : 'end'}
                                                                dominantBaseline="central"
                                                                className="text-[11px] font-semibold"
                                                            >
                                                                {RADIAL_DATA[index].name}
                                                            </text>
                                                        </g>
                                                    );
                                                }}
                                                labelLine={false}
                                            >
                                                {RADIAL_DATA.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: INVERSE RISK CARD */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                                        <TrendingDown size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Risco Inverso</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Controle, Apoio, Cargo, etc.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                                        <span>Dimensão</span>
                                        <span>Média</span>
                                    </div>
                                    {RADIAL_DATA.filter(d => d.fill === '#6366f1').map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <span className="font-medium text-slate-600 text-sm group-hover:text-slate-900 transition-colors pl-2 border-l-2 border-slate-100 group-hover:border-indigo-400 pl-3">
                                                {item.name}
                                            </span>
                                            <span className={`text-xs px-3 py-1 rounded-full font-bold w-16 text-center ${item.value <= 2 ? 'bg-red-50 text-red-600' :
                                                item.value <= 3 ? 'bg-orange-50 text-orange-600' :
                                                    'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Legend Restored */}
                                    <div className="pt-4 mt-2 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legenda de Risco</h4>
                                        <div className="space-y-2">
                                            {[
                                                { range: '0.0 - 0.9', label: 'Alto', color: 'bg-red-50 text-red-600 border border-red-100' },
                                                { range: '1.0 - 1.9', label: 'Moderado', color: 'bg-orange-50 text-orange-600 border border-orange-100' },
                                                { range: '2.0 - 2.9', label: 'Médio', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
                                                { range: '3.0 - 4.0', label: 'Baixo', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 font-medium">{item.range}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-20 text-center ${item.color}`}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="border-t border-slate-100 mt-6 pt-4 text-xs text-slate-400 italic text-center">
                                    Quanto <strong>menor</strong> a média, <strong>maior</strong> o risco.
                                </p>
                            </div>

                        </div>
                    </div>
                )}


            </div>

            {/* RESPONSE MODAL */}
            {selectedParticipant && (
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
            )}

            {/* --- PARTICIPATION DETAILS MODAL --- */}
            {showParticipationModal && (
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
                                    <div className="px-6 py-3 bg-slate-50 flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <div className="flex-1">Colaborador</div>
                                        <div className="w-40 hidden sm:block">Cargo</div>
                                        <div className="w-20 hidden sm:block text-center">Sexo</div>
                                        <div className="w-28 hidden sm:block text-right">Nascimento</div>
                                    </div>
                                    {filteredParticipationList.map((p: any) => (
                                        <div key={p.id} className="px-6 py-3 flex items-center hover:bg-white transition-colors group text-sm">
                                            {/* Nome */}
                                            <div className="flex-1 font-bold text-slate-700 truncate pr-4">
                                                {p.nome || 'Sem Nome'}
                                            </div>

                                            {/* Cargo */}
                                            <div className="w-40 hidden sm:block text-slate-500 truncate pr-2">
                                                {/* Try both alias and direct relation, + specific check for cargo_id */}
                                                {(p.cargos && p.cargos.nome) ? p.cargos.nome :
                                                    (p.cargo && p.cargo.nome) ? p.cargo.nome :
                                                        '-'}
                                            </div>

                                            {/* Sexo */}
                                            <div className="w-20 hidden sm:block text-slate-500 text-center">
                                                {p.sexo || '-'}
                                            </div>

                                            {/* Data Nascimento */}
                                            <div className="w-28 hidden sm:block text-slate-500 text-right">
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
            )}
        </div>
    );
};
