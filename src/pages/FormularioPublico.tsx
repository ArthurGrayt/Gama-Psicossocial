import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Form, FormQuestion, Collaborator } from '../types';
import { CheckCircle, User, Hash, ChevronDown, FileText } from 'lucide-react';
import logo from '../assets/logo.png';

// --- Componentes Visuais ---

const LoadingScreen = () => (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-[#35b6cf]/30 border-t-[#35b6cf] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Carregando formulário...</p>
    </div>
);


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
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Filtragem de questões (remove section_breaks para exibição linear)
    const validQuestions = useMemo(() => {
        return questions.filter(q => q.question_type !== 'section_break');
    }, [questions]);

    useEffect(() => {
        console.log(`[FORM ACCESS] Questions state updated: ${questions.length} items`);
    }, [questions]);

    useEffect(() => {
        if (slug) fetchForm();
    }, [slug]);

    useEffect(() => {
        if (form?.title) document.title = form.title;
    }, [form]);

    const fetchForm = async () => {
        setLoading(true);
        setError(null);
        console.log(`[FORM ACCESS v3] Fetching form and questions in parallel for slug: "${slug}"`);

        try {
            if (!slug) throw new Error('Link inválido: ID do formulário não fornecido.');

            // Parallel Execution: Fetch form and all questions library simultaneously
            const [formResult, questionsResult] = await Promise.all([
                supabase
                    .from('forms')
                    .select('*')
                    .ilike('link', `%${slug}%`)
                    .maybeSingle(),
                supabase
                    .from('form_questions')
                    .select('*')
                    .order('question_order', { ascending: true })
            ]);

            // Handle Form Result
            if (formResult.error) throw formResult.error;
            if (!formResult.data) {
                setError('Formulário não encontrado. Verifique se o link está correto.');
                return;
            }
            setForm(formResult.data);

            // Handle Questions Result
            if (questionsResult.error) {
                console.error('[FORM ACCESS] Error fetching questions:', questionsResult.error);
                // We show an error but maybe we could show the form cover first? 
                // However, without questions, the form is unusable.
                throw new Error('Erro ao carregar perguntas.');
            }
            setQuestions(questionsResult.data || []);

        } catch (err: any) {
            if (err.name === 'AbortError' || err.message?.includes('AbortError')) return;
            console.error('Erro geral ao carregar formulário:', err);
            setError(err.message || 'Erro ao carregar formulário.');
        } finally {
            setLoading(false);
        }
    };

    // --- Lógica de CPF ---
    const handleCheckCPF = async () => {
        setCpfError(null);
        // Clean input: remove dots, dashes and other non-numeric characters
        const cleanCpf = cpf.replace(/\D/g, '');

        if (cleanCpf.length !== 11) {
            setCpfError("CPF inválido (deve ter 11 números).");
            return;
        }

        setCheckingCpf(true);
        try {
            // Formatted version with dots and dashes
            const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

            console.log(`[CPF DEBUG] Searching for CPF: ${cleanCpf} or ${formattedCpf}`);

            const { data: colabData, error: colabError } = await supabase
                .from('colaboradores')
                .select('*')
                .or(`cpf.eq.${cleanCpf},cpf.eq.${formattedCpf}`)
                .maybeSingle();

            if (colabError) {
                console.error("[CPF DEBUG] database error:", colabError);
                throw colabError;
            }

            if (!colabData) {
                console.warn(`[CPF DEBUG] Collaborator not found for CPF: ${cleanCpf}`);
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
            setCurrentQuestionIndex(0); // Garante que comece do início
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

    const validateQuestion = (q: FormQuestion) => {
        if (q.required && q.id) {
            const val = answers[q.id];
            if (val === undefined || val === '' || val === null) {
                alert(`Por favor, responda a esta pergunta.`);
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        const q = validQuestions[currentQuestionIndex];
        if (!q) return;

        if (validateQuestion(q)) {
            if (currentQuestionIndex < validQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setStep('cpf_check');
        }
    };

    // --- ENVIO DAS RESPOSTAS (Ajustado para seu Schema) ---
    const handleSubmit = async () => {
        const lastQ = validQuestions[currentQuestionIndex];
        if (!validateQuestion(lastQ)) return;
        if (!form || !collaborator) return;

        setLoading(true);

        // Mapeia respostas para o formato da tabela 'form_answers'
        const answersToInsert = validQuestions.map(q => {
            if (!q.id) return null;

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
            if (q.question_type === 'select' || q.question_type === 'short_text' || q.question_type === 'long_text' || q.question_type === 'choice') {
                answerNumber = null;
                answerText = String(rawValue);

                // LOGICA DE SCORE PARA SELECT/CHOICE
                // Se for select/choice, tentamos achar o indice da resposta nas 5 opções
                if (q.question_type === 'select' || q.question_type === 'choice') {
                    const opts = getOptions(q);
                    const idx = opts.findIndex(opt => opt === rawValue);
                    if (idx !== -1) {
                        answerNumber = idx + 1; // 1-based index (Option 1 -> 1, Option 2 -> 2...)
                    }
                }
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
            // Incrementa contador de respondentes (+1 na coluna respondentes)
            const { data: currentForm } = await supabase.from('forms').select('respondentes').eq('id', form.id).single();
            await supabase.from('forms').update({ respondentes: (currentForm?.respondentes || 0) + 1 }).eq('id', form.id);

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

    const FORM_WIDTH = "w-full max-w-[800px]";

    return (
        <div className="bg-slate-50 h-screen h-[100dvh] overflow-hidden flex flex-col font-sans">
            {/* NOVO CABEÇALHO FIXO PREMIUM COM TÍTULO E DESCRIÇÃO - HIDDEN ON COVER */}
            {step !== 'cover' && (
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 shrink-0 z-50 shadow-sm relative animate-in fade-in duration-500">
                    <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src={logo} alt="Logo" className="h-6 sm:h-8" />
                            <div className="h-6 w-px bg-slate-200"></div>
                            <div className="flex flex-col">
                                <h2 className="text-slate-800 font-black text-sm sm:text-base truncate max-w-[300px] sm:max-w-[600px]">
                                    {form?.title}
                                </h2>
                                <p className="text-slate-400 text-[10px] sm:text-xs font-medium line-clamp-1 max-w-[300px] sm:max-w-[800px]">
                                    {form?.description}
                                </p>
                            </div>
                        </div>

                        {step === 'form' && (
                            <div className="flex items-center gap-3">
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden md:block">
                                    Progresso
                                </div>
                                <div className="w-20 sm:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-100">
                                    <div
                                        className="h-full bg-[#35b6cf] transition-all duration-500 ease-out"
                                        style={{ width: `${Math.round(((currentQuestionIndex + 1) / validQuestions.length) * 100)}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] sm:text-xs font-black text-[#35b6cf] tabular-nums">
                                    {currentQuestionIndex + 1}/{validQuestions.length}
                                </span>
                            </div>
                        )}
                    </div>
                </header>
            )}

            <main className="flex-1 overflow-y-auto w-full flex flex-col items-center custom-scrollbar">
                <div className="w-full max-w-[800px] px-4 pt-10 sm:pt-16 pb-20">
                    <div className="w-full flex flex-col items-center justify-center">
                        {/* DEBUG BADGE */}
                        <div className="fixed bottom-2 right-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full z-[9999] opacity-50 font-mono">
                            FP_V2_FIX
                        </div>
                        {/* PASSO 1: CAPA REFINADA */}
                        {step === 'cover' && (
                            <>
                                <div className="w-full bg-white rounded-xl shadow-xl border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-500 overflow-hidden border-t-[8px] border-t-[#35b6cf]">
                                    <div className="p-8 sm:p-12">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8 leading-tight">
                                            {form?.title}
                                        </h1>

                                        <div className="space-y-6 text-slate-600 text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-10 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                            {form?.description}
                                        </div>

                                        <div className="pt-8 border-t border-slate-100">
                                            <button
                                                onClick={() => setStep('cpf_check')}
                                                className="bg-[#35b6cf] text-white px-8 py-3.5 rounded-xl font-bold text-base hover:bg-[#2ca3bc] transition-all shadow-sm active:scale-[0.98] flex items-center gap-2"
                                            >
                                                Iniciar Formulário
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center mt-6 opacity-30">
                                    <img src={logo} alt="Logo" className="h-5" />
                                </div>
                            </>
                        )}

                        {/* PASSO 2: IDENTIFICAÇÃO */}
                        {step === 'cpf_check' && (
                            <div className={`${FORM_WIDTH} bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-100 animate-in slide-in-from-bottom-8 duration-500`}>
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cyan-50 text-[#35b6cf] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <User className="size-8 sm:size-10" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-800">Identificação</h2>
                                    <p className="text-slate-500 mt-2 text-sm sm:text-base">Informe seu CPF cadastrado para continuar.</p>
                                </div>

                                <div className="relative mb-6">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Hash size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="000.000.000-00"
                                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 ${cpfError ? 'border-red-300 bg-red-50' : 'border-slate-100 focus:border-[#35b6cf]'} rounded-2xl outline-none transition-all text-lg font-bold tracking-wider sm:text-xl`}
                                        value={cpf}
                                        onChange={e => {
                                            setCpf(e.target.value);
                                            setCpfError(null);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheckCPF()}
                                    />
                                </div>
                                {cpfError && (
                                    <div className="flex items-center gap-2 text-red-500 text-sm mb-6 bg-red-50 p-3 rounded-lg border border-red-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        {cpfError}
                                    </div>
                                )}

                                <button
                                    onClick={handleCheckCPF}
                                    disabled={checkingCpf}
                                    className="bg-[#35b6cf] text-white w-full py-5 rounded-2xl font-black text-lg hover:bg-[#2ca1b7] disabled:opacity-50 shadow-lg shadow-cyan-200/50 hover:shadow-cyan-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {checkingCpf ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Verificando...
                                        </>
                                    ) : 'ACESSAR AGORA'}
                                </button>
                                <button onClick={() => setStep('cover')} className="w-full mt-6 text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors uppercase tracking-widest">Voltar para Início</button>
                            </div>
                        )}
                        {step === 'form' && validQuestions.length > 0 && (
                            <div className={`${FORM_WIDTH} flex flex-col gap-6 animate-in fade-in duration-700`}>
                                {/* Header da Pergunta (Opcional se já tem o fixo, mas mantendo para contexto local) */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hidden sm:block">
                                    <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[#35b6cf] uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14} /> Levantamento Ativo
                                        </span>
                                        {collaborator && (
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Colaborador: <span className="text-slate-600">{collaborator.nome}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Questão Única */}
                                {(() => {
                                    const q = validQuestions[currentQuestionIndex];
                                    const optionsList = getOptions(q);
                                    const currentVal = answers[q.id!];

                                    return (
                                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-12 hover:border-[#35b6cf]/30 transition-all duration-300">
                                            <label className="block text-xl sm:text-2xl font-black text-slate-800 mb-8 sm:mb-10 leading-relaxed text-center">
                                                {q.label} {q.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>

                                            {/* SHORT TEXT */}
                                            {q.question_type === 'short_text' && (
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        className="w-full border-b-4 border-slate-100 focus:border-[#35b6cf] outline-none py-4 text-2xl bg-transparent transition-all placeholder:text-slate-200 font-bold"
                                                        placeholder="Sua resposta..."
                                                        value={currentVal || ''}
                                                        onChange={(e) => handleAnswerChange(q.id!, e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            {/* LONG TEXT */}
                                            {q.question_type === 'long_text' && (
                                                <textarea
                                                    className="w-full border-2 border-slate-100 bg-slate-50/30 rounded-2xl focus:border-[#35b6cf] focus:bg-white outline-none p-6 text-xl resize-none transition-all placeholder:text-slate-300 font-medium"
                                                    placeholder="Descreva sua resposta detalhadamente..."
                                                    rows={4}
                                                    value={currentVal || ''}
                                                    onChange={(e) => handleAnswerChange(q.id!, e.target.value)}
                                                />
                                            )}

                                            {/* SELECT (SIDE-BY-SIDE ON DESKTOP) */}
                                            {(q.question_type === 'select' || q.question_type === 'choice') && (
                                                <div className="flex flex-col sm:flex-row sm:flex-nowrap justify-center gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
                                                    {optionsList.map((opt, oIdx) => {
                                                        const isSelected = currentVal === opt;
                                                        return (
                                                            <div
                                                                key={oIdx}
                                                                onClick={() => handleAnswerChange(q.id!, opt)}
                                                                className={`group/option flex-1 min-w-full sm:min-w-0 flex flex-row sm:flex-col items-center gap-4 sm:gap-6 p-5 sm:p-8 rounded-[24px] border-2 cursor-pointer transition-all duration-300 ${isSelected
                                                                    ? 'border-[#35b6cf] bg-cyan-50/50 shadow-xl shadow-cyan-100/50 transform scale-[1.02]'
                                                                    : 'border-slate-100 bg-white hover:border-[#35b6cf]/30 hover:bg-slate-50/50 hover:shadow-lg hover:shadow-slate-100'
                                                                    }`}
                                                            >
                                                                <div className={`shrink-0 w-6 h-6 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected
                                                                    ? 'border-[#35b6cf] bg-[#35b6cf] ring-4 ring-cyan-100'
                                                                    : 'border-slate-200 bg-white group-hover/option:border-[#35b6cf]/50'
                                                                    }`}>
                                                                    {isSelected && <div className="w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-full bg-white animate-in zoom-in-50 duration-300"></div>}
                                                                </div>
                                                                <span className={`text-sm sm:text-base font-bold text-left sm:text-center leading-tight tracking-tight transition-colors duration-300 ${isSelected ? 'text-[#086a82]' : 'text-slate-600 group-hover/option:text-slate-900'}`}>
                                                                    {opt}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* RATING / SCALE */}
                                            {(q.question_type === 'rating' || q.question_type === 'scale') && (
                                                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                                                    {Array.from({ length: (q.max_value || 5) - (q.min_value || 1) + 1 }, (_, i) => (q.min_value || 1) + i).map((val) => {
                                                        const isSelected = currentVal === val;
                                                        return (
                                                            <button
                                                                key={val}
                                                                onClick={() => handleAnswerChange(q.id!, val)}
                                                                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-2 font-black text-lg sm:text-xl flex items-center justify-center transition-all ${isSelected
                                                                    ? 'bg-[#35b6cf] text-white border-[#35b6cf] shadow-xl scale-110'
                                                                    : 'bg-white text-slate-300 border-slate-100 hover:border-[#35b6cf] hover:text-[#35b6cf]'
                                                                    }`}
                                                            >
                                                                {val}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Navegação Inferior */}
                                <div className="flex items-center justify-between pt-6 sm:pt-8">
                                    {currentQuestionIndex === 0 ? (
                                        <button
                                            onClick={handleBack}
                                            className="flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all text-sm sm:text-base"
                                        >
                                            <ChevronDown className="rotate-90" size={18} />
                                            Voltar
                                        </button>
                                    ) : (
                                        <div></div>
                                    )}

                                    <button
                                        onClick={handleNext}
                                        className={`flex items-center gap-2 sm:gap-3 px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl transition-all shadow-xl hover:shadow-[#35b6cf]/20 active:scale-95 ${currentQuestionIndex === validQuestions.length - 1
                                            ? 'bg-[#35b6cf] text-white hover:bg-[#2ca1b7]'
                                            : 'bg-slate-800 text-white hover:bg-slate-900'
                                            }`}
                                    >
                                        {currentQuestionIndex === validQuestions.length - 1 ? 'Finalizar' : 'Próxima'}
                                        {currentQuestionIndex < validQuestions.length - 1 && <ChevronDown className="-rotate-90 size-5 sm:size-6" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
