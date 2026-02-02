import React, { useState } from 'react';
import { Plus, FileText, Search, BarChart2, Edit, ExternalLink, Calendar, Users, Filter, Trash2 } from 'lucide-react';
import type { Form } from '../../types';

interface FormDashboardProps {
    onCreateForm: () => void;
    onEditForm: (form: Form) => void;
    onAnalyzeForm: (form: Form) => void;
}

// MOCK DATA FOR UI DEVELOPMENT
const MOCK_FORMS: any[] = [
    {
        id: 1,
        title: 'Levantamento de Riscos Psicossociais',
        description: 'Avaliação completa conforme NR-01 e NR-17 para identificar fatores de risco no ambiente de trabalho administrativo e operacional.',
        created_at: '2023-10-15T10:00:00Z',
        qtd_respostas: 124,
        slug: 'r-psicossocial-2023',
        status: 'active'
    },
    {
        id: 2,
        title: 'Pesquisa de Clima Organizacional 2024',
        description: 'Questionário anual para medir o engajamento e satisfação dos colaboradores em todas as unidades.',
        created_at: '2024-01-20T14:30:00Z',
        qtd_respostas: 45,
        slug: 'clima-2024',
        status: 'draft'
    },
    {
        id: 3,
        title: 'Avaliação de Burnout (MBI)',
        description: 'Instrumento específico para detecção de sinais de esgotamento profissional em equipes de alta performance.',
        created_at: '2024-02-05T09:15:00Z',
        qtd_respostas: 12,
        slug: 'burnout-q1',
        status: 'active'
    },
    {
        id: 4,
        title: 'Feedback de Treinamento - Liderança',
        description: 'Coleta de feedback pós-treinamento de liderança realizado em Janeiro.',
        created_at: '2024-01-28T16:45:00Z',
        qtd_respostas: 89,
        slug: 'feedback-lideranca',
        status: 'closed'
    },
    {
        id: 5,
        title: 'Diagnóstico de Estresse Ocupacional',
        description: 'Mapeamento de estressores.',
        created_at: '2024-02-10T11:00:00Z',
        qtd_respostas: 0,
        slug: 'estresse-oc',
        status: 'draft'
    }
];

export const FormDashboard: React.FC<FormDashboardProps> = ({ onCreateForm, onEditForm, onAnalyzeForm }) => {
    // const [forms, setForms] = useState<Form[]>([]); // Switched to Mock
    const [searchTerm, setSearchTerm] = useState('');

    const filteredForms = MOCK_FORMS.filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'draft': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'closed': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Ativo';
            case 'draft': return 'Rascunho';
            case 'closed': return 'Encerrado';
            default: return status;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions MATCHING SCREENSHOT */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar formulários..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-600 placeholder:text-slate-400 focus:ring-0 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                        <Filter className="w-5 h-5 text-slate-400" />
                        Filtrar
                    </button>
                    <button
                        onClick={onCreateForm}
                        className="flex items-center gap-2 bg-[#0f978e] hover:bg-[#0d857d] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-emerald-100 active:scale-95"
                    >
                        <Plus size={20} />
                        Novo Formulário
                    </button>
                </div>
            </div>

            {/* Grid Layout (Restored & Updated) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredForms.map((form) => (
                    <div key={form.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#35b6cf]/10 hover:border-[#35b6cf]/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">

                        {/* Card Body */}
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-[#35b6cf]/10 text-[#35b6cf] rounded-xl group-hover:bg-[#35b6cf] group-hover:text-white transition-colors duration-300 shadow-sm">
                                    <FileText size={24} />
                                </div>
                                <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(form.status)}`}>
                                    {getStatusLabel(form.status)}
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1 group-hover:text-[#35b6cf] transition-colors cursor-pointer" onClick={() => onAnalyzeForm(form as unknown as Form)}>
                                {form.title}
                            </h3>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
                                {form.description || 'Sem descrição disponível para este formulário.'}
                            </p>

                            <div className="flex items-center gap-4 text-xs font-medium text-slate-400 border-t border-slate-50 pt-4 mt-auto">
                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                    <Calendar size={14} />
                                    {formatDate(form.created_at)}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                    <Users size={14} />
                                    {form.qtd_respostas || 0} respostas
                                </span>
                            </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="px-2 pb-2">
                            <div className="bg-slate-50/50 p-2 rounded-xl flex items-center gap-1">
                                <button
                                    onClick={() => onAnalyzeForm(form as unknown as Form)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-800 hover:bg-[#35b6cf] py-2.5 rounded-lg transition-all shadow-sm active:scale-95"
                                >
                                    <BarChart2 size={16} />
                                    Ver Resultados
                                </button>

                                <div className="flex gap-1 ml-1">
                                    <button className="p-2.5 text-slate-400 hover:text-[#35b6cf] hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Link Público">
                                        <ExternalLink size={18} />
                                    </button>
                                    <button onClick={() => onEditForm(form as unknown as Form)} className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Editar">
                                        <Edit size={18} />
                                    </button>
                                    <button className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Excluir">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {filteredForms.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Nenhum formulário encontrado</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-xs text-center">Tente ajustar sua busca ou crie um novo formulário para começar.</p>
                        <button onClick={onCreateForm} className="mt-6 text-[#35b6cf] font-medium hover:underline flex items-center gap-2">
                            <Plus size={16} />
                            Criar novo formulário
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
