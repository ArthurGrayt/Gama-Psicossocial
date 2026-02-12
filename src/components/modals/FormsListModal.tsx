import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { X, FileText, Plus, Building, Users, Calendar, BarChart2, Copy, ExternalLink, Pencil, Trash2, Check } from 'lucide-react';

interface Company {
    id: number;
    name: string;
    cnpj: string;
    cliente_uuid?: string;
    units?: any[];
    total_units?: number;
    total_collaborators?: number;
}

interface Form {
    id: number;
    title: string;
    description: string;
    unidade_id: number;
    created_at: string;
    qtd_respostas: number;
    slug?: string;
    link?: string;
    unidades?: {
        nome: string;
        setores?: number[];
    };
    unidade_nome?: string;
}

interface FormsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    company: Company | null;
    onCreateNew: () => void;
}

export const FormsListModal: React.FC<FormsListModalProps> = ({
    isOpen,
    onClose,
    company,
    onCreateNew
}) => {
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(false);

    // Actions State
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [editingForm, setEditingForm] = useState<Form | null>(null);
    const [editFormTitle, setEditFormTitle] = useState('');
    const [editFormDesc, setEditFormDesc] = useState('');

    useEffect(() => {
        const fetchForms = async () => {
            if (!company || !isOpen) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('forms')
                    .select(`
                        *,
                        unidades!inner (
                            id,
                            nome,
                            empresa_mae
                        )
                    `)
                    .eq('unidades.empresa_mae', company.cliente_uuid);

                if (error) throw error;

                const mappedForms = data?.map(f => ({
                    ...f,
                    unidade_nome: f.unidades?.nome
                })) || [];

                setForms(mappedForms);

            } catch (err) {
                console.error('Error fetching forms:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchForms();
    }, [company, isOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdownId && !(event.target as Element).closest('.dropdown-tork')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);


    const handleDeleteForm = async (id: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.')) return;

        try {
            const { error } = await supabase.from('forms').delete().eq('id', id);
            if (error) throw error;

            setForms(prev => prev.filter(f => f.id !== id));
            setOpenDropdownId(null);
        } catch (err) {
            console.error('Error deleting form:', err);
            alert('Erro ao excluir formulário.');
        }
    };

    const handleOpenEdit = (form: Form) => {
        setEditingForm(form);
        setEditFormTitle(form.title);
        setEditFormDesc(form.description || '');
        setOpenDropdownId(null);
    };

    const handleSaveEdit = async () => {
        if (!editingForm) return;

        try {
            const { error } = await supabase
                .from('forms')
                .update({
                    title: editFormTitle,
                    description: editFormDesc
                })
                .eq('id', editingForm.id);

            if (error) throw error;

            setForms(prev => prev.map(f => f.id === editingForm.id ? { ...f, title: editFormTitle, description: editFormDesc } : f));
            setEditingForm(null);
        } catch (err) {
            console.error('Error updating form:', err);
            alert('Erro ao atualizar formulário.');
        }
    };

    if (!isOpen || !company) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Main Modal */}
            <div className={`bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] ${editingForm ? 'brightness-50 pointer-events-none' : ''}`}>

                {/* Header */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Formulários Gerados</h2>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <Building size={14} className="text-[#35b6cf]" />
                            <span>{company.name}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 bg-slate-50/50 flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-[#35b6cf] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-400 text-sm">Carregando formulários...</p>
                        </div>
                    ) : forms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <FileText size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Nenhum formulário encontrado</h3>
                            <p className="text-slate-500 text-sm mt-1 max-w-xs">
                                Esta empresa ainda não possui formulários gerados.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {forms.map(form => (
                                <div key={form.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    {/* Header Row: Icon | Unit - Sector | Action */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#f0f9fa] rounded-xl flex items-center justify-center text-[#35b6cf]">
                                                <Building size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 text-sm">{form.unidade_nome}</span>
                                                    <span className="text-slate-300">·</span>
                                                    <span className="text-slate-500 text-sm">Geral</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    // Extract slug from stored link or use slug property if available
                                                    const slugInfo = form.slug || form.link?.split('/').filter(Boolean).pop() || '';
                                                    const url = `${window.location.origin}/form/${slugInfo}`;
                                                    window.open(url, '_blank');
                                                }}
                                                className="text-slate-300 hover:text-[#35b6cf] transition-colors p-1"
                                                title="Abrir Formulário"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const slugInfo = form.slug || form.link?.split('/').filter(Boolean).pop() || '';
                                                    const url = `${window.location.origin}/form/${slugInfo}`;
                                                    navigator.clipboard.writeText(url);
                                                    // Could add a toast here
                                                }}
                                                className="text-slate-300 hover:text-[#35b6cf] transition-colors p-1"
                                                title="Copiar Link"
                                            >
                                                <Copy size={18} />
                                            </button>

                                            {/* Edit/Delete Dropdown Trigger */}
                                            <div className="relative dropdown-tork">
                                                <button
                                                    onClick={() => setOpenDropdownId(openDropdownId === form.id ? null : form.id)}
                                                    className={`p-1 transition-colors ${openDropdownId === form.id ? 'text-[#35b6cf] bg-slate-50 rounded' : 'text-slate-300 hover:text-[#35b6cf]'}`}
                                                    title="Opções"
                                                >
                                                    <Pencil size={18} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {openDropdownId === form.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-200">
                                                        <button
                                                            onClick={() => handleOpenEdit(form)}
                                                            className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-[#35b6cf] flex items-center gap-2"
                                                        >
                                                            <Pencil size={14} />
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteForm(form.id)}
                                                            className="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} />
                                                            Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title Row */}
                                    <h3 className="text-slate-600 font-medium text-base mb-6 pl-[52px]">
                                        {form.title}
                                    </h3>

                                    {/* Footer Metrics Row */}
                                    <div className="flex items-center gap-6 pl-[52px] text-xs text-slate-400 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={14} />
                                            {/* Placeholder count until backend join is added */}
                                            <span>14 colaboradores</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <BarChart2 size={14} />
                                            <span>{form.qtd_respostas || 0} respostas</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            <span>{new Date(form.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-slate-50 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={onCreateNew}
                        className="px-6 py-2.5 bg-[#35b6cf] text-white font-bold text-sm rounded-xl hover:bg-[#2ca3bc] transition-all shadow-lg shadow-[#35b6cf]/20 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Novo Formulário
                    </button>
                </div>
            </div>

            {/* Edit Modal (Nested Overlay) */}
            {editingForm && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Editar Formulário</h3>
                            <button onClick={() => setEditingForm(null)} className="p-1 hover:bg-slate-50 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                                <input
                                    type="text"
                                    value={editFormTitle}
                                    onChange={e => setEditFormTitle(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#35b6cf] text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                                <textarea
                                    value={editFormDesc}
                                    onChange={e => setEditFormDesc(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#35b6cf] text-sm font-medium resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditingForm(null)}
                                className="px-4 py-2 text-slate-500 text-xs font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-[#35b6cf] text-white text-xs font-bold rounded-lg hover:bg-[#2ca3bc] transition-colors shadow-lg shadow-[#35b6cf]/20 flex items-center gap-2"
                            >
                                <Check size={14} />
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
