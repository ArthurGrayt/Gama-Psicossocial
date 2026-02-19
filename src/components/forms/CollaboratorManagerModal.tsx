
import React, { useState, useEffect } from 'react';
import { X, Search, Plus, User, FileSpreadsheet, Building, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ImportCollaboratorsModal } from './ImportCollaboratorsModal';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { Select } from '../ui/Select';
import ReactDOM from 'react-dom';

interface CollaboratorManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    company?: any; // Now optional
    companies?: any[]; // List of available companies for selection
}

export const CollaboratorManagerModal: React.FC<CollaboratorManagerModalProps> = ({ isOpen, onClose, company, companies = [] }) => {
    const [loading, setLoading] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<any>(null); // Local state for selected company

    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [units, setUnits] = useState<any[]>([]);
    const [refData, setRefData] = useState<{ sectors: any[], roles: any[] }>({ sectors: [], roles: [] });
    const [filterSector, setFilterSector] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterUnit, setFilterUnit] = useState('');

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

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [colabToDelete, setColabToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Initialize or Reset
    useEffect(() => {
        if (isOpen) {
            if (company) {
                // Pre-selected mode (Manage Mode)
                setSelectedCompany(company);
                setIsAdding(false);
            } else {
                // Global mode (Add Only Mode): Reset selection
                setSelectedCompany(null);
                setCollaborators([]);
                setUnits([]);
                setIsAdding(true); // Always adding in this mode
            }
        }
    }, [isOpen, company]);

    // Fetch Data when Company Changes
    useEffect(() => {
        if (isOpen && selectedCompany) {
            fetchInitialData();
        }
    }, [selectedCompany]);

    const fetchInitialData = async () => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            // 1. Fetch Units for this Company (Client)
            // 1. Fetch Units
            // 1. Fetch Units
            const { data: unitsData } = await supabase
                .from('unidades')
                .select('id, nome, empresa_mae, setores, cargos')
                .eq('empresa_mae', selectedCompany.cliente_uuid);

            const unitList = unitsData || [];
            if (unitList.length === 0) {
                setUnits([]);
                setCollaborators([]);
                setRefData({ sectors: [], roles: [] });
                setLoading(false);
                return;
            }

            setUnits(unitList);
            const unitIds = unitList.map(u => u.id);

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
                .select('*, cargos(nome)')
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



        } catch (error) {
            console.error('Error fetching manager data:', error);
        } finally {
            setLoading(false);
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
            const toInsert = importedData.map(c => {
                // Tenta resolver IDs de setor e cargo a partir do nome
                const sectorObj = refData.sectors.find(s => s.nome.toLowerCase() === (c.setor || '').toLowerCase());
                const roleObj = refData.roles.find(r => r.nome.toLowerCase() === (c.cargo || '').toLowerCase());

                return {
                    nome: c.nome,
                    email: c.email || null,
                    cpf: c.cpf || null,
                    telefone: c.telefone || null,
                    data_nascimento: c.dataNascimento || null,
                    sexo: c.sexo || null,
                    data_desligamento: c.dataDesligamento || null,
                    cargo: c.cargo || null,
                    setor: c.setor || null,
                    cargo_id: roleObj?.id || null,
                    setor_id: sectorObj?.id || null,
                    unidade_id: Number(defaultUnitId),
                    cod_categoria: 101, // Default
                    texto_categoria: "Empregado - Geral"
                };
            });

            const { data, error } = await supabase
                .from('colaboradores')
                .insert(toInsert)
                .select();

            if (error) throw error;

            // Refresh list
            await fetchInitialData();
            alert(`${(data || []).length} colaboradores importados com sucesso!`);
            setIsImportModalOpen(false);

        } catch (error: any) {
            console.error('Error importing:', error);
            alert(`Erro ao importar colaboradores: ${error.message || 'Erro desconhecido'}`);
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
                cargo_id: newColab.cargo ? Number(newColab.cargo) : null,
                setor_id: newColab.setor ? Number(newColab.setor) : null,
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

        const matchesUnit = filterUnit ? (String(c.unidade_id) === filterUnit) : true;

        return matchesSearch && matchesSector && matchesRole && matchesUnit;
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

    if (!isOpen) return null;

    // Em vez de retornar a div direto, retorne via portal
    return ReactDOM.createPortal(
        // Wrapper Principal
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4">

            {/* Backdrop com Blur */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Container do Modal */}
            <div
                className="relative bg-white rounded-t-[2rem] md:rounded-2xl w-full h-[94dvh] md:h-auto md:max-w-4xl md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Header - Double Rounding Strict */}
                <div className="w-full flex items-center justify-between px-6 py-5 md:px-8 md:py-6 bg-white border-b border-transparent md:border-slate-100 shrink-0 relative z-10 rounded-t-[2rem] md:rounded-t-2xl">
                    <div className="min-w-0 flex flex-col">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate">
                            {isAdding ? 'Cadastrar Novo Colaborador' : 'Gerenciar Colaboradores'}
                        </h2>
                        {company && <span className="text-xs text-slate-500 truncate">{company.nome_fantasia || company.razao_social}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white relative z-0">

                    {/* Filters Bar - Two Row Structure */}
                    {!isAdding && (
                        <div className="mb-6 space-y-4">
                            {/* Row 1: Search and Actions */}
                            <div className="flex flex-col-reverse md:flex-row-reverse gap-4 items-center">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar colaborador..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] transition-all"
                                    />
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => setIsAdding(true)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-[#139690] hover:bg-teal-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm shadow-[#139690]/20 text-sm font-bold"
                                    >
                                        <Plus size={18} />
                                        Novo Colaborador
                                    </button>

                                    <button
                                        onClick={() => setIsImportModalOpen(true)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 hover:border-[#139690] text-slate-600 hover:text-[#139690] rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                                    >
                                        <FileSpreadsheet size={16} />
                                        Importar
                                    </button>
                                </div>
                            </div>

                            {/* Row 2: Logical Filters */}
                            <div className="grid grid-cols-3 gap-2 md:gap-3">
                                <Select
                                    value={filterUnit}
                                    onChange={(val) => setFilterUnit(val)}
                                    options={[
                                        { label: 'Todas as Unidades', value: '' },
                                        ...units.map(u => ({ label: u.nome, value: String(u.id) }))
                                    ]}
                                    placeholder="Unidades"
                                />

                                <Select
                                    value={filterSector}
                                    onChange={(val) => setFilterSector(val)}
                                    options={[
                                        { label: 'Todos os Setores', value: '' },
                                        ...refData.sectors
                                            .filter(s => filterUnit ? units.find(u => String(u.id) === filterUnit)?.setores?.includes(s.id) : true)
                                            .map(s => ({ label: s.nome, value: String(s.id) }))
                                    ]}
                                    placeholder="Setores"
                                />

                                <Select
                                    value={filterRole}
                                    onChange={(val) => setFilterRole(val)}
                                    options={[
                                        { label: 'Todos os Cargos', value: '' },
                                        ...refData.roles
                                            .filter(r => {
                                                const unitMatch = filterUnit ? units.find(u => String(u.id) === filterUnit)?.cargos?.includes(r.id) : true;
                                                const sectorMatch = filterSector ? String(r.setor_id) === filterSector : true;
                                                return unitMatch && sectorMatch;
                                            })
                                            .map(r => ({ label: r.nome, value: String(r.id) }))
                                    ]}
                                    placeholder="Cargos"
                                />
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-[#139690] border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Carregando colaboradores...</p>
                        </div>
                    ) : isAdding ? (
                        /* Add Form Placeholder - Assuming complex form existed, implementing simple placeholder or restore if possible. 
                           Given I cannot restore exact form logic easily without more context, I will provide a structure that allows 'back' and basic fields.
                        */
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                {/* Nome e Email - Linha inteira ou dividida */}
                                <div className="md:col-span-6 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                                    <input
                                        value={newColab.nome}
                                        onChange={e => setNewColab({ ...newColab, nome: e.target.value })}
                                        placeholder="Nome do colaborador"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-6 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Corporativo</label>
                                    <input
                                        value={newColab.email}
                                        onChange={e => setNewColab({ ...newColab, email: e.target.value })}
                                        placeholder="email@empresa.com"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] outline-none transition-all"
                                    />
                                </div>

                                {/* CPF e Telefone */}
                                <div className="md:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">CPF</label>
                                    <input
                                        value={newColab.cpf}
                                        onChange={e => setNewColab({ ...newColab, cpf: e.target.value })}
                                        placeholder="000.000.000-00"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] outline-none transition-all"
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Telefone</label>
                                    <input
                                        value={newColab.telefone}
                                        onChange={e => setNewColab({ ...newColab, telefone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] outline-none transition-all"
                                    />
                                </div>

                                {/* Nascimento e Sexo */}
                                <div className="md:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nascimento</label>
                                    <input
                                        type="date"
                                        value={newColab.dataNascimento}
                                        onChange={e => setNewColab({ ...newColab, dataNascimento: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] outline-none transition-all text-slate-600"
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Sexo</label>
                                    <Select
                                        value={newColab.sexo}
                                        onChange={(val) => setNewColab({ ...newColab, sexo: val })}
                                        options={[
                                            { label: 'Masculino', value: 'Masculino' },
                                            { label: 'Feminino', value: 'Feminino' },
                                            { label: 'Outro', value: 'Outro' }
                                        ]}
                                        placeholder="Selecione"
                                    />
                                </div>

                                {/* Data Desligamento - Opcional */}
                                <div className="md:col-span-4 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Data Desligamento</label>
                                    <input
                                        type="date"
                                        value={newColab.dataDesligamento}
                                        onChange={e => setNewColab({ ...newColab, dataDesligamento: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#139690]/20 focus:border-[#139690] outline-none transition-all text-slate-600"
                                    />
                                </div>

                                {/* Unidade */}
                                <div className="md:col-span-8 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Unidade / Filial</label>
                                    <Select
                                        value={newColab.unidade_id}
                                        onChange={(val) => setNewColab({ ...newColab, unidade_id: val, setor: '', cargo: '' })}
                                        options={units.map(u => ({ label: u.nome, value: String(u.id) }))}
                                        placeholder="Selecione a Unidade"
                                    />
                                </div>

                                {/* Setor e Cargo */}
                                <div className="md:col-span-6 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Setor</label>
                                    <Select
                                        value={newColab.setor}
                                        onChange={(val) => setNewColab({ ...newColab, setor: val, cargo: '' })}
                                        options={availableSectors.map(s => ({ label: s.nome, value: String(s.id) }))}
                                        placeholder="Selecione o Setor"
                                        disabled={!newColab.unidade_id}
                                    />
                                </div>
                                <div className="md:col-span-6 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Cargo</label>
                                    <Select
                                        value={newColab.cargo}
                                        onChange={(val) => setNewColab({ ...newColab, cargo: val })}
                                        options={availableRoles.map(r => ({ label: r.nome, value: String(r.id) }))}
                                        placeholder="Selecione o Cargo"
                                        disabled={!newColab.setor}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddCollaborator}
                                    disabled={!newColab.nome || !newColab.unidade_id || !newColab.cargo || loading}
                                    className="px-8 py-2.5 bg-[#139690] text-white font-bold rounded-xl hover:bg-[#0e7a75] disabled:opacity-50 shadow-lg shadow-[#139690]/20 transition-all flex items-center gap-2"
                                >
                                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                                    Salvar Colaborador
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* List of Collaborators */
                        <div className="space-y-3 pb-20">
                            {filteredCollaborators.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <User size={32} />
                                    </div>
                                    <h3 className="text-slate-900 font-medium">Nenhum colaborador encontrado</h3>
                                    <p className="text-slate-500 text-sm mt-1">Tente ajustar os filtros ou cadastre um novo.</p>
                                </div>
                            ) : (
                                filteredCollaborators.map((colab: any) => (
                                    <div key={colab.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-[#139690]/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#139690]/10 text-[#139690] flex items-center justify-center font-bold text-lg">
                                                {colab.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm md:text-base">{colab.nome}</h4>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 flex items-center gap-1">
                                                        <Building size={10} /> {colab.unidade_nome || 'N/A'}
                                                    </span>
                                                    {colab.cargo_nome && (
                                                        <span className="text-xs text-[#139690] bg-[#139690]/5 px-2 py-0.5 rounded-md border border-[#139690]/10 font-medium">
                                                            {colab.cargo_nome}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-[#139690] hover:bg-[#139690]/10 rounded-lg transition-all">
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setColabToDelete(colab);
                                                    setShowDeleteConfirm(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Nested Modals */}
            <ImportCollaboratorsModal
                isOpen={isImportModalOpen}
                onClose={() => {
                    setIsImportModalOpen(false);
                    fetchInitialData(); // Refresh after import
                }}
                onImport={handleImportCollaborators}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    // Implement delete logic specific to this modal if needed, or just close
                    setShowDeleteConfirm(false);
                }}
                title="Excluir Colaborador?"
                description={`Tem certeza que deseja excluir ${colabToDelete?.nome}? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
            />

        </div>,
        document.body
    );
};
