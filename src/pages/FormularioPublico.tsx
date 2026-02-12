import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Form, FormQuestion, Collaborator } from '../types';
import { CheckCircle, User, Hash, ChevronDown } from 'lucide-react';
import logo from '../assets/logo.png';

// --- Componentes Visuais ---

const LoadingScreen = () => (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-[#35b6cf]/30 border-t-[#35b6cf] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Carregando formulário...</p>
    </div>
);

const CustomSelect = ({ options, value, onChange, placeholder = 'Selecione...' }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: any) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((o: any) => o.value === value);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
                <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                    {options.length > 0 ? (
                        options.map((option: any) => (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-700 text-sm border-b border-slate-50 last:border-0"
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-slate-400 text-sm text-center">Nenhuma opção disponível</div>
                    )}
                </div>
            )}
        </div>
    );
};

// Helper: Extrai e limpa as opções das colunas option_1...option_5
const getOptions = (question: FormQuestion): string[] => {
    return [
        question.option_1,
        question.option_2,
        question.option_3,
        question.option_4,
        question.option_5
    ]
        .filter((opt) => opt !== null && opt !== undefined && String(opt).trim() !== '')
        .map(String);
};

export const FormularioPublico: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [form, setForm] = useState<Form | null>(null);
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Estados de Identificação
    const [cpf, setCpf] = useState('');
    const [cpfError, setCpfError] = useState<string | null>(null);
    const [checkingCpf, setCheckingCpf] = useState(false);
    const [collaborator, setCollaborator] = useState<Collaborator | null>(null);

    // Estados do Formulário
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [step, setStep] = useState<'cover' | 'cpf_check' | 'form'>('cover');
    const [currentSection, setCurrentSection] = useState(0);

    // Agrupamento de Seções
    const sections = useMemo(() => {
        if (!questions || questions.length === 0) return [];
        const list: { title?: string; questions: FormQuestion[] }[] = [{ title: 'Principal', questions: [] }];

        questions.forEach(q => {
            if (q.question_type === 'section_break') {
                list.push({ title: q.label || 'Nova Seção', questions: [] });
            } else {
                list[list.length - 1].questions.push(q);
            }
        });

        // Remove primeira seção se vazia (caso comece com section_break)
        if (list.length > 1 && list[0].questions.length === 0) return list.slice(1);
        return list;
    }, [questions]);

    useEffect(() => {
        if (slug) fetchForm();
    }, [slug]);

    useEffect(() => {
        if (form?.title) document.title = form.title;
    }, [form]);

    const fetchForm = async () => {
        setLoading(true);
        try {
            if (!slug) throw new Error('Link inválido');

            // 1. Busca dados do Formulário (suporta links com ou sem barra final)
            const { data: formData, error: formError } = await supabase
                .from('forms')
                .select('*')
                .or(`link.ilike.%/${slug},link.ilike.%/${slug}/`)
                .maybeSingle();

            if (formError) {
                console.error("Erro busca form:", formError);
                throw formError;
            }

            if (!formData) {
                setError('Formulário não encontrado.');
                setLoading(false);
                return;
            }
            setForm(formData);

            // 2. Busca Perguntas vinculadas ao form_id
            const { data: questionData, error: qError } = await supabase
                .from('form_questions')
                .select('*')
                .eq('form_id', formData.id)
                .order('question_order', { ascending: true });

            if (qError) {
                console.error('Erro ao buscar perguntas:', qError);
                setError('Erro ao carregar perguntas.');
            } else {
                setQuestions(questionData || []);
            }

        } catch (err: any) {
            // Ignora AbortError que pode ocorrer em hot-reload
            if (err.name === 'AbortError' || err.message?.includes('AbortError')) return;

            console.error('Erro geral:', err);
            setError('Erro ao carregar formulário.');
        } finally {
            setLoading(false);
        }
    };

    // --- Lógica de CPF ---
    const handleCheckCPF = async () => {
        setCpfError(null);
        // Validação simples de formato para UX (ideal usar lib de validação real)
        const cleanCpf = cpf.replace(/\D/g, '');
        if (cleanCpf.length !== 11) {
            setCpfError("CPF inválido.");
            return;
        }

        setCheckingCpf(true);
        try {
            const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

            const { data: colabData } = await supabase
                .from('colaboradores')
                .select('*')
                .or(`cpf.eq.${cleanCpf},cpf.eq.${formattedCpf}`)
                .maybeSingle();

            if (!colabData) {
                setCpfError('Colaborador não encontrado.');
                setCheckingCpf(false);
                return;
            }

            // Verifica permissão (se houver lista de inclusos no form)
            const allowedIds = (form?.colaboladores_inclusos || []).map(String);
            // Se a lista for vazia ou nula, assume liberado para todos (ou bloqueia, depende da regra)
            // Aqui assumo: Se tem lista, verifica. Se não tem, libera (ou bloqueia, ajuste conforme regra).
            if (form?.colaboladores_inclusos && form.colaboladores_inclusos.length > 0) {
                // Nota: colabData.id precisa ser convertido para string para comparar com UUIDs do array
                if (!allowedIds.includes(String(colabData.id))) {
                    setCpfError('Você não está habilitado para este formulário.');
                    setCheckingCpf(false);
                    return;
                }
            }

            // Busca nome da empresa para exibição
            let companyName = '';
            if (colabData.unidade_id) {
                const { data: unitData } = await supabase.from('unidades').select('empresa_mae').eq('id', colabData.unidade_id).single();
                if (unitData?.empresa_mae) {
                    const { data: companyData } = await supabase.from('clientes').select('nome_fantasia').eq('cliente_uuid', unitData.empresa_mae).single();
                    companyName = companyData?.nome_fantasia || '';
                }
            }

            setCollaborator({ ...colabData, empresa_nome: companyName });
            setStep('form');
        } catch (err) {
            setCpfError('Erro ao verificar CPF.');
        } finally {
            setCheckingCpf(false);
        }
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const validateSection = (qs: FormQuestion[]) => {
        for (const q of qs) {
            if (q.required && q.id) {
                const val = answers[q.id];
                if (val === undefined || val === '' || val === null) {
                    alert(`Por favor, responda: "${q.label}"`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateSection(sections[currentSection].questions)) {
            setCurrentSection(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // --- ENVIO DAS RESPOSTAS (Ajustado para seu Schema) ---
    const handleSubmit = async () => {
        const currentQs = sections[currentSection].questions;
        if (!validateSection(currentQs)) return;
        if (!form || !collaborator) return;

        setLoading(true);

        // Mapeia respostas para o formato da tabela 'form_answers'
        const answersToInsert = questions.map(q => {
            if (q.question_type === 'section_break' || !q.id) return null;

            const rawValue = answers[q.id];
            if (rawValue === undefined) return null;

            // Define se salva em answer_text ou answer_number
            let answerNumber: number | null = null;
            let answerText: string | null = String(rawValue);

            // Se for rating/escala, converte para número
            // (Assumindo que sua tabela questions usa 'rating' ou 'scale' como type)
            if (q.question_type === 'rating' || q.question_type === 'scale' || !isNaN(Number(rawValue))) {
                // Tenta converter se for puramente numérico (segurança extra)
                const num = Number(rawValue);
                if (!isNaN(num)) {
                    answerNumber = num;
                    // Se for puramente numérico, podemos optar por não salvar texto ou salvar ambos
                    // Aqui salvo texto como null se for numérico puro para limpar o banco
                    // AJUSTE: Se for um select de texto (ex: "Sempre"), isNaN falha e cai no else, salvando texto. Correto.
                }
            }

            // Força lógica correta baseada no tipo da pergunta
            if (q.question_type === 'select' || q.question_type === 'short_text' || q.question_type === 'long_text') {
                answerNumber = null;
                answerText = String(rawValue);
            }

            return {
                form_id: form.id,                // bigint
                question_id: q.id,            // bigint
                respondedor: collaborator.id, // uuid (Vem da tabela colaboradores)
                unidade_colaborador: collaborator.unidade_id, // bigint
                cargo: collaborator.cargo_id, // bigint (ajuste se o nome da coluna no objeto collaborator for diferente)
                answer_text: answerText,      // text
                answer_number: answerNumber,  // numeric
            };
        }).filter(Boolean);

        const { error: submitError } = await supabase
            .from('form_answers')
            .insert(answersToInsert);

        if (submitError) {
            console.error("Erro ao salvar:", submitError);
            alert('Erro ao enviar respostas. Verifique sua conexão.');
            setLoading(false);
        } else {
            // Incrementa contador de respostas
            const { data: currentForm } = await supabase.from('forms').select('qtd_respostas').eq('id', form.id).single();
            await supabase.from('forms').update({ qtd_respostas: (currentForm?.qtd_respostas || 0) + 1 }).eq('id', form.id);

            setSubmitted(true);
            setLoading(false);
        }
    };

    if (loading && !submitted) return <LoadingScreen />;
    if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

    if (submitted) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg border-t-[10px] border-t-[#35b6cf] text-center max-w-md w-full animate-in zoom-in-95">
                <CheckCircle size={48} className="mx-auto text-[#35b6cf] mb-4" />
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Respostas Enviadas!</h1>
                <p className="text-slate-500 mb-6">Obrigado por sua colaboração.</p>
                <button onClick={() => window.close()} className="text-[#35b6cf] font-medium hover:underline">Fechar Página</button>
            </div>
        </div>
    );

    const FORM_WIDTH = "w-full max-w-[640px]";
    const currentQs = sections[currentSection] ? sections[currentSection].questions : [];
    const isLastSection = currentSection === sections.length - 1;

    return (
        <div className={`bg-slate-50 flex flex-col items-center font-sans px-3 sm:px-0 ${step !== 'form' ? 'h-screen justify-center' : 'min-h-screen pt-8 pb-10 justify-start'}`}>

            {/* PASSO 1: CAPA */}
            {step === 'cover' && (
                <div className={`${FORM_WIDTH} bg-white p-8 rounded-xl shadow-sm border border-slate-200 border-t-[8px] border-t-[#35b6cf]`}>
                    <h1 className="text-2xl font-bold mb-4">{form?.title}</h1>
                    <p className="text-slate-600 mb-8 whitespace-pre-wrap">{form?.description}</p>
                    <button onClick={() => setStep('cpf_check')} className="bg-[#35b6cf] text-white px-8 py-3 rounded-lg w-full font-bold hover:bg-[#2ca1b7] transition-all">
                        Começar
                    </button>
                    <div className="flex justify-center mt-6 opacity-50">
                        <img src={logo} alt="Logo" className="h-5" />
                    </div>
                </div>
            )}

            {/* PASSO 2: IDENTIFICAÇÃO */}
            {step === 'cpf_check' && (
                <div className={`${FORM_WIDTH} bg-white p-8 rounded-xl shadow-lg`}>
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 text-[#35b6cf] rounded-full flex items-center justify-center mx-auto mb-4">
                            <User size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Identificação</h2>
                    </div>

                    <div className="relative mb-4">
                        <Hash size={18} className="absolute left-3 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="CPF (apenas números)"
                            className={`w-full pl-10 pr-4 py-3 border ${cpfError ? 'border-red-300' : 'border-slate-200'} rounded-lg outline-none focus:border-[#35b6cf]`}
                            value={cpf}
                            onChange={e => {
                                setCpf(e.target.value);
                                setCpfError(null);
                            }}
                        />
                    </div>
                    {cpfError && <p className="text-red-500 text-sm mb-4">{cpfError}</p>}

                    <button onClick={handleCheckCPF} disabled={checkingCpf} className="bg-[#35b6cf] text-white w-full py-3 rounded-lg font-bold hover:bg-[#2ca1b7] disabled:opacity-50">
                        {checkingCpf ? 'Verificando...' : 'Continuar'}
                    </button>
                    <button onClick={() => setStep('cover')} className="w-full mt-4 text-slate-400 text-sm hover:text-slate-600">Voltar</button>
                </div>
            )}

            {/* PASSO 3: PERGUNTAS */}
            {step === 'form' && (
                <div className={`${FORM_WIDTH} space-y-4 animate-in slide-in-from-right-8 duration-500`}>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 border-t-[8px] border-t-[#35b6cf] p-6">
                        <h1 className="text-xl font-bold text-slate-800">{form?.title}</h1>
                        <div className="text-slate-500 text-sm mt-1">{sections[currentSection]?.title}</div>
                        {collaborator && (
                            <div className="mt-4 p-2 bg-slate-50 rounded text-sm text-slate-600 flex items-center gap-2">
                                <User size={14} /> {collaborator.nome}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {currentQs.map((q) => {
                            const optionsList = getOptions(q);
                            return (
                                <div key={q.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                                    <label className="block text-base font-medium text-slate-800 mb-4">
                                        {q.label} {q.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {/* Inputs Dinâmicos */}
                                    {q.question_type === 'short_text' && (
                                        <input
                                            type="text"
                                            className="w-full border-b border-slate-300 focus:border-[#35b6cf] outline-none py-2"
                                            placeholder="Sua resposta"
                                            value={answers[q.id!] || ''}
                                            onChange={(e) => handleAnswerChange(q.id!, e.target.value)}
                                        />
                                    )}

                                    {q.question_type === 'long_text' && (
                                        <textarea
                                            className="w-full border-b border-slate-300 focus:border-[#35b6cf] outline-none py-2 resize-none"
                                            placeholder="Sua resposta detalhada"
                                            rows={1}
                                            value={answers[q.id!] || ''}
                                            onChange={(e) => {
                                                handleAnswerChange(q.id!, e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                        />
                                    )}

                                    {q.question_type === 'select' && (
                                        <CustomSelect
                                            options={optionsList.map(opt => ({ label: opt, value: opt }))}
                                            value={answers[q.id!] || ''}
                                            onChange={(val: string) => handleAnswerChange(q.id!, val)}
                                        />
                                    )}

                                    {/* Suporte a Scale/Rating */}
                                    {(q.question_type === 'rating' || q.question_type === 'scale') && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {Array.from({ length: (q.max_value || 5) - (q.min_value || 1) + 1 }, (_, i) => (q.min_value || 1) + i).map((val) => (
                                                <div key={val} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleAnswerChange(q.id!, val)}>
                                                    <div className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${answers[q.id!] === val ? 'bg-[#35b6cf] text-white border-[#35b6cf]' : 'border-slate-300 hover:border-[#35b6cf]'}`}>
                                                        {val}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between py-6">
                        <button
                            onClick={() => currentSection > 0 && setCurrentSection(prev => prev - 1)}
                            disabled={currentSection === 0}
                            className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded disabled:opacity-30"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={isLastSection ? handleSubmit : handleNext}
                            className="bg-[#35b6cf] text-white px-6 py-2 rounded font-bold hover:bg-[#2ca1b7] shadow-sm"
                        >
                            {isLastSection ? 'Enviar' : 'Próxima'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};