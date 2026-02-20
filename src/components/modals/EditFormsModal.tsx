import React, { useState, useEffect } from 'react';
import { X, FileText, Building, Users, List, Edit, Check, Search, ChevronRight, HelpCircle, LayoutTemplate, Plus, FileSpreadsheet, User } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Select } from '../ui/Select';
import { ImportCollaboratorsModal } from '../forms/ImportCollaboratorsModal';
import gamaLogo from '../../assets/logo.png';

interface EditFormsModalProps {
    isOpen: boolean;
    onClose: () => void;
    summaryData: any;
    setSummaryData: React.Dispatch<React.SetStateAction<any>>;
    isEditMode: boolean;
    editingFormId: number | null;
    respondedIds: Set<string>;
    selectedCollaborators: Set<number>;
    setSelectedCollaborators: React.Dispatch<React.SetStateAction<Set<number>>>;
    onSaveSuccess: (tokensConsumed: number) => void;
    baseFormTitle: string;
    setBaseFormTitle: React.Dispatch<React.SetStateAction<string>>;
    showCompanyTag: boolean;
    setShowCompanyTag: React.Dispatch<React.SetStateAction<boolean>>;
    showUnitTag: boolean;
    setShowUnitTag: React.Dispatch<React.SetStateAction<boolean>>;
    showSectorTag: boolean;
    setShowSectorTag: React.Dispatch<React.SetStateAction<boolean>>;
    questions: any[];
    onCreateForm: (data: any) => Promise<void>;
}

export const EditFormsModal: React.FC<EditFormsModalProps> = ({
    isOpen,
    onClose,
    summaryData,
    setSummaryData,
    isEditMode,
    editingFormId,
    respondedIds,
    selectedCollaborators,
    setSelectedCollaborators,
    onSaveSuccess,
    baseFormTitle,
    setBaseFormTitle,
    showCompanyTag,
    setShowCompanyTag,
    showUnitTag,
    setShowUnitTag,
    showSectorTag,
    setShowSectorTag,
    questions,
    onCreateForm
}) => {
    const [expandedView, setExpandedView] = useState<'none' | 'collaborators' | 'questions' | 'description'>('none');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [collaboratorSearch, setCollaboratorSearch] = useState('');
    const [questionSearch, setQuestionSearch] = useState('');
    const [questionFilter, setQuestionFilter] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingColab, setIsAddingColab] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Estados para criação de novo cargo
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [isSavingNewRole, setIsSavingNewRole] = useState(false);

    const [newColab, setNewColab] = useState({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        dataNascimento: '',
        sexo: '',
        dataDesligamento: '',
        cargo: '',
        setor: summaryData?.sectorId ? String(summaryData.sectorId) : '',
        unidade_id: summaryData?.unit?.id ? String(summaryData.unit.id) : ''
    });

    // Listas dinâmicas para o formulário de cadastro
    const units = summaryData?.company?.units || [];
    const selectedUnitForColab = units.find((u: any) => String(u.id) === newColab.unidade_id);
    const availableSectors = selectedUnitForColab?.sectors || [];
    const activeSectorId = summaryData?.sectorId ? String(summaryData.sectorId) : newColab.setor;
    const availableRoles = selectedUnitForColab?.roles?.filter((r: any) =>
        !activeSectorId || String(r.setor_id) === activeSectorId
    ) || [];

    // Filtered Questions Logic
    const filteredQuestions = questions.filter(q =>
        q.text.toLowerCase().includes(questionSearch.toLowerCase()) &&
        (questionFilter ? q.dimension === questionFilter : true)
    );

    const questionsDimensions = Array.from(new Set(questions.map(q => q.dimension)));

    const toggleCollaborator = (id: number) => {
        const newSet = new Set(selectedCollaborators);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedCollaborators(newSet);
    };

    const toggleAllCollaborators = (force?: boolean) => {
        const collaborators = summaryData.company.collaborators || [];
        const isAllActive = selectedCollaborators.size === collaborators.length;
        const wantToSelectAll = force !== undefined ? force : !isAllActive;

        if (wantToSelectAll) {
            const allIds = new Set<number>(collaborators.map((c: any) => c.id).filter(Boolean));
            setSelectedCollaborators(allIds);
        } else {
            // No desmarcar todos, precisamos manter os que já responderam (pois eles estão travados)
            const newSet = new Set<number>();
            collaborators.forEach((c: any) => {
                if (respondedIds.has(String(c.id))) {
                    newSet.add(c.id);
                }
            });
            setSelectedCollaborators(newSet);
        }
    };

    const handleAddCollaborator = async () => {
        if (!newColab.nome || !newColab.unidade_id) {
            alert('Nome e Unidade são obrigatórios');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                nome: newColab.nome,
                email: newColab.email || null,
                cpf: newColab.cpf || null,
                telefone: newColab.telefone || null,
                data_nascimento: newColab.dataNascimento || null,
                sexo: newColab.sexo || null,
                data_desligamento: newColab.dataDesligamento || null,
                cargo_id: newColab.cargo ? Number(newColab.cargo) : null,
                setor_id: newColab.setor ? Number(newColab.setor) : null,
                unidade_id: Number(newColab.unidade_id),
                cod_categoria: 101,
                texto_categoria: "Empregado - Geral"
            };

            const { data: colabData, error } = await supabase
                .from('colaboradores')
                .insert(payload)
                .select(`
                    *,
                    cargo_rel:cargos(id, nome),
                    setor_rel:setor(id, nome)
                `)
                .single();

            if (error) throw error;

            // Update local state
            const mappedNewColab = {
                ...colabData,
                cargo: colabData.cargo_rel?.nome || colabData.cargo || '',
                setor: colabData.setor_rel?.nome || colabData.setor || '',
                cargo_id: colabData.cargo_rel?.id || colabData.cargo_id,
                setor_id: colabData.setor_rel?.id || colabData.setor_id
            };

            setSummaryData((prev: any) => ({
                ...prev,
                company: {
                    ...prev.company,
                    collaborators: [mappedNewColab, ...(prev.company.collaborators || [])]
                }
            }));

            // Auto select
            setSelectedCollaborators(prev => new Set(prev).add(mappedNewColab.id));

            // Reset
            setIsAddingColab(false);
            setNewColab({
                nome: '', email: '', cpf: '', telefone: '',
                dataNascimento: '', sexo: '', dataDesligamento: '',
                cargo: '', setor: String(summaryData.sectorId || ''),
                unidade_id: String(summaryData.unit.id || '')
            });

        } catch (error) {
            console.error('Error adding collaborator:', error);
            alert('Erro ao adicionar colaborador.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImportCollaborators = async (importedData: any[]) => {
        if (!importedData || importedData.length === 0) return;

        setIsSaving(true);
        try {
            // We need reference data for industries/roles to match names to IDs if possible
            // But for simplicity in this modal, we'll insert with provided names and fixed unit
            const toInsert = importedData.map(c => ({
                nome: c.nome,
                email: c.email || null,
                cpf: c.cpf || null,
                telefone: c.telefone || null,
                data_nascimento: c.dataNascimento || null,
                sexo: c.sexo || null,
                data_desligamento: c.dataDesligamento || null,
                cargo: c.cargo || null,
                setor: c.setor || null,
                unidade_id: Number(summaryData.unit.id),
                setor_id: summaryData.sectorId ? Number(summaryData.sectorId) : null,
                cod_categoria: 101,
                texto_categoria: "Empregado - Geral"
            }));

            const { data: insertedData, error } = await supabase
                .from('colaboradores')
                .insert(toInsert)
                .select(`
                    *,
                    cargo_rel:cargos(id, nome),
                    setor_rel:setor(id, nome)
                `);

            if (error) throw error;

            const mappedInserted = (insertedData || []).map(c => ({
                ...c,
                cargo: c.cargo_rel?.nome || c.cargo || '',
                setor: c.setor_rel?.nome || c.setor || '',
                cargo_id: c.cargo_rel?.id || c.cargo_id,
                setor_id: c.setor_rel?.id || c.setor_id
            }));

            setSummaryData((prev: any) => ({
                ...prev,
                company: {
                    ...prev.company,
                    collaborators: [...mappedInserted, ...(prev.company.collaborators || [])]
                }
            }));

            // Auto select new ones
            const newSet = new Set(selectedCollaborators);
            mappedInserted.forEach(c => newSet.add(c.id));
            setSelectedCollaborators(newSet);

            setIsImportModalOpen(false);
            alert(`${mappedInserted.length} colaboradores importados com sucesso!`);

        } catch (error: any) {
            console.error('Error importing:', error);
            alert(error.message || 'Erro ao importar colaboradores.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) return;

        setIsSavingNewRole(true);
        try {
            const { data, error } = await supabase
                .from('cargos')
                .insert({
                    nome: newRoleName.trim(),
                    setor_id: newColab.setor ? Number(newColab.setor) : null
                })
                .select()
                .single();

            if (error) throw error;

            // Optimistic update: Inject new role into the associated unit in summaryData
            const updatedUnits = summaryData.company.units.map((u: any) => {
                // If this is the unit we are currently dealing with
                if (String(u.id) === newColab.unidade_id) {
                    return {
                        ...u,
                        roles: [...(u.roles || []), data]
                    };
                }
                return u;
            });

            setSummaryData((prev: any) => ({
                ...prev,
                company: {
                    ...prev.company,
                    units: updatedUnits
                }
            }));

            // Select the newly created role
            setNewColab(prev => ({ ...prev, cargo: String(data.id) }));
            setIsCreatingRole(false);
            setNewRoleName('');

        } catch (error) {
            console.error('Erro ao criar cargo:', error);
            alert('Não foi possível criar o cargo. Tente novamente.');
        } finally {
            setIsSavingNewRole(false);
        }
    };

    // Effect to handle dynamic title updates
    useEffect(() => {
        if (!summaryData) return;

        let newTitle = baseFormTitle;
        const tags = [];

        if (showCompanyTag && summaryData.company.name) tags.push(summaryData.company.name);
        if (showUnitTag && summaryData.unit.name) tags.push(summaryData.unit.name);
        if (showSectorTag && summaryData.sector && summaryData.sector !== 'Geral') tags.push(summaryData.sector);

        if (tags.length > 0) {
            newTitle = `${baseFormTitle} - ${tags.join(' - ')}`;
        }

        setSummaryData((prev: any) => prev ? { ...prev, formTitle: newTitle } : null);
    }, [baseFormTitle, showCompanyTag, showUnitTag, showSectorTag, summaryData?.company.name, summaryData?.unit.name, summaryData?.sector, setSummaryData]);

    const handleConfirm = async () => {
        if (!summaryData) return;
        setIsSaving(true);

        try {
            const selectedUuids = Array.from(selectedCollaborators);

            if (isEditMode && editingFormId) {
                const { error: updateError } = await supabase
                    .from('forms')
                    .update({
                        title: summaryData.formTitle,
                        description: summaryData.formDesc,
                        colaboladores_inclusos: selectedUuids,
                        total_colabora: selectedUuids.length
                    })
                    .eq('id', editingFormId);

                if (updateError) throw updateError;
                alert('Formulário atualizado com sucesso!');

                const countTokensConsumed = Math.max(0, selectedCollaborators.size - (summaryData.initialCollaboratorsCount || 0));
                onSaveSuccess(countTokensConsumed);
            } else {
                // Garante que o link use sempre o origin ATUAL
                const uniqueId = Date.now();
                const publicLink = `${window.location.origin}/form/${uniqueId}`;

                // Update summary data with REAL link for success modal
                setSummaryData((prev: any) => ({ ...prev, publicLink }));

                // In creation mode, all selected collaborators consume tokens
                onSaveSuccess(selectedCollaborators.size);
                await onCreateForm({
                    company_id: summaryData.company.id,
                    company_name: summaryData.company.name,
                    unit_id: summaryData.unit.id,
                    unit_name: summaryData.unit.name,
                    sector: summaryData.sector,
                    sector_id: summaryData.sectorId,
                    selected_collaborators_count: selectedCollaborators.size,
                    colaboladores_inclusos: selectedUuids,
                    link: publicLink,
                    title: summaryData.formTitle,
                    description: summaryData.formDesc
                });

                const countTokensConsumed = isEditMode
                    ? Math.max(0, selectedCollaborators.size - (summaryData.initialCollaboratorsCount || 0))
                    : selectedCollaborators.size;

                onSaveSuccess(countTokensConsumed);
            }
        } catch (error) {
            console.error('Erro ao salvar formulário:', error);
            alert('Erro ao salvar formulário.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !summaryData) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-white w-full h-[calc(100dvh-80px)] md:h-auto md:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300 flex flex-col md:flex-row transition-all duration-500 ease-in-out md:h-[52rem] ${expandedView !== 'none' ? 'md:w-[98rem] md:max-w-full' : 'md:max-w-[42rem]'}`}>

                {/* LEFT PANEL - SUMMARY */}
                <div className={`flex flex-col border-r border-slate-100 transition-all duration-500 ${expandedView !== 'none' ? 'md:w-[36.5rem] md:shrink-0' : 'w-full'}`}>
                    <div className="px-4 md:px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileText size={20} className="text-[#35b6cf]" />
                            {isEditMode ? 'Editar Formulário' : 'Resumo do Formulário'}
                        </h3>
                        {expandedView === 'none' && (
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                        {/* Header Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-lg">
                                {summaryData.company.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg leading-tight">{summaryData.company.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    <Building size={14} />
                                    <span>{summaryData.unit.name}</span>
                                    {summaryData.sector && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>{summaryData.sector}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* KPIs - Clickable */}
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setExpandedView(prev => prev === 'collaborators' ? 'none' : 'collaborators')}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${expandedView === 'collaborators' ? 'bg-[#35b6cf]/10 border-[#35b6cf] ring-2 ring-[#35b6cf]/20' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                            >
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Colaboradores</div>
                                <div className="flex items-center gap-2">
                                    <Users size={20} className="text-[#35b6cf]" />
                                    <span className="text-2xl font-bold text-slate-700">{selectedCollaborators.size}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                    {selectedCollaborators.size < summaryData.company.collaborators.length ? 'Ajustar seleção' : 'Ver lista'} <ChevronRight size={10} />
                                </div>
                            </div>
                            <div
                                onClick={() => setExpandedView(prev => prev === 'questions' ? 'none' : 'questions')}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${expandedView === 'questions' ? 'bg-[#35b6cf]/10 border-[#35b6cf] ring-2 ring-[#35b6cf]/20' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                            >
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Perguntas</div>
                                <div className="flex items-center gap-2">
                                    <List size={20} className="text-[#35b6cf]" />
                                    <span className="text-2xl font-bold text-slate-700">{summaryData.kpiQuestions}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                    Ver perguntas <ChevronRight size={10} />
                                </div>
                            </div>
                        </div>

                        {/* Form Details */}
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título do Formulário</label>
                                    <button
                                        onClick={() => setIsEditingTitle(!isEditingTitle)}
                                        className="p-1 text-[#35b6cf] hover:bg-[#35b6cf]/10 rounded-md transition-colors"
                                        title={isEditingTitle ? "Salvar Título" : "Editar Título"}
                                    >
                                        {isEditingTitle ? <Check size={14} /> : <Edit size={14} />}
                                    </button>
                                </div>
                                {isEditingTitle ? (
                                    <input
                                        type="text"
                                        value={baseFormTitle}
                                        onChange={(e) => setBaseFormTitle(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-[#35b6cf] rounded-lg text-sm font-bold text-slate-800 outline-none shadow-sm shadow-[#35b6cf]/10"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') setIsEditingTitle(false);
                                        }}
                                    />
                                ) : (
                                    <p className="font-bold text-slate-800 mt-1">{summaryData.formTitle}</p>
                                )}
                            </div>

                            {/* Dynamic Title Tags Checkboxes */}
                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80 space-y-3">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Incluir no Título:</label>
                                    <div className="text-[10px] font-medium text-slate-400">Clique para alternar</div>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    <button
                                        onClick={() => setShowCompanyTag(!showCompanyTag)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-2 ${showCompanyTag
                                            ? 'bg-[#35b6cf] border-[#35b6cf] text-white shadow-md shadow-[#35b6cf]/20'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-[#35b6cf]/30'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${showCompanyTag ? 'bg-white' : 'bg-slate-300'}`} />
                                        Empresa
                                    </button>
                                    <button
                                        onClick={() => setShowUnitTag(!showUnitTag)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-2 ${showUnitTag
                                            ? 'bg-[#35b6cf] border-[#35b6cf] text-white shadow-md shadow-[#35b6cf]/20'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-[#35b6cf]/30'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${showUnitTag ? 'bg-white' : 'bg-slate-300'}`} />
                                        Unidade
                                    </button>
                                    <button
                                        onClick={() => setShowSectorTag(!showSectorTag)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border-2 ${showSectorTag
                                            ? 'bg-[#35b6cf] border-[#35b6cf] text-white shadow-md shadow-[#35b6cf]/20'
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-[#35b6cf]/30'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${showSectorTag ? 'bg-white' : 'bg-slate-300'}`} />
                                        Setor
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</label>
                                    <button
                                        onClick={() => setExpandedView(prev => prev === 'description' ? 'none' : 'description')}
                                        className="text-[10px] font-bold text-[#35b6cf] hover:underline flex items-center gap-0.5"
                                    >
                                        {expandedView === 'description' ? 'Ocultar' : 'Ver mais'} <ChevronRight size={10} className={expandedView === 'description' ? 'rotate-180' : ''} />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                    {summaryData.formDesc}
                                </p>
                            </div>

                            {/* Uso de Tokens */}
                            {(!isEditMode || (isEditMode && selectedCollaborators.size > (summaryData.initialCollaboratorsCount || 0))) && (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uso de Tokens</label>
                                    <div className="flex items-center gap-2 mt-1.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                        <span className="text-2xl font-black text-amber-600">
                                            {isEditMode
                                                ? selectedCollaborators.size - (summaryData.initialCollaboratorsCount || 0)
                                                : selectedCollaborators.size}
                                        </span>
                                        <img src={gamaLogo} alt="Token" className="w-5 h-5 object-contain" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {isEditMode ? '1 token por NOVO colaborador selecionado' : '1 token por colaborador selecionado'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-4 md:px-6 pt-6 pb-6 md:pb-16 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSaving}
                            className="px-6 py-2.5 rounded-xl bg-[#35b6cf] text-white font-semibold hover:bg-[#2ca3bc] shadow-lg shadow-[#35b6cf]/20 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : <Check size={18} />}
                            {isEditMode ? 'Salvar Alterações' : 'Confirmar e Gerar'}
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL - EXPANDED CONTENT */}
                <div className={`flex flex-col bg-slate-50/50 transition-all duration-500 overflow-hidden ${expandedView !== 'none' ? 'fixed inset-0 z-[60] md:static md:z-auto flex-1 opacity-100 bg-white md:bg-slate-50/50' : 'w-0 opacity-0 hidden md:block'}`}>
                    {expandedView === 'collaborators' && (
                        <div className="h-full flex flex-col min-w-0 md:min-w-[30rem]">
                            <div className="px-6 py-4 border-b border-slate-100 bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Users size={18} className="text-[#35b6cf]" />
                                        Colaboradores Selecionados
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded-md text-slate-500">
                                            {summaryData.company.collaborators.length || 0} Total no Setor
                                        </span>
                                        <button onClick={() => setExpandedView('none')} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Buscar colaborador por nome, cargo ou setor..."
                                            value={collaboratorSearch}
                                            onChange={(e) => setCollaboratorSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => {
                                                setNewColab({
                                                    nome: '', email: '', cpf: '', telefone: '',
                                                    dataNascimento: '', sexo: '', dataDesligamento: '',
                                                    cargo: '',
                                                    setor: String(summaryData?.sectorId || ''),
                                                    unidade_id: String(summaryData?.unit?.id || '')
                                                });
                                                setIsAddingColab(true);
                                            }}
                                            className="px-3 py-2 bg-[#35b6cf] text-white rounded-lg text-xs font-bold hover:bg-[#2ca3bc] flex items-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            <Plus size={14} /> Novo Colaborador
                                        </button>
                                        <button
                                            onClick={() => setIsImportModalOpen(true)}
                                            className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 flex items-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            <FileSpreadsheet size={14} /> Importar
                                        </button>
                                        <div className="w-px h-6 bg-slate-200 mx-1" />
                                        <button
                                            onClick={() => toggleAllCollaborators(true)}
                                            className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                                        >
                                            Marcar Todos
                                        </button>
                                        <button
                                            onClick={() => toggleAllCollaborators(false)}
                                            className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                                        >
                                            Desmarcar Todos
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Add Form */}
                                {isAddingColab && (
                                    <div className="mt-4 p-4 bg-white border border-[#35b6cf]/30 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <User size={16} className="text-[#35b6cf]" />
                                                Cadastrar Novo Colaborador
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-6 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                                                <input
                                                    type="text"
                                                    value={newColab.nome}
                                                    onChange={(e) => setNewColab(prev => ({ ...prev, nome: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                                    placeholder="Ex: João Silva"
                                                />
                                            </div>
                                            <div className="md:col-span-6 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Corporativo</label>
                                                <input
                                                    type="email"
                                                    value={newColab.email}
                                                    onChange={(e) => setNewColab(prev => ({ ...prev, email: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                                    placeholder="joao@exemplo.com"
                                                />
                                            </div>
                                            <div className="md:col-span-3 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CPF</label>
                                                <input
                                                    type="text"
                                                    value={newColab.cpf}
                                                    onChange={(e) => setNewColab(prev => ({ ...prev, cpf: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                                    placeholder="000.000.000-00"
                                                />
                                            </div>
                                            <div className="md:col-span-3 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefone</label>
                                                <input
                                                    type="text"
                                                    value={newColab.telefone}
                                                    onChange={(e) => setNewColab(prev => ({ ...prev, telefone: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                                    placeholder="(00) 00000-0000"
                                                />
                                            </div>
                                            <div className="md:col-span-3 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nascimento</label>
                                                <input
                                                    type="date"
                                                    value={newColab.dataNascimento}
                                                    onChange={(e) => setNewColab(prev => ({ ...prev, dataNascimento: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                                />
                                            </div>
                                            <div className="md:col-span-3 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sexo</label>
                                                <Select
                                                    value={newColab.sexo}
                                                    onChange={(val) => setNewColab(prev => ({ ...prev, sexo: val }))}
                                                    options={[
                                                        { label: 'Masculino', value: 'Masculino' },
                                                        { label: 'Feminino', value: 'Feminino' },
                                                        { label: 'Outro', value: 'Outro' }
                                                    ]}
                                                    placeholder="Selecione"
                                                />
                                            </div>
                                            <div className="md:col-span-4 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Desligamento</label>
                                                <input
                                                    type="date"
                                                    value={newColab.dataDesligamento}
                                                    onChange={(e) => setNewColab(prev => ({ ...prev, dataDesligamento: e.target.value }))}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                                />
                                            </div>
                                            <div className="md:col-span-4 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Setor</label>
                                                <Select
                                                    value={newColab.setor}
                                                    onChange={(val) => setNewColab(prev => ({ ...prev, setor: val, cargo: '' }))}
                                                    options={availableSectors.map((s: any) => ({ label: s.name, value: String(s.id) }))}
                                                    placeholder="Selecione o Setor"
                                                    disabled={!!summaryData?.sectorId}
                                                />
                                            </div>
                                            <div className="md:col-span-4 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargo</label>
                                                {isCreatingRole ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={newRoleName}
                                                            onChange={(e) => setNewRoleName(e.target.value)}
                                                            className="flex-1 px-3 py-2 bg-slate-50 border border-[#35b6cf] rounded-lg text-sm outline-none shadow-sm shadow-[#35b6cf]/10"
                                                            placeholder="Nome do cargo"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleCreateRole();
                                                                if (e.key === 'Escape') setIsCreatingRole(false);
                                                            }}
                                                        />
                                                        <div className="flex shrink-0">
                                                            <button
                                                                onClick={handleCreateRole}
                                                                disabled={isSavingNewRole || !newRoleName.trim()}
                                                                className="px-2 bg-emerald-500 text-white rounded-l-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                                                            >
                                                                {isSavingNewRole ? <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin" /> : <Check size={16} />}
                                                            </button>
                                                            <button
                                                                onClick={() => setIsCreatingRole(false)}
                                                                className="px-2 bg-slate-200 text-slate-600 rounded-r-lg hover:bg-slate-300 transition-colors"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Select
                                                        value={newColab.cargo}
                                                        onChange={(val) => {
                                                            if (val === 'ADD_NEW') {
                                                                setIsCreatingRole(true);
                                                            } else {
                                                                setNewColab(prev => ({ ...prev, cargo: val }));
                                                            }
                                                        }}
                                                        options={[
                                                            ...availableRoles.map((r: any) => ({ label: r.nome, value: String(r.id) })),
                                                            { label: '+ Adicionar Cargo', value: 'ADD_NEW' }
                                                        ]}
                                                        placeholder="Selecione o Cargo"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <button
                                                onClick={() => setIsAddingColab(false)}
                                                className="px-3 py-1.5 text-slate-500 font-semibold text-xs hover:bg-slate-50 rounded-lg transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleAddCollaborator}
                                                disabled={isSaving || !newColab.nome}
                                                className="px-4 py-1.5 bg-[#35b6cf] text-white font-bold text-xs rounded-lg hover:bg-[#2ca3bc] transition-all shadow-sm disabled:opacity-50"
                                            >
                                                {isSaving ? 'Salvando...' : 'Cadastrar e Selecionar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 overflow-auto bg-slate-50/50 h-full">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <table className="hidden md:table w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                                            <tr>
                                                <th className="px-4 py-3 w-10">
                                                    <input type="checkbox" className="rounded border-slate-300 text-[#35b6cf] focus:ring-[#35b6cf]" checked={selectedCollaborators.size === summaryData.company.collaborators.length} onChange={() => toggleAllCollaborators()} />
                                                </th>
                                                <th className="px-4 py-3">Nome</th>
                                                <th className="px-4 py-3">Sexo</th>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">Cargo</th>
                                                <th className="px-4 py-3">Setor</th>
                                                <th className="px-4 py-3 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(summaryData.company.collaborators || []).map((colab: any, idx: number) => {
                                                const name = colab.nome || `Colaborador ${idx + 1}`;
                                                const colabSector = colab.setor || 'Geral';
                                                const email = colab.email || '-';
                                                const sexo = colab.sexo || 'M';

                                                if (collaboratorSearch &&
                                                    !name.toLowerCase().includes(collaboratorSearch.toLowerCase()) &&
                                                    !(colab.cargo || '').toLowerCase().includes(collaboratorSearch.toLowerCase()) &&
                                                    !colabSector.toLowerCase().includes(collaboratorSearch.toLowerCase())
                                                ) {
                                                    return null;
                                                }

                                                const isSelected = selectedCollaborators.has(colab.id);
                                                const isResponded = respondedIds.has(String(colab.id));
                                                const isFired = !!colab.data_desligamento;

                                                return (
                                                    <tr key={colab.id || idx} className={`hover:bg-slate-50 transition-colors ${!isSelected ? 'opacity-40 bg-slate-50/30' : ''} ${isResponded || isFired ? 'cursor-not-allowed select-none grayscale' : ''}`}>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                className={`rounded border-slate-300 text-[#35b6cf] focus:ring-[#35b6cf] ${isResponded || isFired ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                                checked={isSelected}
                                                                onChange={() => !isResponded && !isFired && toggleCollaborator(colab.id)}
                                                                disabled={isResponded || isFired}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-800 font-medium">{name}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sexo === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                                                {sexo}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500 text-xs">{email}</td>
                                                        <td className="px-4 py-3 text-slate-500">{colab.cargo || '-'}</td>
                                                        <td className="px-4 py-3 text-slate-500">
                                                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                                                {colabSector}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {isFired ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-100 shadow-sm">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                                    Desligado
                                                                </span>
                                                            ) : isResponded ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    Respondido
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                                    Pendente
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Mobile Card Layout */}
                                    <div className="md:hidden space-y-3 pb-6 px-4">
                                        {(summaryData.company.collaborators || []).map((colab: any, idx: number) => {
                                            const name = colab.nome || `Colaborador ${idx + 1}`;
                                            if (collaboratorSearch && !name.toLowerCase().includes(collaboratorSearch.toLowerCase())) return null;

                                            const isSelected = selectedCollaborators.has(colab.id);
                                            const isResponded = respondedIds.has(String(colab.id));

                                            return (
                                                <div
                                                    key={colab.id}
                                                    onClick={() => !isResponded && toggleCollaborator(colab.id)}
                                                    className={`bg-white p-4 rounded-2xl border transition-all ${isSelected ? 'border-[#35b6cf] shadow-md ring-1 ring-[#35b6cf]/10' : 'border-slate-100 opacity-60'} ${isResponded ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isSelected ? 'bg-[#35b6cf]/10 text-[#35b6cf]' : 'bg-slate-100 text-slate-400'}`}>
                                                                {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-bold text-slate-800 truncate">{name}</h4>
                                                                <p className="text-xs text-slate-500 truncate">{colab.email || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#35b6cf] border-[#35b6cf] text-white' : 'border-slate-300'}`}>
                                                            {isSelected && <Check size={14} />}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="bg-slate-50/50 p-2 rounded-lg">
                                                            <span className="text-slate-400 block mb-0.5">Cargo</span>
                                                            <span className="text-slate-700 font-semibold truncate block">{colab.cargo || '-'}</span>
                                                        </div>
                                                        <div className="bg-slate-50/50 p-2 rounded-lg">
                                                            <span className="text-slate-400 block mb-0.5">Setor</span>
                                                            <span className="text-slate-700 font-semibold truncate block">{colab.setor || '-'}</span>
                                                        </div>
                                                        <div className={`p-2 rounded-lg border ${isResponded ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50/50 border-transparent text-slate-500'}`}>
                                                            <span className="text-[10px] uppercase font-bold block mb-0.5 opacity-60">Status</span>
                                                            <div className="flex items-center gap-1 font-bold">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${isResponded ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                                {isResponded ? 'Respondido' : 'Pendente'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Empty State for Search */}
                                    {summaryData.company.collaborators.filter((colab: any) => {
                                        const name = colab.nome || "";
                                        const role = colab.cargo || "";
                                        const sector = colab.setor || 'Geral';
                                        return !collaboratorSearch ||
                                            name.toLowerCase().includes(collaboratorSearch.toLowerCase()) ||
                                            role.toLowerCase().includes(collaboratorSearch.toLowerCase()) ||
                                            sector.toLowerCase().includes(collaboratorSearch.toLowerCase());
                                    }).length === 0 && (
                                            <div className="p-8 text-center text-slate-400 text-sm">
                                                Nenhum colaborador encontrado.
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}

                    {expandedView === 'questions' && (
                        <div className="h-full flex flex-col min-w-0 w-full">
                            <div className="px-6 py-4 border-b border-slate-100 bg-white min-h-[5rem] shrink-0">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <HelpCircle size={18} className="text-[#35b6cf]" />
                                        Perguntas do Formulário
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold bg-slate-100 px-2 py-1 rounded-md text-slate-500">
                                            {filteredQuestions.length}
                                        </span>
                                        <button onClick={() => setExpandedView('none')} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative w-[70%] h-11">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar pergunta..."
                                            value={questionSearch}
                                            onChange={(e) => setQuestionSearch(e.target.value)}
                                            className="w-full h-full pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#35b6cf] transition-all"
                                        />
                                    </div>
                                    <div className="w-[30%] h-11">
                                        <Select
                                            value={questionFilter}
                                            onChange={(val) => setQuestionFilter(val)}
                                            options={[
                                                { label: 'Todas Dimensões', value: '' },
                                                ...questionsDimensions.map(d => ({ label: d, value: d }))
                                            ]}
                                            placeholder="Todas Dimensões"
                                            className="h-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 min-h-0">
                                <div className="space-y-3">
                                    {filteredQuestions.map((q, idx) => (
                                        <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 hover:border-[#35b6cf]/50 transition-colors">
                                            <div className="mt-1 w-6 h-6 rounded-full bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center text-xs font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-slate-800 font-medium text-sm">{q.text}</p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-50 px-2 py-1 rounded">
                                                        {q.dimension}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredQuestions.length === 0 && (
                                        <p className="text-center text-slate-400 py-8 text-sm">Nenhuma pergunta encontrada.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {expandedView === 'description' && (
                        <div className="h-full flex flex-col min-w-0 w-full">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white text-[#35b6cf] min-h-[4rem] shrink-0">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText size={18} />
                                    Descrição Completa
                                </h3>
                                <button
                                    onClick={() => setExpandedView('none')}
                                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto bg-white flex-1 min-h-0">
                                <div className="max-w-2xl mx-auto">
                                    <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-xl bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center">
                                            <LayoutTemplate size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{summaryData.formTitle}</h4>
                                            <p className="text-xs text-slate-400">Publicado em {new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="prose prose-slate max-w-none">
                                        <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base">
                                            {summaryData.formDesc}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Modal de Importação */}
                <ImportCollaboratorsModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportCollaborators}
                />
            </div>
        </div>
    );
};
