import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Info, X, FileText, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';
import type { FormQuestion, QuestionType } from '../../types';

interface FormEditorProps {
    formId?: number | null; // null for new form
    initialData?: any;
    onBack: () => void;
    onSaveSuccess: () => void;
}




// MOCK DATA FOR HIERARCHY LOGIC
const MOCK_COMPANIES = [
    {
        id: 1,
        name: 'Gama Center',
        cnpj: '12.345.678/0001-90',
        total_collaborators: 150,
        units: [
            { id: 101, name: 'Matriz', collaborators: 45, sectors: ['TI', 'RH', 'Financeiro', 'Administrativo'] },
            { id: 102, name: 'Filial SP', collaborators: 15, sectors: [] }, // Under 20, no sector needed
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
    }
];

const STEPS = [
    { id: 1, label: 'Público Alvo', description: 'Defina a empresa e unidade' },
    { id: 2, label: 'Detalhes', description: 'Título, descrição e link' },
    { id: 3, label: 'Ajustes Finais', description: 'Revisão e publicação' },
];

const MOCK_TEMPLATES = [
    {
        id: 'hse_2025',
        label: 'Formulário HSE 2025',
        description: 'Modelo padrão para avaliação de riscos psicossociais e segurança do trabalho.',
        questions: [
            { temp_id: 't1', label: 'Como você avalia o suporte da liderança?', question_type: 'rating', required: true, question_order: 0 },
            { temp_id: 't2', label: 'Descreva uma situação de risco recente.', question_type: 'long_text', required: false, question_order: 1 },
            { temp_id: 't3', label: 'Você se sente seguro no ambiente de trabalho?', question_type: 'choice', required: true, question_order: 2, option_1: 'Sim', option_2: 'Não', option_3: 'Parcialmente' }
        ]
    },
    {
        id: 'clima_organizacional',
        label: 'Pesquisa de Clima',
        description: 'Avaliação geral do ambiente e satisfação dos colaboradores.',
        questions: []
    }
];

export const FormEditor: React.FC<FormEditorProps> = ({ formId, initialData, onBack, onSaveSuccess }) => {
    const [loading, setLoading] = useState(false);

    // Step State
    const [currentStep, setCurrentStep] = useState(1);

    // Form Data State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Partial<FormQuestion>[]>([]);

    // HIERARCHY STATE
    const [companyId, setCompanyId] = useState<number | ''>('');
    const [unitId, setUnitId] = useState<number | ''>('');
    const [sectorName, setSectorName] = useState('');

    // Handle initialData from Quick Generation
    useEffect(() => {
        if (initialData && !formId) {
            setCompanyId(initialData.company_id);
            setUnitId(initialData.unit_id);
            setSectorName(initialData.sector || '');
            setCurrentStep(2); // Auto-advance to details

            // Auto-generate title if possible
            const company = MOCK_COMPANIES.find(c => c.id === initialData.company_id);
            const unit = company?.units.find(u => u.id === initialData.unit_id);
            if (company && unit) {
                const baseTitle = `Levantamento - ${company.name} (${unit.name})`;
                setTitle(initialData.sector && initialData.sector !== 'Geral' ? `${baseTitle} - ${initialData.sector}` : baseTitle);
            }
        }
    }, [initialData, formId]);

    // Derived State helpers
    const selectedCompany = MOCK_COMPANIES.find(c => c.id === Number(companyId));
    const selectedUnit = selectedCompany?.units.find(u => u.id === Number(unitId));
    const showSectorSelect = selectedUnit && selectedUnit.collaborators > 20;

    // Auto-generate Slug and Title based on Hierarchy
    useEffect(() => {
        if (!formId) { // Only auto-generate for new forms
            const parts = [];
            if (selectedCompany) parts.push(selectedCompany.name);
            if (selectedUnit) parts.push(selectedUnit.name);
            if (sectorName) parts.push(sectorName);

            // Auto-Title Logic
            if (parts.length > 0) {
                // Format: "Avaliação Psicossocial - Company - Unit - Sector"
                setTitle(`Avaliação Psicossocial - ${parts.join(' - ')}`);
            }

            // Auto-Slug Logic
            const baseSlug = parts.join('-').toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
            if (baseSlug) {
                setSlug(`${baseSlug}-${Date.now().toString().slice(-4)}`);
            }
        }
    }, [selectedCompany, selectedUnit, sectorName, formId]);


    // HSE / Dimensions Data loaded on mount if needed
    // const [dimensions, setDimensions] = useState<HSEDimension[]>([]);

    useEffect(() => {
        if (formId) {
            loadForm(formId);
        } else {
            // Default first question
            setQuestions([{
                temp_id: 'q_' + Date.now(),
                label: 'Nova Pergunta',
                question_type: 'short_text',
                required: false,
                question_order: 0
            }]);
        }
    }, [formId]);

    const loadForm = async (id: number) => {
        setLoading(true);
        try {
            const { data: form, error } = await supabase
                .from('forms')
                .select('*, questions(*)') // Assuming foreign key setup
                .eq('id', id)
                .single();

            if (error) throw error;

            setTitle(form.title);
            setDescription(form.description);
            setSlug(form.slug);

            // Sort questions
            const sortedQs = (form.questions || []).sort((a: any, b: any) => a.question_order - b.question_order);
            setQuestions(sortedQs);

        } catch (error) {
            console.error('Error loading form:', error);
            alert('Erro ao carregar formulário.');
            onBack();
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = MOCK_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            // Optional: Auto-fill description if empty
            if (!description) setDescription(template.description);
            // Optional: Load template questions!
            setQuestions(template.questions.map(q => ({
                ...q,
                question_type: q.question_type as QuestionType,
                temp_id: 'mT_' + Date.now() + Math.random()
            })));
        }
    };


    const handleSave = async () => {
        if (!title) {
            alert('Por favor, preencha o título do formulário na etapa de "Detalhes".');
            setCurrentStep(2);
            return;
        }

        setLoading(true);
        try {
            const formSlug = slug || title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') + '-' + Date.now().toString().slice(-4);

            const formData = {
                title,
                description,
                slug: formSlug,
            };

            let savedFormId = formId;

            if (formId) {
                const { error } = await supabase.from('forms').update(formData).eq('id', formId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('forms').insert(formData).select().single();
                if (error) throw error;
                savedFormId = data.id;
            }

            const currentQuestionIds = questions.filter(q => q.id).map(q => q.id);
            if (formId) {
                await supabase.from('form_questions').delete().eq('form_id', formId).not('id', 'in', `(${currentQuestionIds.join(',')})`);
            }

            for (const [index, q] of questions.entries()) {
                const qData = {
                    form_id: savedFormId,
                    label: q.label || 'Sem Título',
                    question_type: q.question_type,
                    required: q.required,
                    question_order: index,
                    option_1: q.option_1,
                    option_2: q.option_2,
                    option_3: q.option_3,
                    option_4: q.option_4,
                    option_5: q.option_5,
                    min_value: q.min_value,
                    max_value: q.max_value
                };

                if (q.id) {
                    await supabase.from('form_questions').update(qData).eq('id', q.id);
                } else {
                    await supabase.from('form_questions').insert(qData);
                }
            }

            alert('Salvo com sucesso!');
            onSaveSuccess();

        } catch (error) {
            console.error('Save failed:', error);
            alert('Falha ao salvar: ' + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            // Validation for Step 1 if strictly needed (e.g. must select company)
            // if (!companyId) return alert('Selecione uma empresa');
        }
        if (currentStep === 2) {
            if (!title) return alert('O título é obrigatório.');
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    };

    if (loading && formId && !title) return <div>Carregando...</div>;


    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-100px)] flex flex-col md:flex-row overflow-hidden">

            {/* 1. LEFT SIDEBAR STEPPER */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
                <div className="mb-6 flex items-center gap-2">
                    <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <h2 className="font-bold text-slate-700">{formId ? 'Editar' : 'Criar'}</h2>
                </div>

                <div className="space-y-6 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200 -z-10" />

                    {STEPS.map((step) => {
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div
                                key={step.id}
                                onClick={() => {
                                    // Restrict to ONLY moving backward (or staying on current)
                                    if (step.id < currentStep) {
                                        setCurrentStep(step.id);
                                    }
                                }}
                                className={`flex items-start gap-4 ${step.id < currentStep ? 'cursor-pointer' : 'cursor-default'} group ${isActive ? 'opacity-100' : 'opacity-70'} ${step.id > currentStep ? 'opacity-50' : ''}`}
                            >
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-colors bg-white
                                    ${isActive
                                        ? 'border-[#35b6cf] text-[#35b6cf]'
                                        : isCompleted
                                            ? 'border-emerald-500 text-emerald-500'
                                            : 'border-slate-300 text-slate-400'}
                                `}>
                                    {isCompleted ? <CheckCircle size={16} /> : step.id}
                                </div>
                                <div className="pt-1">
                                    <p className={`text-sm font-bold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{step.label}</p>
                                    <p className="text-xs text-slate-400 leading-tight">{step.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto pt-6 text-xs text-slate-400">
                    <p>Passo {currentStep} de {STEPS.length}</p>
                    <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                        <div
                            className="bg-[#35b6cf] h-full transition-all duration-300"
                            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Scrollable Step Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300 key={currentStep}">

                        {/* STEP 1: HIERARCHY */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Definição do Público Alvo</h2>
                                    <p className="text-slate-500">Para qual grupo de colaboradores este formulário será destinado?</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Company Select */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Empresa</label>
                                            <select
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 outline-none transition-all"
                                                value={companyId}
                                                onChange={(e) => {
                                                    setCompanyId(Number(e.target.value));
                                                    setUnitId('');
                                                    setSectorName('');
                                                }}
                                            >
                                                <option value="">Selecione uma Empresa</option>
                                                {MOCK_COMPANIES.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            {selectedCompany && (
                                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg">
                                                    <CheckCircle size={12} />
                                                    {selectedCompany.total_collaborators} colaboradores totais
                                                </p>
                                            )}
                                        </div>

                                        {/* Unit Select */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-slate-700">Unidade</label>
                                            <select
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                                                value={unitId}
                                                onChange={(e) => {
                                                    setUnitId(Number(e.target.value));
                                                    setSectorName('');
                                                }}
                                                disabled={!companyId}
                                            >
                                                <option value="">Selecione uma Unidade</option>
                                                {selectedCompany?.units.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                            {selectedUnit && (
                                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg">
                                                    <CheckCircle size={12} />
                                                    {selectedUnit.collaborators} colaboradores na unidade
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* CONDITIONAL SECTOR SELECT */}
                                    {showSectorSelect && (
                                        <div className="animate-in slide-in-from-top-2 fade-in duration-300 pt-4 border-t border-slate-100">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Setor (Opcional)</label>
                                            <div className="flex items-start gap-3 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100/50">
                                                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                                <p className="text-xs text-amber-800 leading-relaxed">
                                                    Esta unidade possui <strong>{selectedUnit.collaborators} colaboradores</strong> (acima de 20).
                                                    Recomendamos restringir o formulário a um setor específico para melhor análise.
                                                </p>
                                            </div>

                                            <select
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 outline-none transition-all"
                                                value={sectorName}
                                                onChange={(e) => setSectorName(e.target.value)}
                                            >
                                                <option value="">Todo a Unidade (Geral)</option>
                                                {selectedUnit.sectors.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: DETAILS */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Detalhes do Formulário</h2>
                                    <p className="text-slate-500">Informações básicas e identificação</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                    {/* MODEL SELECTOR (CARDS) */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                Carregar Modelo (Opcional)
                                                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Agilize a criação</span>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {MOCK_TEMPLATES.map(template => (
                                                <div
                                                    key={template.id}
                                                    className={`
                                                        relative p-4 rounded-xl border-2 transition-all cursor-pointer group
                                                        ${selectedTemplate === template.id
                                                            ? 'border-[#35b6cf] bg-[#35b6cf]/5'
                                                            : 'border-slate-200 bg-white hover:border-[#35b6cf]/50 hover:shadow-md'}
                                                    `}
                                                    onClick={() => handleTemplateSelect(template.id)}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className={`p-2 rounded-lg ${selectedTemplate === template.id ? 'bg-[#35b6cf]/20 text-[#35b6cf]' : 'bg-slate-100 text-slate-500'}`}>
                                                            <FileText size={20} />
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewTemplateId(template.id);
                                                                setShowPreview(true);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-[#35b6cf] hover:bg-[#35b6cf]/10 rounded-full transition-colors"
                                                            title="Visualizar Modelo"
                                                        >
                                                            <Info size={18} />
                                                        </button>
                                                    </div>

                                                    <h3 className="font-bold text-slate-800 text-sm mb-1">{template.label}</h3>
                                                    <p className="text-xs text-slate-500 line-clamp-2">{template.description}</p>

                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-700">Título do Formulário <span className="text-red-500">*</span></label>
                                        <input
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-semibold text-slate-800 focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 outline-none transition-all placeholder:font-normal"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="Ex: Avaliação de Riscos Psicossociais"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-slate-700">Descrição</label>
                                        <textarea
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-[#35b6cf] focus:ring-2 focus:ring-[#35b6cf]/10 outline-none h-32 resize-none transition-all"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Instruções para o preenchimento e objetivos desta pesquisa..."
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Slug (URL Pública)</label>
                                        <div className="flex items-center gap-0 text-sm border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#35b6cf]/10 focus-within:border-[#35b6cf] transition-all">
                                            <span className="bg-slate-50 text-slate-500 px-3 py-3 font-medium border-r border-slate-200 select-none">gamapsicossocial.com/form/</span>
                                            <input
                                                className="flex-1 p-3 outline-none text-slate-700 font-medium"
                                                value={slug}
                                                onChange={e => setSlug(e.target.value)}
                                                placeholder="slug-automatico"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: QUESTIONS */}
                        {/* STEP 3: FINAL ADJUSTMENTS (SUMMARY, now Step 3) */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Ajustes Finais</h2>
                                    <p className="text-slate-500">Revise os dados antes de publicar o formulário</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                    {/* Summary Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Total de Perguntas</p>
                                            <p className="text-3xl font-bold text-[#35b6cf] mt-2">{questions.length}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Público Alvo</p>
                                            <p className="text-lg font-bold text-slate-700 mt-2 truncate" title={selectedCompany?.name || '-'}>
                                                {selectedCompany?.name || '-'}
                                            </p>
                                            <p className="text-sm text-slate-500">{selectedUnit?.name || 'Todas as Unidades'}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Modelo Utilizado</p>
                                            <p className="text-lg font-bold text-slate-700 mt-2 truncate">
                                                {MOCK_TEMPLATES.find(t => t.id === selectedTemplate)?.label || 'Nenhum (Em branco)'}
                                            </p>
                                            <p className="text-xs text-slate-400">Base para as perguntas</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-900 mb-4">Resumo do Formulário</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Título</span>
                                                <p className="text-slate-800 font-medium">{title}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Descrição</span>
                                                <p className="text-slate-600 text-sm whitespace-pre-wrap">{description || 'Sem descrição'}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Link Público Final</span>
                                                <a
                                                    href={`${window.location.origin}/form/${slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-[#35b6cf] hover:underline font-medium break-all flex items-center gap-1"
                                                >
                                                    {window.location.origin}/form/{slug}
                                                    <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 p-6 bg-white flex justify-between items-center z-10">
                    <div className="text-sm text-slate-400 italic hidden md:block">
                        {currentStep === 3 ? 'Esta é a última etapa. Verifique tudo antes de salvar.' : 'Todos as alterações são salvas localmente.'}
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {currentStep > 1 && (
                            <button
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                            >
                                Voltar
                            </button>
                        )}

                        {currentStep < 3 ? (
                            <button
                                onClick={handleNextStep}
                                className="flex-1 md:flex-none px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                            >
                                Próximo
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#35b6cf] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[#0f978e] disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
                            >
                                <Save size={18} />
                                {loading ? 'Salvando...' : 'Salvar Formulário'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* PREVIEW DRAWER (SIDE MODAL) */}
            {
                showPreview && previewTemplateId && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowPreview(false)}
                        />

                        {/* Drawer */}
                        <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                            <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Visualizar Modelo</h3>
                                    <p className="text-sm text-slate-500">
                                        {MOCK_TEMPLATES.find(t => t.id === previewTemplateId)?.label}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                                {/* Mock PDF Paper Look */}
                                <div className="bg-white shadow-lg p-8 min-h-[600px] border border-slate-200 mx-auto max-w-[400px]">
                                    <div className="border-b-2 border-slate-800 pb-4 mb-8">
                                        <h1 className="text-2xl font-serif text-slate-900 font-bold uppercase tracking-wider text-center">Formulário de Avaliação</h1>
                                        <p className="text-center text-xs text-slate-500 mt-2 uppercase">Gama Psicossocial - Segurança do Trabalho</p>
                                    </div>

                                    <div className="space-y-8">
                                        {MOCK_TEMPLATES.find(t => t.id === previewTemplateId)?.questions.map((q, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <p className="text-sm font-bold text-slate-800 font-serif">
                                                    {idx + 1}. {q.label} {q.required && '*'}
                                                </p>
                                                {/* Mock Answer Lines */}
                                                {q.question_type === 'short_text' && <div className="h-8 border-b border-slate-300"></div>}
                                                {q.question_type === 'long_text' && (
                                                    <div className="space-y-2">
                                                        <div className="h-6 border-b border-slate-300"></div>
                                                        <div className="h-6 border-b border-slate-300"></div>
                                                        <div className="h-6 border-b border-slate-300"></div>
                                                    </div>
                                                )}
                                                {(q.question_type === 'choice' || q.question_type === 'select' || q.question_type === 'rating') && (
                                                    <div className="flex flex-col gap-1 pl-2">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <div className="w-3 h-3 border border-slate-400 rounded-sm"></div>
                                                                <div className="h-2 w-24 bg-slate-100 rounded"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {MOCK_TEMPLATES.find(t => t.id === previewTemplateId)?.questions.length === 0 && (
                                            <p className="text-center text-slate-400 italic py-10">Este modelo não possui perguntas pré-definidas.</p>
                                        )}
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-slate-200">
                                        <div className="flex justify-between items-end">
                                            <div className="text-xs text-slate-400">Página 1 de 1</div>
                                            <div className="text-xs text-slate-400">Gerado automaticamente</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 bg-white">
                                <button
                                    onClick={() => {
                                        if (previewTemplateId) handleTemplateSelect(previewTemplateId);
                                        setShowPreview(false);
                                    }}
                                    className="w-full py-3 bg-[#35b6cf] text-white rounded-xl font-bold hover:bg-[#0f978e] transition-colors shadow-lg shadow-cyan-100"
                                >
                                    Usar este Modelo
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};
