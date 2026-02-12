
import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Save, User, AlertCircle, FileSpreadsheet, Filter } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ImportCollaboratorsModal } from './ImportCollaboratorsModal';

interface CollaboratorManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    company: any; // Client object
}

export const CollaboratorManagerModal: React.FC<CollaboratorManagerModalProps> = ({ isOpen, onClose, company }) => {
    const [loading, setLoading] = useState(true);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [forms, setForms] = useState<any[]>([]);
    const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [units, setUnits] = useState<any[]>([]);
    const [refData, setRefData] = useState<{ sectors: any[], roles: any[] }>({ sectors: [], roles: [] });
    const [filterSector, setFilterSector] = useState('');
    const [filterRole, setFilterRole] = useState('');

    // New Colab State
    const [isAdding, setIsAdding] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [newColab, setNewColab] = useState({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        dataNascimento: '',
        sexo: '',
        dataDesligamento: '',
        cargo: '',
        setor: '',
        unidade_id: ''
    });

    useEffect(() => {
        if (isOpen && company) {
            fetchInitialData();
        }
    }, [isOpen, company]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Units for this Company (Client)
            // 1. Fetch Units
            const { data: unitsData } = await supabase
                .from('unidades')
                .select('id, nome, empresa_mae, setores, cargos')
                .eq('empresa_mae', company.cliente_uuid);

            const unitList = unitsData || [];
            setUnits(unitList);
            const unitIds = unitList.map(u => u.id);

            if (unitIds.length === 0) {
                setCollaborators([]);
                setForms([]);
                setRefData({ sectors: [], roles: [] });
                setLoading(false);
                return;
            }

            // 1.5 Fetch Reference Data (Sectors and Roles)
            const allSectorIds = Array.from(new Set((unitsData || []).flatMap(u => u.setores || [])));
            const allRoleIds = Array.from(new Set((unitsData || []).flatMap(u => u.cargos || [])));

            let fetchedSectors: any[] = [];
            if (allSectorIds.length > 0) {
                const { data } = await supabase.from('setor').select('id, nome').in('id', allSectorIds);
                fetchedSectors = data || [];
            }

            let fetchedRoles: any[] = [];
            if (allRoleIds.length > 0) {
                const { data } = await supabase.from('cargos').select('id, nome, setor_id').in('id', allRoleIds);
                fetchedRoles = data || [];
            }
            setRefData({ sectors: fetchedSectors, roles: fetchedRoles });

            // 2. Fetch Collaborators (All in these units)
            const { data: colabs } = await supabase
                .from('colaboradores')
                .select('id, nome, email, cargo, setor, unidade_id, cargo_id, cargos(nome)')
                .in('unidade_id', unitIds)
                .order('nome');

            // Map relation for safer access
            const mappedColabs = (colabs || []).map(c => {
                const cargoObj = Array.isArray(c.cargos) ? c.cargos[0] : c.cargos;
                return {
                    ...c,
                    cargo_nome: cargoObj?.nome || c.cargo // Priority to relation
                };
            });

            setCollaborators(mappedColabs);

            // 3. Fetch Forms (To manage participation)
            const { data: formsData } = await supabase
                .from('forms')
                .select('id, title, colaboladores_inclusos, unidade_id')
                .in('unidade_id', unitIds) // Assuming forms are linked to units
                .order('created_at', { ascending: false });

            const fetchedForms = formsData || [];
            setForms(fetchedForms);

            if (fetchedForms.length > 0) {
                // Default to first form
                const initialForm = fetchedForms[0];
                setSelectedFormId(initialForm.id);
                const currentInvited = initialForm.colaboladores_inclusos || [];
                setInvitedIds(new Set(currentInvited.map(String)));
            } else {
                setSelectedFormId(null);
                setInvitedIds(new Set());
            }

        } catch (error) {
            console.error('Error fetching manager data:', error);
        } finally {
            setLoading(false);
        }
    };

    // When form selection changes, update invited set
    const handleFormChange = (formId: number) => {
        setSelectedFormId(formId);
        const form = forms.find(f => f.id === formId);
        if (form) {
            setInvitedIds(new Set((form.colaboladores_inclusos || []).map(String)));
        }
    };

    const handleToggleParticipant = async (colabId: string, isCurrentlyIncluded: boolean) => {
        if (!selectedFormId) return;

        const strId = String(colabId);
        const newSet = new Set(invitedIds);

        if (isCurrentlyIncluded) {
            newSet.delete(strId);
        } else {
            newSet.add(strId);
        }

        // Optimistic UI
        setInvitedIds(newSet);

        // API Update
        try {
            const { error } = await supabase
                .from('forms')
                .update({ colaboladores_inclusos: Array.from(newSet) })
                .eq('id', selectedFormId);

            if (error) throw error;

            // Update local form state
            setForms(prev => prev.map(f =>
                f.id === selectedFormId
                    ? { ...f, colaboladores_inclusos: Array.from(newSet) }
                    : f
            ));

        } catch (error) {
            console.error('Error updating participation:', error);
            // Revert
            setInvitedIds(invitedIds);
            alert('Erro ao atualizar participação.');
        }
    };

    const handleImportCollaborators = async (importedData: any[]) => {
        if (!importedData || importedData.length === 0) return;

        // Default unit: Selected Form unit OR First unit in list
        const defaultUnitId = newColab.unidade_id || (units.length > 0 ? units[0].id : null);

        if (!defaultUnitId) {
            alert("Não foi possível identificar a unidade de destino. Por favor, selecione uma unidade no formulário de cadastro antes de importar.");
            return;
        }

        setLoading(true);
        try {
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
                unidade_id: Number(defaultUnitId),
                cod_categoria: 101, // Default
                texto_categoria: "Empregado - Geral"
            }));

            const { data, error } = await supabase
                .from('colaboradores')
                .insert(toInsert)
                .select();

            if (error) throw error;

            // Refresh list
            fetchInitialData();
            alert(`${(data || []).length} colaboradores importados com sucesso!`);
            setIsImportModalOpen(false);

        } catch (error) {
            console.error('Error importing:', error);
            alert('Erro ao importar colaboradores.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCollaborator = async () => {
        if (!newColab.nome || !newColab.unidade_id) {
            alert('Nome e Unidade são obrigatórios');
            return;
        }

        try {
            // Insert
            const payload = {
                nome: newColab.nome,
                email: newColab.email || null,
                cpf: newColab.cpf || null,
                telefone: newColab.telefone || null,
                data_nascimento: newColab.dataNascimento || null,
                sexo: newColab.sexo || null,
                data_desligamento: newColab.dataDesligamento || null,
                // Find IDs for sector and role if possible, but we are storing IDs in newColab now?
                // Wait, newColab state is still strings or we updated it?
                // We will update newColab to store ID for sector/cargo if selected from dropdown.
                // But DB expects cargo_id.
                // And we want to save Text too for legacy support?
                // We'll calculate the text from the selected ID.
                cargo_id: newColab.cargo ? Number(newColab.cargo) : null, // Assuming newColab.cargo stores ID now
                setor: refData.sectors.find(s => String(s.id) === newColab.setor)?.nome || null,
                cargo: refData.roles.find(r => String(r.id) === newColab.cargo)?.nome || null,
                unidade_id: Number(newColab.unidade_id),
                cod_categoria: 101,
                texto_categoria: "Empregado - Geral"
            };

            const { data, error } = await supabase
                .from('colaboradores')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            // Add to list
            const addedColab = { ...data, cargo_nome: data.cargo || '-' };
            setCollaborators(prev => [addedColab, ...prev]);

            // If there's a selected form, auto-invite?
            if (selectedFormId) {
                await handleToggleParticipant(String(addedColab.id), false); // Toggle ON
            }

            // Reset
            setIsAdding(false);
            setNewColab({
                nome: '', email: '', cpf: '', telefone: '',
                dataNascimento: '', sexo: '', dataDesligamento: '',
                cargo: '', setor: '', unidade_id: ''
            });
            alert('Colaborador adicionado com sucesso!');

        } catch (error) {
            console.error('Error adding collaborator:', error);
            alert('Erro ao adicionar colaborador. Verifique se a unidade está correta.');
        }
    };

    const filteredCollaborators = collaborators.filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSector = filterSector ? (c.setor === filterSector || c.setor_id === Number(filterSector) || (c.cargos?.setor_id === Number(filterSector))) : true;
        // Logic for sector filter: 'setor' column is string. filterSector is string name or ID?
        // UI uses Name for filter or ID? 
        // Let's use Name for logic consistency with current data, OR ID if we have it.
        // Collaborators have 'setor' string.

        const matchesRole = filterRole ? (c.cargo === filterRole || c.cargo_nome === filterRole) : true;

        return matchesSearch && matchesSector && matchesRole;
    });

    // Derived lists for form
    const availableSectors = newColab.unidade_id
        ? refData.sectors.filter(s => units.find(u => String(u.id) === newColab.unidade_id)?.setores?.includes(s.id))
        : [];

    const availableRoles = newColab.unidade_id && newColab.setor
        ? refData.roles.filter(r =>
            units.find(u => String(u.id) === newColab.unidade_id)?.cargos?.includes(r.id) &&
            String(r.setor_id) === newColab.setor
        )
        : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Gerenciar Colaboradores</h2>
                        <p className="text-sm text-slate-500">{company.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Controls */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 space-y-4">
                    {/* Add Button */}
                    {!isAdding ? (
                        <div className="flex items-center justify-between">
                            {/* Form Selection */}
                            <div className="flex-1 max-w-sm mr-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Formulário Ativo (Participantes)</label>
                                {forms.length > 0 ? (
                                    <select
                                        value={selectedFormId || ''}
                                        onChange={(e) => handleFormChange(Number(e.target.value))}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-[#35b6cf] outline-none shadow-sm"
                                    >
                                        {forms.map(f => (
                                            <option key={f.id} value={f.id}>{f.title}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm text-orange-500 font-medium flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
                                        <AlertCircle size={16} />
                                        Nenhum formulário encontrado.
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsAdding(true)}
                                className="flex items-center gap-2 bg-[#35b6cf] text-white font-bold text-sm hover:bg-[#2ca3bc] px-4 py-2.5 rounded-xl transition-all shadow-sm"
                            >
                                <Plus size={18} />
                                Novo Colaborador
                            </button>

                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 font-bold text-sm hover:bg-emerald-50 px-4 py-2.5 rounded-xl transition-all shadow-sm"
                            >
                                <FileSpreadsheet size={18} />
                                Importar Planilha
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg animate-in slide-in-from-top-2 duration-200 relative">
                            <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            <h4 className="font-bold text-slate-800 mb-4 text-lg">Cadastrar Novo Colaborador</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/20 transition-all"
                                        value={newColab.nome}
                                        onChange={e => setNewColab({ ...newColab, nome: e.target.value })}
                                        placeholder="Ex: Maria Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/20 transition-all"
                                        value={newColab.email}
                                        onChange={e => setNewColab({ ...newColab, email: e.target.value })}
                                        placeholder="email@empresa.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF</label>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                        value={newColab.cpf}
                                        onChange={e => setNewColab({ ...newColab, cpf: e.target.value })}
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                        value={newColab.telefone}
                                        onChange={e => setNewColab({ ...newColab, telefone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nascimento</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                        value={newColab.dataNascimento}
                                        onChange={e => setNewColab({ ...newColab, dataNascimento: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sexo</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] bg-white"
                                        value={newColab.sexo}
                                        onChange={e => setNewColab({ ...newColab, sexo: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] bg-white"
                                        value={newColab.setor}
                                        onChange={e => setNewColab({ ...newColab, setor: e.target.value, cargo: '' })} // Reset cargo on sector change
                                        disabled={!newColab.unidade_id}
                                    >
                                        <option value="">{newColab.unidade_id ? "Selecione..." : "Selecione a Unidade"}</option>
                                        {availableSectors.map(s => (
                                            <option key={s.id} value={s.id}>{s.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] bg-white"
                                        value={newColab.cargo}
                                        onChange={e => setNewColab({ ...newColab, cargo: e.target.value })}
                                        disabled={!newColab.setor}
                                    >
                                        <option value="">{newColab.setor ? "Selecione..." : "Selecione o Setor"}</option>
                                        {availableRoles.map(r => (
                                            <option key={r.id} value={r.id}>{r.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidade *</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/20 transition-all bg-white"
                                        value={newColab.unidade_id}
                                        onChange={e => setNewColab({ ...newColab, unidade_id: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Desligamento</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                        value={newColab.dataDesligamento}
                                        onChange={e => setNewColab({ ...newColab, dataDesligamento: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddCollaborator}
                                    className="px-6 py-2 bg-[#35b6cf] text-white rounded-lg text-sm font-bold hover:bg-[#2ca3bc] shadow-sm flex items-center gap-2 transition-all"
                                >
                                    <Save size={18} />
                                    Salvar Cadastro
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 flex-1">
                        {/* Sector Filter */}
                        <div className="relative min-w-[140px]">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] appearance-none"
                                value={filterSector}
                                onChange={(e) => setFilterSector(e.target.value)}
                            >
                                <option value="">Todos os Setores</option>
                                {refData.sectors.map(s => (
                                    <option key={s.id} value={s.nome}>{s.nome}</option> // Filtering by Name for list
                                ))}
                            </select>
                        </div>

                        {/* Role Filter */}
                        <div className="relative min-w-[140px]">
                            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] appearance-none"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="">Todos os Cargos</option>
                                {refData.roles.map(r => (
                                    <option key={r.id} value={r.nome}>{r.nome}</option> // Filtering by Name for list
                                ))}
                            </select>
                        </div>

                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nome ou email..."
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                            />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto bg-slate-50/30">
                    {loading ? (
                        <div className="flex justify-center p-12 text-slate-400 items-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            Carregando dados...
                        </div>
                    ) : filteredCollaborators.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-8 py-4 border-b border-slate-100">Colaborador</th>
                                    <th className="px-6 py-4 border-b border-slate-100">Unidade</th>
                                    <th className="px-6 py-4 border-b border-slate-100 text-center w-32">Participante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredCollaborators.map(colab => {
                                    const isIncluded = invitedIds.has(String(colab.id));
                                    return (
                                        <tr key={colab.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {colab.nome ? colab.nome.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-700">{colab.nome}</p>
                                                        <p className="text-xs text-slate-400">{colab.email || 'Sem email'} • {colab.cargo_nome || 'Cargo não def.'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium border border-slate-200">
                                                    {units.find(u => u.id === colab.unidade_id)?.nome || colab.unidade_id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleToggleParticipant(colab.id, isIncluded)}
                                                    disabled={!selectedFormId}
                                                    title={!selectedFormId ? "Selecione um formulário" : isIncluded ? "Remover participação" : "Incluir participação"}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#35b6cf] focus:ring-offset-2 ${!selectedFormId ? 'bg-slate-100 cursor-not-allowed opacity-50' :
                                                        isIncluded ? 'bg-emerald-500' : 'bg-slate-200'
                                                        }`}
                                                >
                                                    <span
                                                        className={`${isIncluded ? 'translate-x-6' : 'translate-x-1'
                                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm`}
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center p-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <User size={32} />
                            </div>
                            <h3 className="text-slate-500 font-medium">Nenhum colaborador encontrado</h3>
                            <p className="text-sm text-slate-400 mt-2">Adicione novos colaboradores para começar.</p>
                        </div>
                    )}
                </div>
            </div>

            <ImportCollaboratorsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportCollaborators}
            />
        </div>
    );
};
