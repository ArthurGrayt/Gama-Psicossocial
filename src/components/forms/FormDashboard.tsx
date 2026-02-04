import React, { useState } from 'react';
import { Building, Search, Filter, Trash2, Users, FileText, ChevronRight, Edit, X, Save, LayoutGrid, List, LayoutTemplate } from 'lucide-react';

interface FormDashboardProps {
    onCreateForm: (initialData?: any) => void;
    // We'll keep these for now but they might need renaming or logic change later
    onEditForm: (company: any) => void;
    onAnalyzeForm: (company: any) => void;
}

// RICH MOCK DATA FOR COMPANIES (Synced with FormEditor logic)
const MOCK_COMPANIES = [
    {
        id: 1,
        name: 'Gama Center',
        cnpj: '12.345.678/0001-90',
        total_collaborators: 150,
        units: [
            { id: 101, name: 'Matriz', collaborators: 45, sectors: ['TI', 'RH', 'Financeiro', 'Administrativo'] },
            { id: 102, name: 'Filial SP', collaborators: 15, sectors: [] },
            { id: 103, name: 'Filial RJ', collaborators: 90, sectors: ['Operacional', 'Vendas', 'Logística'] }
        ],
        roles: ['Desenvolvedor', 'Gerente de Projetos', 'Analista de RH', 'Assistente Administrativo', 'Diretor']
    },
    {
        id: 2,
        name: 'Tech Solutions',
        cnpj: '98.765.432/0001-10',
        total_collaborators: 50,
        units: [
            { id: 201, name: 'Escritório Central', collaborators: 50, sectors: ['Dev', 'Product', 'Sales'] }
        ],
        roles: ['Frontend Developer', 'Backend Developer', 'Product Manager', 'Sales Representative']
    },
    {
        id: 3,
        name: 'Indústria Metalflex',
        cnpj: '45.123.789/0001-44',
        total_collaborators: 1200,
        units: [
            { id: 301, name: 'Planta Industrial A', collaborators: 800, sectors: ['Produção', 'Manutenção', 'PCP', 'Qualidade'] },
            { id: 302, name: 'Logística Regional', collaborators: 400, sectors: ['Armazém', 'Frota', 'Expedição'] }
        ],
        roles: ['Operador de Máquinas', 'Supervisor de Produção', 'Técnico de Manutenção', 'Motorista', 'Analista de Logística']
    }
];

// Mock Collaborator Generator
const generateMockCollaborators = (company: any) => {
    const count = Math.min(company.total_collaborators, 50); // Limit usage for demo
    const collaborators = [];
    const sectors = Array.from(new Set(company.units.flatMap((u: any) => u.sectors)));
    const roles = company.roles || ['Funcionário'];

    for (let i = 0; i < count; i++) {
        collaborators.push({
            id: i + 1,
            name: `Colaborador ${i + 1}`,
            email: `colaborador${i + 1}@${company.name.toLowerCase().replace(/\s/g, '')}.com`,
            role: roles[Math.floor(Math.random() * roles.length)],
            sector: sectors.length > 0 ? sectors[Math.floor(Math.random() * sectors.length)] : 'Geral',
            unit: company.units[0].name // Simplified
        });
    }
    return collaborators;
};

// --- SUB-COMPONENTS FOR MODAL REFRACTOR ---

interface CompanySummaryProps {
    company: any;
    isEditing: boolean;
    editName: string;
    editCnpj: string;
    setEditName: (val: string) => void;
    setEditCnpj: (val: string) => void;
    showCollaborators: boolean;
    onToggleCollaborators: () => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSave: () => void;
    onDelete: () => void;
    selectedUnit: any;
    setSelectedUnit: (unit: any) => void;
}

const CompanySummary: React.FC<CompanySummaryProps> = ({
    company, isEditing, editName, editCnpj,
    setEditName, setEditCnpj, showCollaborators,
    onToggleCollaborators, onStartEdit, onCancelEdit, onSave, onDelete,
    selectedUnit, setSelectedUnit
}) => {
    const [showAllSectors, setShowAllSectors] = useState(false);
    const [showAllRoles, setShowAllRoles] = useState(false);

    // Reset state when company changes
    React.useEffect(() => {
        setShowAllSectors(false);
        setShowAllRoles(false);
    }, [company]);

    const allSectors = Array.from(new Set(company.units.flatMap((u: any) => u.sectors)));
    const allRoles = company.roles || [];

    const displayedSectors = showAllSectors ? allSectors : allSectors.slice(0, 5);
    const displayedRoles = showAllRoles ? allRoles : allRoles.slice(0, 3);

    // Left Sidebar Content
    return (
        <div className={`space-y-4 flex-1 h-full overflow-y-auto custom-scrollbar z-10 w-full`}>
            {!isEditing ? (
                <div className="flex flex-col h-full">
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-4 flex-1">
                        {/* Header Row: CNPJ and Unit Dropdown */}
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CNPJ</span>
                                <p className="text-sm font-medium text-slate-700">{company.cnpj}</p>
                            </div>
                            {!isEditing && company.units && company.units.length > 0 && (
                                <div className="relative">
                                    <select
                                        value={selectedUnit?.id || ''}
                                        onChange={(e) => {
                                            const unit = company.units.find((u: any) => u.id === Number(e.target.value));
                                            setSelectedUnit(unit);
                                        }}
                                        className="appearance-none pl-2 pr-8 py-1 bg-transparent rounded-lg text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-200/50 transition-colors text-right"
                                    >
                                        {company.units.map((unit: any) => (
                                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={14} />
                                </div>
                            )}
                        </div>

                        {/* Collaborators Row */}
                        <div className="flex items-center justify-between py-2 border-y border-slate-100">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Colaboradores</span>
                                <p className="font-bold text-slate-700 text-base">{company.total_collaborators}</p>
                            </div>
                            <button
                                onClick={onToggleCollaborators}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${showCollaborators
                                    ? 'bg-[#35b6cf] text-white shadow-sm'
                                    : 'text-[#35b6cf] hover:bg-[#35b6cf]/10 bg-transparent'
                                    }`}
                            >
                                {showCollaborators ? 'Ocultar' : 'Gerenciar'}
                                <ChevronRight
                                    size={14}
                                    className={`transition-transform duration-300 ${showCollaborators ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>

                        <div className="pt-2 mt-2">
                            <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Setores ({allSectors.length})</span>
                            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                {allSectors.length > 0 ? (
                                    <>
                                        {displayedSectors.map((sector: any, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
                                                {sector}
                                            </span>
                                        ))}
                                        {!showAllSectors && allSectors.length > 5 && (
                                            <button
                                                onClick={() => setShowAllSectors(true)}
                                                className="px-2.5 py-1 bg-[#35b6cf]/10 text-[#35b6cf] rounded-lg text-xs font-bold border border-[#35b6cf]/20 hover:bg-[#35b6cf]/20 transition-colors"
                                            >
                                                Ver mais
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-sm text-slate-400 italic">Nenhum setor cadastrado.</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Cargos ({allRoles.length})</span>
                            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                {allRoles.length > 0 ? (
                                    <>
                                        {displayedRoles.map((role: string, idx: number) => (
                                            <span key={idx} className="px-2.5 py-1 bg-[#35b6cf]/10 text-[#35b6cf] rounded-lg text-xs font-medium border border-[#35b6cf]/20">
                                                {role}
                                            </span>
                                        ))}
                                        {!showAllRoles && allRoles.length > 3 && (
                                            <button
                                                onClick={() => setShowAllRoles(true)}
                                                className="px-2.5 py-1 bg-[#35b6cf]/10 text-[#35b6cf] rounded-lg text-xs font-bold border border-[#35b6cf]/20 hover:bg-[#35b6cf]/20 transition-colors"
                                            >
                                                Ver mais
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-sm text-slate-400 italic">Nenhum cargo cadastrado.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 py-4 border-t border-slate-50 mt-4">
                        <button
                            onClick={onStartEdit}
                            className="flex-1 bg-[#35b6cf] text-white h-[42px] rounded-xl font-bold hover:bg-[#2ca1b7] transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            <Edit size={16} />
                            Editar Dados
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex-1 bg-transparent text-red-500 h-[42px] rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Trash2 size={16} />
                            Excluir Empresa
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#35b6cf]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">CNPJ</label>
                            <input
                                type="text"
                                value={editCnpj}
                                onChange={(e) => setEditCnpj(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#35b6cf]"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Colaboradores (Visualização)</label>
                            <div className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 flex justify-between items-center cursor-not-allowed">
                                <span>{company.total_collaborators}</span>
                                <Users size={16} />
                            </div>
                            <p className="text-[10px] text-slate-400">Para gerenciar colaboradores, saia do modo de edição.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onCancelEdit}
                            className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onSave}
                            className="flex-1 bg-[#35b6cf] text-white py-3 rounded-xl font-bold hover:bg-[#2ca1b7] transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Salvar Alterações
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

interface EmployeeManagementProps {
    collaborators: any[];
    company: any; // for filtering context if needed
    onDeleteCollaborator: (id: number) => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ collaborators, company, onDeleteCollaborator }) => {
    // Internal state for truly independent filtering to the panel
    const [searchTerm, setSearchTerm] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const filtered = collaborators.filter(c =>
        (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (sectorFilter ? c.sector === sectorFilter : true) &&
        (roleFilter ? c.role === roleFilter : true)
    );

    const sectors = Array.from(new Set(company.units.flatMap((u: any) => u.sectors)));
    const roles = Array.from(new Set(collaborators.map((c: any) => c.role)));

    return (
        <div className="p-8 flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-slate-700">Gerenciar Colaboradores</h3>
                    <p className="text-xs text-slate-400">{filtered.length} colaboradores encontrados</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                <div className="relative col-span-12 md:col-span-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#35b6cf]"
                    />
                </div>
                <div className="col-span-12 md:col-span-3">
                    <select
                        value={sectorFilter}
                        onChange={(e) => setSectorFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#35b6cf]"
                    >
                        <option value="">Todos os Setores</option>
                        {sectors.map((sector: any) => (
                            <option key={sector} value={sector}>{sector}</option>
                        ))}
                    </select>
                </div>
                <div className="col-span-12 md:col-span-3">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#35b6cf]"
                    >
                        <option value="">Todos os Cargos</option>
                        {roles.map((role: any) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 border-b border-slate-100">Nome</th>
                                <th className="px-4 py-3 border-b border-slate-100">Cargo</th>
                                <th className="px-4 py-3 border-b border-slate-100">Setor</th>
                                <th className="px-4 py-3 border-b border-slate-100 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map(person => (
                                <tr key={person.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-700">{person.name}</p>
                                        <p className="text-xs text-slate-400">{person.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-slate-600">{person.role}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-[10px] px-2 py-1 bg-slate-100 rounded-md w-fit text-slate-500 font-medium border border-slate-200">{person.sector}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => onDeleteCollaborator(person.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <Users size={24} className="mb-2 opacity-50" />
                            <p className="text-sm">Nenhum colaborador encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const FormDashboard: React.FC<FormDashboardProps> = ({ onCreateForm, onEditForm, onAnalyzeForm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Selection Modal State
    const [selectingFor, setSelectingFor] = useState<any>(null);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [selectionStep, setSelectionStep] = useState<'unit' | 'sector'>('unit');

    // Info Modal State
    const [infoModalCompany, setInfoModalCompany] = useState<any>(null);
    const [selectedModalUnit, setSelectedModalUnit] = useState<any>(null);
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    // Temporary state for editing fields
    const [editName, setEditName] = useState('');
    const [editCnpj, setEditCnpj] = useState('');

    // Collaborator Management State
    const [showCollaborators, setShowCollaborators] = useState(false);
    const [mockCollaborators, setMockCollaborators] = useState<any[]>([]);

    const filteredCompanies = MOCK_COMPANIES.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.includes(searchTerm)
    );

    const handleGerarFormulario = (company: any) => {
        // Reset selection state
        setSelectingFor(company);
        setSelectedUnit(null);

        // Rules:
        // 1. If company has more than 1 unit, ask for unit
        if (company.units.length > 1) {
            setSelectionStep('unit');
        } else {
            // Only 1 unit, auto-select it
            const unit = company.units[0];
            setSelectedUnit(unit);

            // 2. If this unit has > 20 collaborators, ask for sector
            if (unit.collaborators > 20 && unit.sectors.length > 0) {
                setSelectionStep('sector');
            } else {
                // Done! Direct to creation
                handleFinishSelection(company, unit, '');
            }
        }
    };

    const handleUnitSelect = (unit: any) => {
        setSelectedUnit(unit);
        if (unit.collaborators > 20 && unit.sectors.length > 0) {
            setSelectionStep('sector');
        } else {
            handleFinishSelection(selectingFor, unit, '');
        }
    };

    const handleFinishSelection = (company: any, unit: any, sector: string) => {
        onCreateForm({
            company_id: company.id,
            company_name: company.name,
            unit_id: unit.id,
            unit_name: unit.name,
            sector: sector
        });
        setSelectingFor(null);
    };

    const openInfoModal = (e: React.MouseEvent, company: any, initialShowCollaborators = false) => {
        e.stopPropagation(); // Prevent card navigation
        setInfoModalCompany(company);
        setSelectedModalUnit(company.units.length > 0 ? company.units[0] : null);
        setEditName(company.name);
        setEditCnpj(company.cnpj);

        // Init mock collaborators
        setMockCollaborators(generateMockCollaborators(company));
        setShowCollaborators(initialShowCollaborators); // Start with requested view
        setIsEditingInfo(false);
    };

    // Mock Save
    const handleSaveInfo = () => {
        // Here you would call an API/Update prop
        console.log("Saving info", { id: infoModalCompany.id, editName, editCnpj });
        // Close modal
        setInfoModalCompany(null);
    };

    // Mock Delete
    const handleDeleteCompany = () => {
        if (window.confirm("Tem certeza que deseja excluir esta empresa?")) {
            console.log("Deleting company", infoModalCompany.id);
            setInfoModalCompany(null);
        }
    };

    const handleDeleteCollaborator = (id: number) => {
        if (window.confirm("Remover este colaborador?")) {
            setMockCollaborators(prev => prev.filter(c => c.id !== id));
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Empresas Monitoradas</h2>
                    <p className="text-slate-500 mt-1">Gerencie formulários e levantamentos</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar empresa ou CNPJ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-slate-50 rounded-lg transition-all" title="Filtros">
                            <Filter size={18} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-[#35b6cf]' : 'text-slate-400 hover:text-[#35b6cf]'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-[#35b6cf]' : 'text-slate-400 hover:text-[#35b6cf]'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid vs List Content */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCompanies.map((company) => (
                        <div
                            key={company.id}
                            onClick={() => onAnalyzeForm(company)} // Navigate to details on click
                            className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#35b6cf]/10 hover:border-[#35b6cf]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer relative"
                        >

                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-[#35b6cf]/10 text-[#35b6cf] rounded-xl group-hover:bg-[#35b6cf] group-hover:text-white transition-colors duration-300 shadow-sm">
                                        <Building size={24} />
                                    </div>
                                    <div className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-100">
                                        {company.units.length} {company.units.length === 1 ? 'Unidade' : 'Unidades'}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#35b6cf] transition-colors mb-2">
                                    {company.name}
                                </h3>

                                <div className="space-y-3 mt-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <FileText size={16} className="text-slate-300" />
                                        <span>CNPJ: <span className="font-medium text-slate-700">{company.cnpj}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Users size={16} className="text-slate-300" />
                                        <span>Colaboradores: <span className="font-medium text-slate-700">{company.total_collaborators}</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between mt-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent card navigation
                                        handleGerarFormulario(company);
                                    }}
                                    className="text-sm font-bold text-[#35b6cf] hover:text-[#0f978e] transition-colors flex items-center gap-1"
                                >
                                    <FileText size={14} />
                                    Gerar Formulário
                                    <ChevronRight size={14} />
                                </button>
                                <div className="flex items-center gap-x-1">
                                    <button
                                        onClick={(e) => openInfoModal(e, company, false)}
                                        className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-white rounded-lg transition-all"
                                        title="Avaliar Colaboradores"
                                    >
                                        <Users size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CNPJ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Unidades</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Colaboradores</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[#35b6cf]/10 text-[#35b6cf] rounded-lg">
                                                    <Building size={16} />
                                                </div>
                                                <span className="font-bold text-slate-800 group-hover:text-[#35b6cf] transition-colors">{company.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                            {company.cnpj}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center">
                                            <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100">
                                                {company.units.length}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center text-slate-600 font-medium">
                                            {company.total_collaborators}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleGerarFormulario(company)}
                                                    className="px-3 py-1.5 bg-[#35b6cf]/10 text-[#35b6cf] hover:bg-[#35b6cf] hover:text-white rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Gerar Formulário
                                                </button>
                                                <button
                                                    onClick={() => onEditForm(company)}
                                                    className="p-1.5 text-slate-400 hover:text-[#35b6cf] transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onAnalyzeForm(company)}
                                                    className="p-1.5 text-slate-400 hover:text-[#35b6cf] transition-colors"
                                                    title="Levantamentos"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredCompanies.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Building size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Nenhuma empresa encontrada</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs text-center">Tente ajustar sua busca ou verifique se há filtros ativos.</p>
                </div>
            )}

            {/* Selection Modal Overlay */}
            {selectingFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Gerar Formulário</h2>
                                <p className="text-sm text-slate-500 mt-1">{selectingFor.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectingFor(null)}
                                className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {selectionStep === 'unit' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#35b6cf]/10 flex items-center justify-center text-[#35b6cf]">
                                            <Building size={16} />
                                        </div>
                                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Escolha a Unidade</label>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectingFor.units.map((unit: any) => (
                                            <button
                                                key={unit.id}
                                                onClick={() => handleUnitSelect(unit)}
                                                className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-[#35b6cf] hover:bg-[#35b6cf]/5 transition-all text-left group"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-700 group-hover:text-[#35b6cf] transition-colors">{unit.name}</span>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                        <Users size={12} />
                                                        {unit.collaborators} colaboradores
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-slate-300 group-hover:text-[#35b6cf] transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#0f978e]/10 flex items-center justify-center text-[#0f978e]">
                                            <LayoutTemplate size={16} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Escolha o Setor</label>
                                            <p className="text-xs text-slate-400">Unidade: {selectedUnit?.name}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedUnit?.sectors.map((sector: string) => (
                                            <button
                                                key={sector}
                                                onClick={() => handleFinishSelection(selectingFor, selectedUnit, sector)}
                                                className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-[#0f978e] hover:bg-[#0f978e]/5 transition-all text-left group"
                                            >
                                                <span className="font-bold text-slate-700 group-hover:text-[#0f978e] transition-colors">{sector}</span>
                                                <ChevronRight size={18} className="text-slate-300 group-hover:text-[#0f978e] transition-all" />
                                            </button>
                                        ))}
                                        {/* Option for 'All Sectors' or just general */}
                                        <button
                                            onClick={() => handleFinishSelection(selectingFor, selectedUnit, 'Geral')}
                                            className="flex items-center justify-between p-4 rounded-2xl border border-dotted border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-left group italic"
                                        >
                                            <span className="font-medium text-slate-500">Geral / Todos os setores</span>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-all" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setSelectionStep('unit')}
                                        className="w-full mt-4 py-3 text-slate-400 text-sm font-medium hover:text-[#35b6cf] transition-colors"
                                    >
                                        ← Voltar para unidades
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* INFO MODAL */}
            {infoModalCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div
                        className={`bg-white rounded-[32px] p-8 shadow-2xl transform transition-all duration-500 ease-in-out flex flex-col max-h-[90vh] ${showCollaborators ? 'w-full max-w-[1400px]' : 'w-full max-w-2xl'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#35b6cf]/10 text-[#35b6cf] rounded-2xl">
                                    <Building size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                                        {isEditingInfo ? 'Editar Dados' : infoModalCompany.name}
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium">
                                        {infoModalCompany.units.length} {infoModalCompany.units.length === 1 ? 'Unidade cadastrada' : 'Unidades cadastradas'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setInfoModalCompany(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Body with smooth transitions */}
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
                            {/* Left Panel: Details */}
                            <CompanySummary
                                company={infoModalCompany}
                                isEditing={isEditingInfo}
                                editName={editName}
                                editCnpj={editCnpj}
                                setEditName={setEditName}
                                setEditCnpj={setEditCnpj}
                                showCollaborators={showCollaborators}
                                onToggleCollaborators={() => setShowCollaborators(!showCollaborators)}
                                onStartEdit={() => setIsEditingInfo(true)}
                                onCancelEdit={() => setIsEditingInfo(false)}
                                onSave={handleSaveInfo}
                                onDelete={handleDeleteCompany}
                                selectedUnit={selectedModalUnit}
                                setSelectedUnit={setSelectedModalUnit}
                            />

                            {/* Right Panel: Employee Management */}
                            <div
                                className={`transition-all duration-500 ease-in-out overflow-hidden ${showCollaborators ? 'flex-[1.5] w-full border-l border-slate-100 opacity-100 scale-100' : 'w-0 opacity-0 scale-95 border-none'
                                    }`}
                            >
                                <EmployeeManagement
                                    collaborators={mockCollaborators}
                                    company={infoModalCompany}
                                    onDeleteCollaborator={handleDeleteCollaborator}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
