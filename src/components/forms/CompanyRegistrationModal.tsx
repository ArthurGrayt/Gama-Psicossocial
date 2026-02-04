import React, { useState, useEffect } from 'react';
import { X, Building, Camera, ChevronRight, Check, Plus, Trash2, Pencil, Users, LayoutGrid, Briefcase, Search, Filter, MoreVertical, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface CompanyRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any;
}

type Section = 'dados' | 'setores' | 'cargos' | 'colaboradores';

export const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    if (!isOpen) return null;

    const initialEmptyState = {
        // Company Data
        nomeFantasia: '',
        razaoSocial: '',
        cnpj: '',
        responsavel: '',
        email: '',
        telefone: '',
        cep: '',
        rua: '',
        bairro: '',
        cidade: '',
        uf: '',
        isMultiUnit: false,

        // Relational Data
        setores: [] as string[],
        cargos: [] as { nome: string; setor: string }[],
        // Collaborators
        colaboradores: [] as { nome: string; email: string; telefone: string; cargo: string; setor: string; dataNascimento: string; sexo: string }[],

        // Units
        units: [] as { id: number; name: string; sectors: string[] }[],
        selectedUnitId: null as number | null
    };

    const [activeSection, setActiveSection] = useState<Section>('dados');
    const [formData, setFormData] = useState(initialEmptyState);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Map incoming data structure to local state
                // Note: This mapping depends on what FormDashboard passes.
                // Assuming FormDashboard passes a structure compatible or we map it here.

                // MAPPING STRATEGY from MOCK DATA in FormDashboard:
                // units -> sectors strings. flatten for now.
                const flatSectors = initialData.units
                    ? Array.from(new Set(initialData.units.flatMap((u: any) => u.sectors || []))) as string[]
                    : (initialData.setores || []);

                const roles = (Array.isArray(initialData.roles) ? initialData.roles : [])
                    .flatMap((r: string) =>
                        flatSectors.length > 0
                            ? flatSectors.map((s: string) => ({ nome: r, setor: s }))
                            : [{ nome: r, setor: 'Geral' }]
                    );

                // Fallback if roles is empty, try cargos
                const finalRoles = roles.length > 0 ? roles : (initialData.cargos || []);

                setFormData({
                    nomeFantasia: initialData.nomeFantasia || initialData.name || '', // Handle both naming conventions
                    razaoSocial: initialData.razaoSocial || initialData.name || '',
                    cnpj: initialData.cnpj || '',
                    responsavel: initialData.responsavel || '',
                    email: initialData.email || '',
                    telefone: initialData.telefone || '',
                    cep: initialData.cep || '',
                    rua: initialData.rua || '',
                    bairro: initialData.bairro || '',
                    cidade: initialData.cidade || '',
                    uf: initialData.uf || '',
                    isMultiUnit: initialData.units && initialData.units.length > 1,
                    setores: flatSectors,
                    cargos: finalRoles,
                    colaboradores: initialData.collaborators || [],
                    units: initialData.units || [],
                    selectedUnitId: (initialData.units && initialData.units.length > 0) ? initialData.units[0].id : null
                });
            } else {
                setFormData(initialEmptyState);
            }
            setActiveSection('dados');
        }
    }, [isOpen, initialData]);

    const [newSector, setNewSector] = useState('');
    const [newRole, setNewRole] = useState('');
    const [selectedSectorForRole, setSelectedSectorForRole] = useState('');

    // Editing State
    const [editingSectorIndex, setEditingSectorIndex] = useState<number | null>(null);
    const [tempSectorName, setTempSectorName] = useState('');

    const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null);
    const [tempRoleName, setTempRoleName] = useState('');

    // Collaborator State
    const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
    // Collaborator Table State
    const [collabSearch, setCollabSearch] = useState('');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});

    const handleFilterSelect = (column: string, value: string) => {
        setSelectedFilters(prev => {
            const current = prev[column] || [];
            if (current.includes(value)) {
                return { ...prev, [column]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [column]: [...current, value] };
            }
        });
    };

    // Filtered Collaborators Logic
    const filteredCollaborators = formData.colaboradores.filter(colab => {
        // Global Search
        const searchLower = collabSearch.toLowerCase();
        const matchesSearch =
            (colab.nome || '').toLowerCase().includes(searchLower) ||
            (colab.setor || '').toLowerCase().includes(searchLower) ||
            (colab.cargo || '').toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        // Column Filters
        if (selectedFilters['sexo']?.length && !selectedFilters['sexo'].includes(colab.sexo)) return false;
        if (selectedFilters['cargo']?.length && !selectedFilters['cargo'].includes(colab.cargo)) return false;
        if (selectedFilters['setor']?.length && !selectedFilters['setor'].includes(colab.setor)) return false;

        return true;
    });

    const getUniqueValues = (column: 'sexo' | 'cargo' | 'setor') => {
        return Array.from(new Set(formData.colaboradores.map(c => c[column]).filter(Boolean)));
    };

    // --- Actions State ---
    const [actionMenuOpenIndex, setActionMenuOpenIndex] = useState<number | null>(null);
    const [deleteConfirmationIndex, setDeleteConfirmationIndex] = useState<number | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCollaboratorIndex, setEditingCollaboratorIndex] = useState<number | null>(null);
    const [editCollaboratorForm, setEditCollaboratorForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        setor: '',
        cargo: '',
        dataNascimento: '',
        sexo: ''
    });

    const [collaboratorForm, setCollaboratorForm] = useState({
        nome: '',
        email: '',
        telefone: '',
        setor: '',
        cargo: '',
        dataNascimento: '',
        sexo: ''
    });

    const handleCollaboratorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCollaboratorForm(prev => {
            if (name === 'setor') {
                return { ...prev, [name]: value, cargo: '' };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleEditCollaboratorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditCollaboratorForm(prev => {
            if (name === 'setor') {
                return { ...prev, [name]: value, cargo: '' };
            }
            return { ...prev, [name]: value };
        });
    };

    const openEditModal = (colab: any, index: number) => {
        setEditingCollaboratorIndex(index);
        setEditCollaboratorForm({ ...colab });
        setIsEditModalOpen(true);
        setActionMenuOpenIndex(null);
    };

    const saveEditCollaborator = () => {
        if (editingCollaboratorIndex === null) return;
        setFormData(prev => {
            const updated = [...prev.colaboradores];
            updated[editingCollaboratorIndex] = { ...editCollaboratorForm };
            return { ...prev, colaboradores: updated };
        });
        setIsEditModalOpen(false);
        setEditingCollaboratorIndex(null);
    };

    const confirmDeleteCollaborator = () => {
        if (deleteConfirmationIndex === null) return;
        removeCollaborator(deleteConfirmationIndex);
        setDeleteConfirmationIndex(null);
    };

    const addCollaborator = () => {
        if (!collaboratorForm.nome || !collaboratorForm.email || !collaboratorForm.cargo || !collaboratorForm.setor) return;
        setFormData(prev => ({
            ...prev,
            colaboradores: [...prev.colaboradores, { ...collaboratorForm }]
        }));
        setCollaboratorForm({
            nome: '',
            email: '',
            telefone: '',
            setor: '',
            cargo: '',
            dataNascimento: '',
            sexo: ''
        });
    };

    const removeCollaborator = (index: number) => {
        setFormData(prev => ({
            ...prev,
            colaboradores: prev.colaboradores.filter((_, i) => i !== index)
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- Sector Logic ---
    const addSector = () => {
        if (!newSector.trim()) return;
        setFormData(prev => ({
            ...prev,
            setores: [...prev.setores, newSector.trim()]
        }));
        setNewSector('');
    };

    const removeSector = (index: number) => {
        const sectorToRemove = formData.setores[index];
        setFormData(prev => ({
            ...prev,
            setores: prev.setores.filter((_, i) => i !== index),
            cargos: prev.cargos.filter(c => c.setor !== sectorToRemove)
        }));
    };

    const startEditSector = (index: number) => {
        setEditingSectorIndex(index);
        setTempSectorName(formData.setores[index]);
    };

    const handleSaveSector = (index: number) => {
        if (!tempSectorName.trim()) return;
        const oldSectorName = formData.setores[index];

        setFormData(prev => {
            const updatedSectors = [...prev.setores];
            updatedSectors[index] = tempSectorName.trim();

            const updatedCargos = prev.cargos.map(cargo =>
                cargo.setor === oldSectorName
                    ? { ...cargo, setor: tempSectorName.trim() }
                    : cargo
            );

            return {
                ...prev,
                setores: updatedSectors,
                cargos: updatedCargos
            };
        });
        setEditingSectorIndex(null);
        setTempSectorName('');
    };

    const cancelEditSector = () => {
        setEditingSectorIndex(null);
        setTempSectorName('');
    };

    // --- Role Logic ---
    const addRole = () => {
        if (!newRole.trim() || !selectedSectorForRole) return;
        setFormData(prev => ({
            ...prev,
            cargos: [...prev.cargos, { nome: newRole.trim(), setor: selectedSectorForRole }]
        }));
        setNewRole('');
    };

    const removeRole = (index: number) => {
        setFormData(prev => ({
            ...prev,
            cargos: prev.cargos.filter((_, i) => i !== index)
        }));
    };

    const startEditRole = (index: number) => {
        setEditingRoleIndex(index);
        setTempRoleName(formData.cargos[index].nome);
    };

    const handleSaveRole = (index: number) => {
        if (!tempRoleName.trim()) return;
        setFormData(prev => {
            const updatedCargos = [...prev.cargos];
            updatedCargos[index] = { ...updatedCargos[index], nome: tempRoleName.trim() };
            return {
                ...prev,
                cargos: updatedCargos
            };
        });
        setEditingRoleIndex(null);
        setTempRoleName('');
    };

    const cancelEditRole = () => {
        setEditingRoleIndex(null);
        setTempRoleName('');
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-[90rem] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex h-[85vh] animate-in fade-in zoom-in-95 duration-300">

                {/* --- Left Sidebar --- */}
                <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
                    {/* Header / Company Card */}
                    <div className="p-8 pb-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#35b6cf]" />
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 mx-auto mb-4 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform border border-slate-100">
                                {formData.nomeFantasia ? (
                                    <span className="text-2xl font-bold text-slate-400">{formData.nomeFantasia.substring(0, 2).toUpperCase()}</span>
                                ) : (
                                    <Building size={32} />
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 truncate px-2">{formData.nomeFantasia || 'Nova Empresa'}</h2>
                            <p className="text-sm text-slate-500 mt-1">{formData.cnpj || 'CNPJ não informado'}</p>

                            <div className="mt-4 flex items-center justify-center gap-2">
                                <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Ativo
                                </span>
                            </div>
                        </div>

                        {/* Unit Selector Dropdown */}
                        {formData.units.length > 0 && (
                            <div className="mt-4 px-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block pl-2">Unidade Selecionada</label>
                                <div className="relative">
                                    <select
                                        value={formData.selectedUnitId || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, selectedUnitId: Number(e.target.value) }))}
                                        className="w-full appearance-none bg-white border border-slate-200 text-slate-700 font-semibold py-3 pl-4 pr-10 rounded-xl outline-none focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 transition-all cursor-pointer shadow-sm hover:border-[#35b6cf]/50"
                                    >
                                        {formData.units.map((unit: any) => (
                                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
                        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">Gerenciamento</p>

                        <button
                            onClick={() => setActiveSection('dados')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeSection === 'dados' ? 'bg-white shadow-md text-[#35b6cf] border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeSection === 'dados' ? 'bg-[#35b6cf]/10' : 'bg-slate-100'}`}>
                                    <Building size={20} />
                                </div>
                                <span className="font-semibold">Dados Gerais</span>
                            </div>
                            {activeSection === 'dados' && <ChevronRight size={18} />}
                        </button>

                        <button
                            onClick={() => setActiveSection('setores')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeSection === 'setores' ? 'bg-white shadow-md text-[#35b6cf] border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeSection === 'setores' ? 'bg-[#35b6cf]/10' : 'bg-slate-100'}`}>
                                    <LayoutGrid size={20} />
                                </div>
                                <span className="font-semibold">Setores</span>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem]">{formData.setores.length}</span>
                        </button>

                        <button
                            onClick={() => setActiveSection('cargos')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeSection === 'cargos' ? 'bg-white shadow-md text-[#35b6cf] border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeSection === 'cargos' ? 'bg-[#35b6cf]/10' : 'bg-slate-100'}`}>
                                    <Briefcase size={20} />
                                </div>
                                <span className="font-semibold">Cargos</span>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem]">{formData.cargos.length}</span>
                        </button>

                        <button
                            onClick={() => setActiveSection('colaboradores')}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeSection === 'colaboradores' ? 'bg-white shadow-md text-[#35b6cf] border border-slate-100' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activeSection === 'colaboradores' ? 'bg-[#35b6cf]/10' : 'bg-slate-100'}`}>
                                    <Users size={20} />
                                </div>
                                <span className="font-semibold">Colaboradores</span>
                            </div>
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full min-w-[1.5rem]">0</span>
                        </button>
                    </nav>
                </div>



                {/* --- Right Content --- */}
                <div className="flex-1 flex flex-col bg-white w-2/3">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                {activeSection === 'dados' && 'Dados da Empresa'}
                                {activeSection === 'setores' && 'Gerenciar Setores'}
                                {activeSection === 'cargos' && 'Gerenciar Cargos'}
                                {activeSection === 'colaboradores' && 'Gerenciar Colaboradores'}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {activeSection === 'dados' && 'Visualize e edite as informações principais.'}
                                {activeSection === 'setores' && 'Adicione, renomeie ou remova setores.'}
                                {activeSection === 'cargos' && 'Defina cargos e suas vinculações.'}
                                {activeSection === 'colaboradores' && 'Gerencie o acesso e perfil dos membros.'}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                        {activeSection === 'dados' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 max-w-3xl">
                                {/* Identity & Profile Photo */}
                                <div className="flex flex-col sm:flex-row gap-8 items-start">
                                    <div className="flex-1 space-y-6 w-full">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">Dados Empresariais</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-semibold text-slate-700">Nome Fantasia</label>
                                                    <input
                                                        type="text"
                                                        name="nomeFantasia"
                                                        value={formData.nomeFantasia}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all"
                                                        placeholder="Ex: Gama Center"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-semibold text-slate-700">Razão Social</label>
                                                    <input
                                                        type="text"
                                                        name="razaoSocial"
                                                        value={formData.razaoSocial}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2 space-y-1.5">
                                                    <label className="text-sm font-semibold text-slate-700">CNPJ</label>
                                                    <input
                                                        type="text"
                                                        name="cnpj"
                                                        value={formData.cnpj}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-auto flex flex-col items-center space-y-3 pt-6">
                                        <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-slate-300">
                                            <Camera size={40} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">Logo</span>
                                    </div>
                                </div>
                                <hr className="border-slate-100" />
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contato</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Responsável</label>
                                            <input type="text" name="responsavel" value={formData.responsavel} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none" placeholder="Nome completo" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Email</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Telefone</label>
                                            <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none" />
                                        </div>
                                    </div>
                                </div>
                                <hr className="border-slate-100" />
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Endereço</h3>
                                    <div className="grid grid-cols-6 gap-4">
                                        <div className="col-span-2"><label className="text-xs font-bold text-slate-600">CEP</label><input type="text" name="cep" value={formData.cep} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                        <div className="col-span-4"><label className="text-xs font-bold text-slate-600">Rua</label><input type="text" name="rua" value={formData.rua} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                        <div className="col-span-2"><label className="text-xs font-bold text-slate-600">Bairro</label><input type="text" name="bairro" value={formData.bairro} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                        <div className="col-span-3"><label className="text-xs font-bold text-slate-600">Cidade</label><input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                        <div className="col-span-1"><label className="text-xs font-bold text-slate-600">UF</label><input type="text" name="uf" value={formData.uf} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-[#35b6cf]" /></div>
                                    </div>
                                </div>
                                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-start gap-3 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, isMultiUnit: !prev.isMultiUnit }))}>
                                    <div className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.isMultiUnit ? 'bg-[#35b6cf] border-[#35b6cf] text-white' : 'bg-white border-slate-300'}`}>
                                        {formData.isMultiUnit && <Check size={14} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">Empresa com Multi-unidades</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Marque se esta empresa gerencia múltiplas filiais.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'setores' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-3xl border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSector}
                                        onChange={(e) => setNewSector(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSector()}
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Nome do novo setor..."
                                    />
                                    <button onClick={addSector} className="bg-[#35b6cf] text-white p-3 rounded-xl hover:bg-[#2ca3bc]"><Plus size={24} /></button>
                                </div>
                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    {formData.setores.length === 0 && <p className="text-center text-slate-400 py-8">Nenhum setor cadastrado.</p>}
                                    {formData.setores.map((setor, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all group">
                                            {editingSectorIndex === idx ? (
                                                <div className="flex-1 flex gap-2 items-center">
                                                    <input
                                                        value={tempSectorName}
                                                        onChange={(e) => setTempSectorName(e.target.value)}
                                                        className="flex-1 p-2 rounded border border-[#35b6cf] outline-none"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleSaveSector(idx)} className="text-emerald-500 p-2"><Check size={18} /></button>
                                                    <button onClick={cancelEditSector} className="text-slate-400 p-2"><X size={18} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400"><LayoutGrid size={16} /></div>
                                                        <span className="font-semibold text-slate-700">{setor}</span>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditSector(idx)} className="p-2 text-slate-400 hover:text-[#35b6cf]"><Pencil size={16} /></button>
                                                        <button onClick={() => removeSector(idx)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSection === 'cargos' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-3xl border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                                <div className="grid grid-cols-3 gap-3">
                                    <select value={selectedSectorForRole} onChange={(e) => setSelectedSectorForRole(e.target.value)} className="col-span-1 border border-slate-200 rounded-xl px-3 outline-none">
                                        <option value="" disabled>Selecione Setor</option>
                                        {formData.setores.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                    </select>
                                    <div className="col-span-2 flex gap-2">
                                        <input
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value)}
                                            placeholder="Nome do cargo"
                                            disabled={!selectedSectorForRole}
                                            className="flex-1 border border-slate-200 rounded-xl px-3 outline-none disabled:bg-slate-50"
                                        />
                                        <button onClick={addRole} disabled={!newRole || !selectedSectorForRole} className="bg-[#35b6cf] text-white p-3 rounded-xl disabled:opacity-50"><Plus size={20} /></button>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    {formData.cargos.length === 0 && <p className="text-center text-slate-400 py-8">Nenhum cargo cadastrado.</p>}
                                    {formData.cargos.map((cargo, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all group">
                                            {editingRoleIndex === idx ? (
                                                <div className="flex-1 flex gap-2 items-center">
                                                    <input
                                                        value={tempRoleName}
                                                        onChange={(e) => setTempRoleName(e.target.value)}
                                                        className="flex-1 p-2 rounded border border-[#35b6cf] outline-none"
                                                        autoFocus
                                                    />
                                                    <span className="text-xs text-slate-400 px-2 border-l border-slate-200">{cargo.setor}</span>
                                                    <button onClick={() => handleSaveRole(idx)} className="text-emerald-500 p-2"><Check size={18} /></button>
                                                    <button onClick={cancelEditRole} className="text-slate-400 p-2"><X size={18} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-700">{cargo.nome}</span>
                                                            <span className="text-xs text-slate-400 flex items-center gap-1"><LayoutGrid size={10} /> {cargo.setor}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditRole(idx)} className="p-2 text-slate-400 hover:text-[#35b6cf]"><Pencil size={16} /></button>
                                                        <button onClick={() => removeRole(idx)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSection === 'colaboradores' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <div className=" bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                    <button
                                        onClick={() => setIsAddingCollaborator(!isAddingCollaborator)}
                                        className="w-full flex items-center justify-between p-6 hover:bg-slate-100 transition-colors text-left"
                                    >
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <div className="p-1 rounded bg-[#35b6cf]/10 text-[#35b6cf]">
                                                <Plus size={18} />
                                            </div>
                                            Novo Colaborador
                                        </h3>
                                        <ChevronRight
                                            size={20}
                                            className={`text-slate-400 transition-transform duration-300 ${isAddingCollaborator ? 'rotate-90' : ''}`}
                                        />
                                    </button>

                                    {isAddingCollaborator && (
                                        <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    name="nome"
                                                    value={collaboratorForm.nome}
                                                    onChange={handleCollaboratorChange}
                                                    placeholder="Nome completo"
                                                    className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none"
                                                />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={collaboratorForm.email}
                                                    onChange={handleCollaboratorChange}
                                                    placeholder="Email corporativo"
                                                    className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none"
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="date"
                                                        name="dataNascimento"
                                                        value={collaboratorForm.dataNascimento}
                                                        onChange={handleCollaboratorChange}
                                                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none text-slate-600"
                                                    />
                                                    <select
                                                        name="sexo"
                                                        value={collaboratorForm.sexo}
                                                        onChange={handleCollaboratorChange}
                                                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600"
                                                    >
                                                        <option value="" disabled>Sexo</option>
                                                        <option value="Masculino">Masculino</option>
                                                        <option value="Feminino">Feminino</option>
                                                        <option value="Outro">Outro</option>
                                                    </select>
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="telefone"
                                                    value={collaboratorForm.telefone}
                                                    onChange={handleCollaboratorChange}
                                                    placeholder="Telefone / WhatsApp"
                                                    className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] focus:ring-4 focus:ring-[#35b6cf]/10 outline-none"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <select
                                                        name="setor"
                                                        value={collaboratorForm.setor}
                                                        onChange={handleCollaboratorChange}
                                                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600"
                                                    >
                                                        <option value="" disabled>Setor</option>
                                                        {formData.setores.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                                    </select>
                                                    <select
                                                        name="cargo"
                                                        value={collaboratorForm.cargo}
                                                        onChange={handleCollaboratorChange}
                                                        disabled={!collaboratorForm.setor}
                                                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600 disabled:bg-slate-100 disabled:opacity-70"
                                                    >
                                                        <option value="" disabled>Cargo</option>
                                                        {formData.cargos
                                                            .filter(c => c.setor === collaboratorForm.setor)
                                                            .map((c, i) => <option key={i} value={c.nome}>{c.nome}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end mt-4">
                                                <Button
                                                    onClick={addCollaborator}
                                                    disabled={!collaboratorForm.nome || !collaboratorForm.email || !collaboratorForm.cargo}
                                                    className="bg-[#35b6cf] text-white px-6 py-2 rounded-xl hover:bg-[#2ca3bc] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Adicionar Colaborador
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Colaboradores Cadastrados ({filteredCollaborators.length})
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-64">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={collabSearch}
                                                    onChange={(e) => setCollabSearch(e.target.value)}
                                                    placeholder="Buscar nome, cargo..."
                                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#35b6cf]"
                                                />
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                                    className={`p-2 rounded-lg border transition-colors ${isFilterMenuOpen || Object.keys(selectedFilters).some(k => selectedFilters[k].length > 0) ? 'bg-[#35b6cf] border-[#35b6cf] text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                >
                                                    <Filter size={20} />
                                                </button>

                                                {/* Global Filter Menu */}
                                                {isFilterMenuOpen && (
                                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">

                                                            {/* Sexo Filter */}
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Sexo</div>
                                                                <div className="space-y-1">
                                                                    {getUniqueValues('sexo').map(opt => (
                                                                        <div
                                                                            key={opt}
                                                                            onClick={() => handleFilterSelect('sexo', opt)}
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedFilters['sexo']?.includes(opt) ? 'bg-[#35b6cf]/10 text-[#35b6cf] font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters['sexo']?.includes(opt) ? 'bg-[#35b6cf] border-[#35b6cf]' : 'border-slate-300'}`}>
                                                                                {selectedFilters['sexo']?.includes(opt) && <Check size={12} className="text-white" />}
                                                                            </div>
                                                                            {opt}
                                                                        </div>
                                                                    ))}
                                                                    {getUniqueValues('sexo').length === 0 && <p className="text-xs text-slate-400 italic">Nenhuma opção disponível</p>}
                                                                </div>
                                                            </div>

                                                            {/* Cargo Filter */}
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Cargo</div>
                                                                <div className="space-y-1">
                                                                    {getUniqueValues('cargo').map(opt => (
                                                                        <div
                                                                            key={opt}
                                                                            onClick={() => handleFilterSelect('cargo', opt)}
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedFilters['cargo']?.includes(opt) ? 'bg-[#35b6cf]/10 text-[#35b6cf] font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters['cargo']?.includes(opt) ? 'bg-[#35b6cf] border-[#35b6cf]' : 'border-slate-300'}`}>
                                                                                {selectedFilters['cargo']?.includes(opt) && <Check size={12} className="text-white" />}
                                                                            </div>
                                                                            {opt}
                                                                        </div>
                                                                    ))}
                                                                    {getUniqueValues('cargo').length === 0 && <p className="text-xs text-slate-400 italic">Nenhuma opção disponível</p>}
                                                                </div>
                                                            </div>

                                                            {/* Setor Filter */}
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Setor</div>
                                                                <div className="space-y-1">
                                                                    {getUniqueValues('setor').map(opt => (
                                                                        <div
                                                                            key={opt}
                                                                            onClick={() => handleFilterSelect('setor', opt)}
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedFilters['setor']?.includes(opt) ? 'bg-[#35b6cf]/10 text-[#35b6cf] font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters['setor']?.includes(opt) ? 'bg-[#35b6cf] border-[#35b6cf]' : 'border-slate-300'}`}>
                                                                                {selectedFilters['setor']?.includes(opt) && <Check size={12} className="text-white" />}
                                                                            </div>
                                                                            {opt}
                                                                        </div>
                                                                    ))}
                                                                    {getUniqueValues('setor').length === 0 && <p className="text-xs text-slate-400 italic">Nenhuma opção disponível</p>}
                                                                </div>
                                                            </div>

                                                        </div>
                                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                                            <button
                                                                onClick={() => setSelectedFilters({})}
                                                                className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                                                            >
                                                                Limpar Filtros
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl border border-slate-200 overflow-visible shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold relative z-10">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-xl">Nome</th>
                                                    <th className="px-4 py-3">Nascimento</th>
                                                    <th className="px-4 py-3 relative group">
                                                        Sexo
                                                    </th>
                                                    <th className="px-4 py-3 relative">
                                                        Cargo
                                                    </th>
                                                    <th className="px-4 py-3 relative">
                                                        Setor
                                                    </th>
                                                    <th className="px-4 py-3 rounded-tr-xl text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredCollaborators.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                                            Nenhum colaborador encontrado.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredCollaborators.map((colab, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                                            <td className="px-4 py-3 text-slate-800 font-medium flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs font-bold">
                                                                    {colab.nome.charAt(0).toUpperCase()}
                                                                </div>
                                                                {colab.nome}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500">{colab.dataNascimento ? new Date(colab.dataNascimento).toLocaleDateString('pt-BR') : '-'}</td>
                                                            <td className="px-4 py-3 text-slate-500">{colab.sexo || '-'}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                                                                    {colab.cargo}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500 text-xs">{colab.setor}</td>
                                                            <td className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-slate-50/80">
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={() => setActionMenuOpenIndex(actionMenuOpenIndex === idx ? null : idx)}
                                                                        className="p-1.5 text-slate-400 hover:text-[#35b6cf] hover:bg-slate-100 rounded-lg transition-colors"
                                                                    >
                                                                        <MoreVertical size={16} />
                                                                    </button>

                                                                    {actionMenuOpenIndex === idx && (
                                                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                                            <button
                                                                                onClick={() => openEditModal(colab, formData.colaboradores.indexOf(colab))}
                                                                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-[#35b6cf] flex items-center gap-2"
                                                                            >
                                                                                <Pencil size={14} /> Editar
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setDeleteConfirmationIndex(formData.colaboradores.indexOf(colab));
                                                                                    setActionMenuOpenIndex(null);
                                                                                }}
                                                                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-500 flex items-center gap-2"
                                                                            >
                                                                                <Trash2 size={14} /> Excluir
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Overlay to close menu when clicking outside - simplified version, ideally use a global listener */}
                                                                {actionMenuOpenIndex === idx && (
                                                                    <div
                                                                        className="fixed inset-0 z-40"
                                                                        onClick={() => setActionMenuOpenIndex(null)}
                                                                    />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Footer - Save/Cancel Actions */}
                    <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 z-10">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="primary"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        >
                            <Check size={18} className="mr-2" />
                            Salvar Alterações
                        </Button>
                    </div>
                </div>

            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmationIndex !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirmationIndex(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4 mx-auto">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Excluir Colaborador?</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">
                            Tem certeza que deseja remover este colaborador? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmationIndex(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteCollaborator}
                                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 shadow-lg shadow-rose-200 transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Collaborator Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Pencil size={18} className="text-[#35b6cf]" />
                                Editar Colaborador
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                                    <input
                                        type="text"
                                        name="nome"
                                        value={editCollaboratorForm.nome}
                                        onChange={handleEditCollaboratorChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editCollaboratorForm.email}
                                        onChange={handleEditCollaboratorChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nascimento</label>
                                        <input
                                            type="date"
                                            name="dataNascimento"
                                            value={editCollaboratorForm.dataNascimento}
                                            onChange={handleEditCollaboratorChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none text-slate-600"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Sexo</label>
                                        <select
                                            name="sexo"
                                            value={editCollaboratorForm.sexo}
                                            onChange={handleEditCollaboratorChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600"
                                        >
                                            <option value="" disabled>Selecione</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Feminino">Feminino</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                                    <input
                                        type="tel"
                                        name="telefone"
                                        value={editCollaboratorForm.telefone}
                                        onChange={handleEditCollaboratorChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Setor</label>
                                        <select
                                            name="setor"
                                            value={editCollaboratorForm.setor}
                                            onChange={handleEditCollaboratorChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600"
                                        >
                                            <option value="" disabled>Selecione</option>
                                            {formData.setores.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cargo</label>
                                        <select
                                            name="cargo"
                                            value={editCollaboratorForm.cargo}
                                            onChange={handleEditCollaboratorChange}
                                            disabled={!editCollaboratorForm.setor}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#35b6cf] outline-none bg-white text-slate-600 disabled:bg-slate-100"
                                        >
                                            <option value="" disabled>Selecione</option>
                                            {formData.cargos
                                                .filter(c => c.setor === editCollaboratorForm.setor)
                                                .map((c, i) => <option key={i} value={c.nome}>{c.nome}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                            <Button onClick={saveEditCollaborator} className="bg-[#35b6cf] text-white hover:bg-[#2ca3bc]">Salvar Alterações</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


