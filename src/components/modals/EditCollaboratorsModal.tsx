import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabase';
import { X, Search, Users, Save } from 'lucide-react';
import { Select } from '../ui/Select';

// Interface para o Colaborador
interface Collaborator {
    id: string; // UUID vindo do banco
    nome: string;
    email: string;
    sexo: string;
    cargo: string;
    setor: string;
}

// Interface para as Props do Modal
interface EditCollaboratorsModalProps {
    isOpen: boolean;
    onClose: () => void;
    form: {
        id: number;
        title: string;
        unidade_id: number;
        setor_id?: number | null;
        colaboladores_inclusos?: string[];
    } | null;
    onSaveSuccess: () => void;
}

export const EditCollaboratorsModal: React.FC<EditCollaboratorsModalProps> = ({
    isOpen,
    onClose,
    form,
    onSaveSuccess
}) => {
    // Estados para carregar dados
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSector, setFilterSector] = useState('');
    const [filterRole, setFilterRole] = useState('');

    // Efeito para carregar colaboradores e respondentes quando o modal abre
    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen || !form) return;

            setLoading(true);
            try {
                // 1. Buscar colaboradores da unidade/setor do formulário
                let query = supabase
                    .from('colaboradores')
                    .select('id, nome, email, sexo, cargos(nome), setor(nome)')
                    .eq('unidade_id', form.unidade_id);

                // Se houver setor específico, filtra por ele também
                if (form.setor_id) {
                    query = query.eq('setor_id', form.setor_id);
                }

                const { data: colabsData, error: colabsError } = await query;
                if (colabsError) throw colabsError;

                const mappedColabs = (colabsData || []).map((c: any) => {
                    const cargoObj = Array.isArray(c.cargos) ? c.cargos[0] : c.cargos;
                    const setorObj = Array.isArray(c.setor) ? c.setor[0] : c.setor;
                    return {
                        id: c.id,
                        nome: c.nome,
                        email: c.email,
                        sexo: c.sexo,
                        cargo: cargoObj?.nome || '-',
                        setor: setorObj?.nome || '-'
                    };
                });

                // 2. Buscar quem já respondeu a este formulário
                const { data: answersData, error: answersError } = await supabase
                    .from('form_answers')
                    .select('respondedor')
                    .eq('form_id', form.id);

                if (answersError) throw answersError;

                // Transformar ids em Set para busca rápida
                const respIds = new Set(answersData?.map(a => String(a.respondedor)) || []);
                setRespondedIds(respIds);

                // Inicializar selecionados com o que já está salvo no formulário
                const currentlyIncluded = new Set(form.colaboladores_inclusos || []);
                setSelectedIds(currentlyIncluded);

                setCollaborators(mappedColabs);
            } catch (err) {
                console.error('Erro ao buscar colaboradores para edição:', err);
                alert('Erro ao carregar lista de colaboradores.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, form]);

    // Função para alternar seleção de um colaborador
    const toggleCollaborator = (id: string) => {
        // Bloqueia se o colaborador já respondeu
        if (respondedIds.has(id)) {
            alert('Este colaborador não pode ser removido pois já respondeu ao formulário.');
            return;
        }

        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Função para salvar as alterações
    const handleSave = async () => {
        if (!form) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('forms')
                .update({
                    colaboladores_inclusos: Array.from(selectedIds)
                })
                .eq('id', form.id);

            if (error) throw error;

            alert('Colaboradores atualizados com sucesso!');
            onSaveSuccess();
            onClose();
        } catch (err) {
            console.error('Erro ao atualizar colaboradores do formulário:', err);
            alert('Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    const filteredCollaborators = collaborators.filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSector = filterSector ? c.setor === filterSector : true;
        const matchesRole = filterRole ? c.cargo === filterRole : true;

        return matchesSearch && matchesSector && matchesRole;
    });

    // Listas únicas para os filtros
    const sectors = Array.from(new Set(collaborators.map(c => c.setor))).filter(s => s !== '-').sort();
    const roles = Array.from(new Set(collaborators.map(c => c.cargo))).filter(r => r !== '-').sort();

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Container do Modal - Aumentado em ~40% (max-w-2xl para max-w-4xl) */}
            <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Editar Colaboradores</h2>
                            <p className="text-xs text-slate-500 truncate max-w-[300px]">
                                {form?.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search & Filters Bar */}
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#35b6cf] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou email..."
                                className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#35b6cf] transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-80">
                            <div className="flex-1">
                                <Select
                                    value={filterSector}
                                    onChange={setFilterSector}
                                    options={[
                                        { label: 'Todos Setores', value: '' },
                                        ...sectors.map(s => ({ label: s, value: s }))
                                    ]}
                                    placeholder="Setor"
                                />
                            </div>
                            <div className="flex-1">
                                <Select
                                    value={filterRole}
                                    onChange={setFilterRole}
                                    options={[
                                        { label: 'Todos Cargos', value: '' },
                                        ...roles.map(r => ({ label: r, value: r }))
                                    ]}
                                    placeholder="Cargo"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#35b6cf] mb-4"></div>
                            <p className="text-sm">Carregando colaboradores...</p>
                        </div>
                    ) : filteredCollaborators.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500 text-sm">Nenhum colaborador encontrado para este critério.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                                    <tr>
                                        <th className="px-4 py-3 w-10 text-center">Sel.</th>
                                        <th className="px-4 py-3">Nome</th>
                                        <th className="px-4 py-3">Cargo/Setor</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredCollaborators.map((colab) => {
                                        const isSelected = selectedIds.has(colab.id);
                                        const hasResponded = respondedIds.has(colab.id);

                                        return (
                                            <tr
                                                key={colab.id}
                                                className={`hover:bg-slate-50 transition-colors ${!isSelected ? 'bg-slate-50/30' : ''} ${hasResponded ? 'opacity-40 grayscale pointer-events-none select-none' : ''}`}
                                            >
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className={`w-4 h-4 rounded border-slate-300 text-[#35b6cf] focus:ring-[#35b6cf] cursor-pointer ${hasResponded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        checked={isSelected}
                                                        onChange={() => !hasResponded && toggleCollaborator(colab.id)}
                                                        disabled={hasResponded}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-800">{colab.nome}</div>
                                                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{colab.email || 'Sem email'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs text-slate-600 font-semibold">{colab.cargo || '-'}</div>
                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{colab.setor || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {hasResponded ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 uppercase tracking-tight">
                                                            Concluído
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 uppercase tracking-tight">
                                                            Pendente
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Selecionados: <span className="text-[#35b6cf]">{selectedIds.size}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-[#35b6cf] text-white rounded-xl text-sm font-bold hover:bg-[#2ca3bc] shadow-lg shadow-cyan-200 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
