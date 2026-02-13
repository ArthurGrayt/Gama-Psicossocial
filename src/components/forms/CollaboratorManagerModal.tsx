
import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Save, User, FileSpreadsheet, Filter, Building, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ImportCollaboratorsModal } from './ImportCollaboratorsModal';
import { ConfirmationModal } from '../ui/ConfirmationModal';

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
    const [filterRole] = useState('');
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

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
            <div
                className="bg-white md:rounded-2xl w-full h-[calc(100dvh-70px)] md:h-auto md:max-w-4xl md:max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b border-slate-100">
                    <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate">
                            {isAdding ? 'Cadastrar Novo Colaborador' : 'Gerenciar Colaboradores'}
                        </h2>
                        {selectedCompany && <p className="text-sm text-slate-500 truncate">{selectedCompany.name || selectedCompany.nome_fantasia || selectedCompany.razao_social}</p>}
                        {!company && isAdding && <p className="text-sm text-slate-500">Preencha os dados abaixo.</p>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {!isAdding ? (
                        <>
                            {/* Controls (Manage Mode) */}
                            <div className="bg-slate-50 border-b border-slate-100">
                                <div className="px-4 md:px-8 py-4 md:py-6 pb-3 md:pb-4">
                                    <div className="flex items-center justify-between">

                                    </div>
                                </div>

                                {/* Toolbar */}
                                <div className="px-4 md:px-8 py-3 border-t border-slate-100 flex flex-wrap gap-2 md:gap-4 bg-white items-center">
                                    <div className="relative flex-1 min-w-[150px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar colaborador..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#35b6cf] transition-all text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsAdding(true)}
                                            disabled={!selectedCompany || loading}
                                            className="px-3 md:px-4 py-2 bg-[#35b6cf] text-white rounded-xl font-bold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            <Plus size={16} />
                                            <span className="hidden sm:inline">Novo</span>
                                        </button>
                                        <button
                                            onClick={() => setIsImportModalOpen(true)}
                                            disabled={!selectedCompany || loading}
                                            className="px-3 md:px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            <FileSpreadsheet size={16} />
                                            <span className="hidden sm:inline">Importar</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="px-4 md:px-8 py-2 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-2 md:gap-3 overflow-x-auto items-center">
                                    <div className="flex items-center gap-2 text-slate-400 mr-1 md:mr-2">
                                        <Filter size={12} />
                                        <span className="text-[10px] font-bold uppercase">Filtros</span>
                                    </div>
                                    <select
                                        value={filterUnit}
                                        onChange={(e) => setFilterUnit(e.target.value)}
                                        className="px-2 md:px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:border-[#35b6cf] flex-1 min-w-[100px] md:flex-none"
                                    >
                                        <option value="">Todas Unidades</option>
                                        {units.map((u: any) => (
                                            <option key={u.id} value={u.id}>{u.nome_unidade || u.nome || 'Unidade sem Nome'}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterSector}
                                        onChange={(e) => setFilterSector(e.target.value)}
                                        className="px-2 md:px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 outline-none focus:border-[#35b6cf] flex-1 min-w-[100px] md:flex-none"
                                    >
                                        <option value="">Todos Setores</option>
                                        {refData.sectors.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.nome || s.name || 'Setor sem Nome'}</option>
                                        ))}
                                    </select>

                                    <div className="flex-1"></div>
                                    <div className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                        <User size={12} />
                                        {collaborators.length} Total
                                    </div>
                                </div>
                            </div>
                            {/* List — Mobile cards + Desktop table */}
                            <div className="flex-1 overflow-y-auto p-0">
                                {loading && collaborators.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#35b6cf] mb-4"></div>
                                        <p>Carregando colaboradores...</p>
                                    </div>
                                ) : !selectedCompany ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <User size={32} />
                                        </div>
                                        <p>Selecione uma empresa para gerenciar</p>
                                    </div>
                                ) : collaborators.length > 0 ? (
                                    <>
                                        {/* Mobile Card Layout */}
                                        <div className="md:hidden divide-y divide-slate-100">
                                            {filteredCollaborators.map((colab) => (
                                                <div key={colab.id} className="px-4 py-3 flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-sm text-slate-800 truncate">{colab.nome}</div>
                                                        <div className="text-xs text-slate-500 truncate">{colab.cargo || colab.cargo_nome || '-'} · {colab.setor || 'Geral'}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {colab.data_desligamento ? (
                                                            <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold">Inativo</span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">Ativo</span>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setColabToDelete(colab);
                                                                setShowDeleteConfirm(true);
                                                            }}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Desktop Table */}
                                        <table className="hidden md:table w-full text-left border-collapse">
                                            <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-3 border-b border-slate-100">Nome / Email</th>
                                                    <th className="px-6 py-3 border-b border-slate-100">Cargo / Setor</th>
                                                    <th className="px-6 py-3 border-b border-slate-100">Status</th>
                                                    <th className="px-6 py-3 border-b border-slate-100 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {filteredCollaborators.map((colab) => (
                                                    <tr key={colab.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <div className="font-bold text-slate-800">{colab.nome}</div>
                                                                <div className="text-xs text-slate-500">{colab.email || '-'}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <div className="font-medium text-slate-700">{colab.cargo || '-'}</div>
                                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <Building size={10} />
                                                                    {colab.setor || 'Geral'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {colab.data_desligamento ? (
                                                                <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-bold">Inativo</span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold">Ativo</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="p-1.5 text-slate-400 hover:text-[#35b6cf] bg-slate-50 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setColabToDelete(colab);
                                                                        setShowDeleteConfirm(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                ) : (
                                    <div className="text-center p-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <User size={32} />
                                        </div>
                                        <h3 className="text-slate-500 font-medium">Nenhum colaborador encontrado</h3>
                                        <p className="text-sm text-slate-400 mt-2">Tente ajustar os filtros ou adicionar um novo.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer for Manage Mode */}
                            <div className="px-4 md:px-8 py-3 md:py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center md:rounded-b-2xl" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                                <div className="text-xs text-slate-400">
                                    Mostrando {collaborators.length} registros
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-4 md:px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                                >
                                    Fechar
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 md:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                        value={newColab.nome}
                                        onChange={e => setNewColab({ ...newColab, nome: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email *</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                        value={newColab.email}
                                        onChange={e => setNewColab({ ...newColab, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                        value={newColab.cpf}
                                        onChange={e => setNewColab({ ...newColab, cpf: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                        value={newColab.telefone}
                                        onChange={e => setNewColab({ ...newColab, telefone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Nascimento</label>
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

                                {/* Company Selector Logic for Global Mode - Next to Setor */}
                                {!company && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa Responsável *</label>
                                        <div className="relative">
                                            <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <select
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf]"
                                                value={selectedCompany?.id || ''}
                                                onChange={(e) => {
                                                    const comp = companies.find(c => String(c.id) === e.target.value);
                                                    setSelectedCompany(comp || null);
                                                }}
                                            >
                                                <option value="">Selecione...</option>
                                                {companies.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name || c.nome_fantasia || c.razao_social || 'Empresa sem Nome'}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Setor</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] bg-white"
                                        value={newColab.setor}
                                        onChange={e => setNewColab({ ...newColab, setor: e.target.value, cargo: '' })}
                                        disabled={!newColab.unidade_id}
                                    >
                                        <option value="">{newColab.unidade_id ? "Selecione..." : "Selecione a Unidade"}</option>
                                        {availableSectors.map(s => (
                                            <option key={s.id} value={s.id}>{s.nome || s.name || 'Setor sem Nome'}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidade *</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/20 transition-all bg-white"
                                        value={newColab.unidade_id}
                                        onChange={e => setNewColab({ ...newColab, unidade_id: e.target.value })}
                                        disabled={!selectedCompany}
                                    >
                                        <option value="">{selectedCompany ? "Selecione a Unidade" : "Selecione a Empresa primeiro"}</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.nome_unidade || u.nome || 'Unidade sem Nome'}</option>
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
                                            <option key={r.id} value={r.id}>{r.nome || r.name || 'Cargo sem Nome'}</option>
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
                            <div className="flex justify-end gap-3 mt-4" style={{ paddingBottom: 'max(0, env(safe-area-inset-bottom))' }}>
                                <button
                                    onClick={() => {
                                        if (company) {
                                            setIsAdding(false);
                                        } else {
                                            onClose();
                                        }
                                    }}
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
                </div>

                <ImportCollaboratorsModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={(data) => {
                        handleImportCollaborators(data);
                        setIsImportModalOpen(false);
                    }}
                />

                <ConfirmationModal
                    isOpen={showDeleteConfirm}
                    onClose={() => {
                        if (!isDeleting) {
                            setShowDeleteConfirm(false);
                            setColabToDelete(null);
                        }
                    }}
                    onConfirm={async () => {
                        if (!colabToDelete) return;
                        setIsDeleting(true);
                        try {
                            const { error } = await supabase
                                .from('colaboradores')
                                .delete()
                                .eq('id', colabToDelete.id);
                            if (error) throw error;
                            setShowDeleteConfirm(false);
                            setColabToDelete(null);
                            fetchInitialData();
                        } catch (err) {
                            console.error('Error deleting:', err);
                            alert('Erro ao excluir colaborador.');
                        } finally {
                            setIsDeleting(false);
                        }
                    }}
                    title="Excluir Colaborador?"
                    description={`Você tem certeza que deseja excluir o colaborador "${colabToDelete?.nome}"?\n\nEsta ação não poderá ser desfeita.`}
                    confirmText={isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                    cancelText="Cancelar"
                    type="danger"
                />
            </div>
        </div>
    );
};
