import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabase';
import { X, FileText, Plus, Calendar, BarChart2, Pencil, Trash2, Check, Link, ExternalLink, Users } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { HSEReportModal } from '../reports/HSEReportModal';
import type { HSEReportData } from '../reports/HSEReportModal';
import { generateHSEReport } from '../../utils/reportGenerator';
import { ConfirmationModal } from '../ui/ConfirmationModal';

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
    colaboladores_inclusos?: string[];
    slug?: string;
    link?: string;
    unidades?: {
        nome: string;
        setores?: number[];
    };
    unidade_nome?: string;
    setor_nome?: string;
}

interface FormsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    company: Company | null;
    onCreateNew: () => void;
    onEditCollaborators?: (form: any) => void;
    loading?: boolean;
}


export const FormsListModal: React.FC<FormsListModalProps> = ({
    isOpen,
    onClose,
    company,
    onCreateNew,
    onEditCollaborators,
    loading: parentLoading
}) => {
    const [forms, setForms] = useState<Form[]>([]);
    const [internalLoading, setInternalLoading] = useState(false);
    const loading = parentLoading || internalLoading;

    // Actions State
    const [editingForm, setEditingForm] = useState<Form | null>(null);
    const [editFormTitle, setEditFormTitle] = useState('');

    // Report State
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportData, setReportData] = useState<HSEReportData | null>(null);

    // Deletion Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formToDeleteId, setFormToDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Auxiliar para extrair o slug do link ou retornar o ID como fallback
    const getFormSlug = (form: Form) => {
        if (form.link) {
            // Tenta extrair a última parte da URL (o slug/ID único)
            const parts = form.link.split('/');
            return parts[parts.length - 1];
        }
        return String(form.id);
    };

    // Auxiliar para gerar o link dinâmico completo
    const getDynamicLink = (form: Form) => {
        const slug = getFormSlug(form);
        return `${window.location.origin}/form/${slug}`;
    };

    useEffect(() => {
        const fetchForms = async () => {
            if (!company || !isOpen) return;

            setInternalLoading(true);
            try {
                const { data, error } = await supabase
                    .from('forms')
                    .select(`
                        *,
                        unidades!inner (
                            id,
                            nome,
                            empresa_mae
                        ),
                        setor (
                            id,
                            nome
                        )
                    `)
                    .eq('unidades.empresa_mae', company.cliente_uuid);

                if (error) throw error;

                // Fetch response counts for all forms
                const formIds = data?.map(f => f.id) || [];
                const responseCounts: Record<number, number> = {};

                if (formIds.length > 0) {
                    const { data: answersData } = await supabase
                        .from('form_answers')
                        .select('form_id, respondedor')
                        .in('form_id', formIds);

                    // Count unique respondents per form
                    const countsByForm: Record<number, Set<string>> = {};
                    answersData?.forEach((answer: any) => {
                        if (!countsByForm[answer.form_id]) {
                            countsByForm[answer.form_id] = new Set();
                        }
                        if (answer.respondedor) {
                            countsByForm[answer.form_id].add(String(answer.respondedor));
                        }
                    });

                    Object.entries(countsByForm).forEach(([formId, respondents]) => {
                        responseCounts[Number(formId)] = respondents.size;
                    });
                }

                const mappedForms = data?.map(f => ({
                    ...f,
                    unidade_nome: f.unidades?.nome,
                    setor_nome: f.setor?.nome,
                    qtd_respostas: responseCounts[f.id] || 0
                })) || [];

                setForms(mappedForms);

            } catch (err) {
                console.error('Error fetching forms:', err);
            } finally {
                setInternalLoading(false);
            }
        };

        fetchForms();
    }, [company, isOpen]);


    const handleDeleteForm = (id: number) => {
        setFormToDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteForm = async () => {
        if (formToDeleteId === null) return;
        setIsDeleting(true);

        try {
            const { error } = await supabase.from('forms').delete().eq('id', formToDeleteId);
            if (error) throw error;

            setForms(prev => prev.filter(f => f.id !== formToDeleteId));
            setShowDeleteConfirm(false);
            setFormToDeleteId(null);
        } catch (err) {
            console.error('Error deleting form:', err);
            alert('Erro ao excluir formulário.');
        } finally {
            setIsDeleting(false);
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

    const handleGenerateReport = async (formId: number) => {
        try {
            const report = await generateHSEReport(formId);
            setReportData(report);
            setIsReportOpen(true);
        } catch (err) {
            console.error('Error generating report:', err);
            alert('Erro ao gerar relatório.');
        }
    };

    const handleEditCollaborators = (form: Form) => {
        if (onEditCollaborators) {
            onEditCollaborators(form);
            onClose(); // Fecha este modal ao abrir o outro
        }
    };

    if (!isOpen) return null;

    return createPortal(
        // Wrapper Principal
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4">

            {/* Backdrop Separado */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Container do Modal */}
            <div
                className="relative bg-white rounded-2xl w-full md:max-w-4xl max-h-[90dvh] md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden isolation-isolate animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between relative z-10 rounded-t-2xl bg-white">
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
                <div className="flex-1 overflow-y-auto p-8 pb-8 custom-scrollbar relative">
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
                        <div className="flex flex-col gap-4">
                            {/* Card de "Criar Novo" */}
                            <button
                                onClick={onCreateNew}
                                className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-[#35b6cf] hover:bg-slate-50 transition-all group"
                            >
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-[#35b6cf] group-hover:text-white transition-colors">
                                    <Plus size={20} />
                                </div>
                                <span className="font-bold text-slate-600 group-hover:text-[#35b6cf]">Novo Formulário</span>
                            </button>

                            {/* Cards de Formulários */}
                            {forms.map((form) => (
                                <div
                                    key={form.id}
                                    className="bg-white border border-slate-100 rounded-2xl p-3 md:p-5 hover:border-[#35b6cf]/30 hover:shadow-lg hover:shadow-slate-200/50 transition-all flex flex-col md:flex-row md:items-center gap-2 md:gap-6 group relative z-10"
                                >
                                    {/* Icone */}
                                    <div className="p-2 md:p-3 bg-slate-50 rounded-xl text-[#35b6cf] shrink-0 group-hover:bg-[#35b6cf]/10 transition-colors w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                                        <FileText size={20} className="md:w-6 md:h-6" />
                                    </div>

                                    {/* Info Principal */}
                                    <div className="flex-1 min-w-0">
                                        {editingForm?.id === form.id ? (
                                            <div className="flex items-center gap-2 mb-1">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className="flex-1 px-3 py-1 border border-[#35b6cf] rounded-lg text-sm font-bold text-slate-800 outline-none"
                                                    value={editFormTitle}
                                                    onChange={(e) => setEditFormTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateForm(form.id);
                                                        if (e.key === 'Escape') setEditingForm(null);
                                                    }}
                                                />
                                                <button onClick={() => handleUpdateForm(form.id)} className="p-1.5 bg-[#35b6cf] text-white rounded-lg hover:bg-[#2ca3bc]"><Check size={14} /></button>
                                                <button onClick={() => setEditingForm(null)} className="p-1.5 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-[#35b6cf] transition-colors truncate mb-0.5">{form.title}</h3>
                                        )}
                                        <p className="text-xs text-slate-500 line-clamp-1 mb-1 md:mb-2">{form.description || 'Sem descrição disponível para este formulário.'}</p>

                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Calendar size={12} className="text-[#35b6cf]" />
                                                {new Date(form.created_at).toLocaleDateString()}
                                                {form.setor_nome && (
                                                    <>
                                                        <span className="text-slate-200">|</span>
                                                        <span className="text-primary/70">{form.setor_nome}</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4 shrink-0">
                                                <BarChart2 size={12} className="text-[#35b6cf]" />
                                                <span className="text-slate-600">{form.qtd_respostas || 0}</span>
                                                <span className="hidden md:inline text-slate-400">respostas</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4 shrink-0">
                                                {/* Representa a quantidade de colaboradores incluídos neste formulário */}
                                                <Users size={12} className="text-[#35b6cf]" />
                                                <span className="text-slate-600">{form.colaboladores_inclusos?.length || 0}</span>
                                                <span className="hidden md:inline text-slate-400">incluídos</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ações Padronizadas conforme modelo da imagem */}
                                    <div className="flex items-center gap-2 pt-2 md:pt-0 md:border-l border-slate-100 md:pl-6 shrink-0 relative">
                                        {/* Ações de Link (Dropdown) */}
                                        <Dropdown
                                            triggerIcon={Link}
                                            actions={[
                                                {
                                                    label: 'Copiar Link',
                                                    icon: Link,
                                                    onClick: () => {
                                                        const dynamicLink = getDynamicLink(form);
                                                        navigator.clipboard.writeText(dynamicLink);
                                                        alert('Link copiado com sucesso!');
                                                    }
                                                },
                                                {
                                                    label: 'Abrir em Nova Guia',
                                                    icon: ExternalLink,
                                                    href: getDynamicLink(form)
                                                }
                                            ]}
                                        />

                                        <button
                                            onClick={() => handleGenerateReport(form.id)}
                                            className="p-2 text-slate-400 hover:text-[#35b6cf] hover:bg-[#35b6cf]/10 rounded-lg transition-all"
                                            title="Gerar Relatório"
                                        >
                                            <FileText size={18} />
                                        </button>

                                        {/* Menu de Mais Ações (Dropdown Padronizado) */}
                                        <Dropdown
                                            actions={[
                                                {
                                                    label: 'Editar Título',
                                                    icon: Pencil,
                                                    onClick: () => {
                                                        setEditingForm(form);
                                                        setEditFormTitle(form.title);
                                                    },
                                                    show: true
                                                },
                                                {
                                                    label: 'Editar Colaboradores',
                                                    icon: Users,
                                                    onClick: () => handleEditCollaborators(form),
                                                    show: true
                                                },
                                                {
                                                    label: 'Excluir Formulário',
                                                    icon: Trash2,
                                                    variant: 'danger',
                                                    onClick: () => handleDeleteForm(form.id),
                                                    show: true
                                                }
                                            ]}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {reportData && (
                <HSEReportModal
                    isOpen={isReportOpen}
                    onClose={() => {
                        setIsReportOpen(false);
                        setReportData(null);
                    }}
                    data={reportData}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    if (!isDeleting) {
                        setShowDeleteConfirm(false);
                        setFormToDeleteId(null);
                    }
                }}
                onConfirm={confirmDeleteForm}
                title="Excluir Formulário?"
                description={`Você tem certeza que deseja excluir o formulário "${forms.find(f => f.id === formToDeleteId)?.title}"? Esta ação não pode ser desfeita e removerá todos os dados associados.`}
                confirmText={isDeleting ? 'Excluindo...' : 'Excluir'}
                cancelText="Cancelar"
                type="danger"
            />
        </div>,
        document.body
    );
};
