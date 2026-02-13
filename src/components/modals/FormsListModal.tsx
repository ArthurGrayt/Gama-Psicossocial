import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../../services/supabase';
import { X, FileText, Plus, Calendar, BarChart2, Copy, ExternalLink, Pencil, Trash2, Check, MoreVertical } from 'lucide-react';

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

    const handleUpdateForm = async (formId: number) => {
        if (!editingForm || editingForm.id !== formId) return;

        try {
            const { error } = await supabase
                .from('forms')
                .update({ title: editFormTitle })
                .eq('id', formId);

            if (error) throw error;

            setForms(prev => prev.map(f => f.id === formId ? { ...f, title: editFormTitle } : f));
            setEditingForm(null);
        } catch (err) {
            console.error('Error updating form title:', err);
            alert('Erro ao atualizar o título do formulário.');
        }
    };

    // --- RENDER ---
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Gerenciar Formulários</h2>
                            <p className="text-slate-500 text-sm">
                                {company ? (
                                    <>Formulários de <strong className="text-slate-700">{company.name}</strong></>
                                ) : (
                                    'Selecione uma empresa para visualizar os formulários'
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#35b6cf] mb-4"></div>
                            <p>Carregando formulários...</p>
                        </div>
                    ) : forms.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhum formulário encontrado</h3>
                            <p className="text-slate-500 mb-6">Esta empresa ainda não possui formulários cadastrados.</p>
                            <button
                                onClick={onCreateNew}
                                className="px-6 py-3 bg-[#35b6cf] text-white font-bold rounded-xl hover:bg-[#2ca3bc] shadow-lg shadow-cyan-200 transition-all flex items-center gap-2 mx-auto"
                            >
                                <Plus size={20} />
                                Criar Primeiro Formulário
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Card de "Criar Novo" */}
                            <button
                                onClick={onCreateNew}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-[#35b6cf] hover:bg-slate-50 transition-all group h-full min-h-[180px]"
                            >
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-[#35b6cf] group-hover:text-white transition-colors mb-3">
                                    <Plus size={24} />
                                </div>
                                <span className="font-bold text-slate-600 group-hover:text-[#35b6cf]">Novo Formulário</span>
                            </button>

                            {/* Cards de Formulários */}
                            {forms.map((form) => (
                                <div key={form.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-[#35b6cf]">
                                            <FileText size={20} />
                                        </div>
                                        <div className="relative dropdown-tork">
                                            <button
                                                className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                                onClick={() => setOpenDropdownId(openDropdownId === form.id ? null : form.id)}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openDropdownId === form.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-100 shadow-xl rounded-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    <button
                                                        onClick={() => {
                                                            setEditingForm(form);
                                                            setEditFormTitle(form.title);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#35b6cf] font-medium flex items-center gap-2"
                                                    >
                                                        <Pencil size={14} /> Editar Título
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleDeleteForm(form.id);
                                                            setOpenDropdownId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-medium flex items-center gap-2 border-t border-slate-50"
                                                    >
                                                        <Trash2 size={14} /> Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {editingForm?.id === form.id ? (
                                        <div className="mb-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                className="w-full px-3 py-1.5 border border-[#35b6cf] rounded-lg text-sm font-bold text-slate-800 outline-none mb-2"
                                                value={editFormTitle}
                                                onChange={(e) => setEditFormTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateForm(form.id);
                                                    if (e.key === 'Escape') setEditingForm(null);
                                                }}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingForm(null)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateForm(form.id)}
                                                    className="p-1.5 bg-[#35b6cf] text-white rounded-lg hover:bg-[#2ca3bc]"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <h3 className="font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-[#35b6cf] transition-colors">{form.title}</h3>
                                    )}

                                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 min-h-[2.5em]">{form.description}</p>

                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400 border-t border-slate-100 pt-3">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            {new Date(form.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <BarChart2 size={12} />
                                            {form.qtd_respostas || 0} respostas
                                        </div>
                                    </div>

                                    {/* Link de compartilhamento (Exemplo) */}
                                    {form.link && (
                                        <div className="mt-3 flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex-1 truncate text-[10px] text-slate-400 font-mono select-all">
                                                {form.link}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(form.link || '');
                                                    // Toast could go here
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-[#35b6cf] hover:bg-white rounded-md transition-colors"
                                                title="Copiar Link"
                                            >
                                                <Copy size={12} />
                                            </button>
                                            <a
                                                href={form.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 text-slate-400 hover:text-[#35b6cf] hover:bg-white rounded-md transition-colors"
                                                title="Abrir"
                                            >
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-2xl">
                    <span className="text-xs text-slate-400">
                        Total: <strong>{forms.length}</strong> formulários
                    </span>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
