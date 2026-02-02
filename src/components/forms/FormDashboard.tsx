import React, { useState } from 'react';
import { Building, Search, Filter, Trash2, Users, FileText, ChevronRight, Edit, X, LayoutTemplate, LayoutGrid, List } from 'lucide-react';

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
        ]
    },
    {
        id: 2,
        name: 'Tech Solutions',
        cnpj: '98.765.432/0001-10',
        total_collaborators: 50,
        units: [
            { id: 201, name: 'Escritório Central', collaborators: 50, sectors: ['Dev', 'Product', 'Sales'] }
        ]
    },
    {
        id: 3,
        name: 'Indústria Metalflex',
        cnpj: '45.123.789/0001-44',
        total_collaborators: 1200,
        units: [
            { id: 301, name: 'Planta Industrial A', collaborators: 800, sectors: ['Produção', 'Manutenção', 'PCP', 'Qualidade'] },
            { id: 302, name: 'Logística Regional', collaborators: 400, sectors: ['Armazém', 'Frota', 'Expedição'] }
        ]
    }
];

export const FormDashboard: React.FC<FormDashboardProps> = ({ onCreateForm, onEditForm, onAnalyzeForm }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Selection Modal State
    const [selectingFor, setSelectingFor] = useState<any>(null);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);
    const [selectionStep, setSelectionStep] = useState<'unit' | 'sector'>('unit');

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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar empresas por nome ou CNPJ..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-600 placeholder:text-slate-400 focus:ring-0 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#35b6cf] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#35b6cf] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={20} />
                        </button>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                        <Filter className="w-5 h-5 text-slate-400" />
                        Filtrar
                    </button>
                </div>
            </div>

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

            {/* Grid vs List Content */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCompanies.map((company) => (
                        <div key={company.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#35b6cf]/10 hover:border-[#35b6cf]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">

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
                                    onClick={() => handleGerarFormulario(company)}
                                    className="text-sm font-bold text-[#35b6cf] hover:text-[#0f978e] transition-colors flex items-center gap-1"
                                >
                                    Gerar Formulário
                                    <ChevronRight size={14} />
                                </button>
                                <div className="flex items-center gap-x-1">
                                    <button
                                        onClick={() => onEditForm(company)}
                                        className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-white rounded-lg transition-all"
                                        title="Editar Empresa"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => onAnalyzeForm(company)}
                                        className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-white rounded-lg transition-all"
                                        title="Visualizar Levantamentos"
                                    >
                                        <FileText size={18} />
                                    </button>
                                    <button className="p-2 text-slate-300 hover:text-red-400 hover:bg-white rounded-lg transition-all" title="Excluir Empresa">
                                        <Trash2 size={18} />
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
        </div>
    );
};
