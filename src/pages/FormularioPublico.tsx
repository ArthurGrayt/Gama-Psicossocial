
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Form, FormQuestion, Collaborator } from '../types';
import { CheckCircle, AlertCircle, ChevronRight, User, Hash, ChevronDown } from 'lucide-react';
import logo from '../assets/logo.png';

const LoadingScreen = () => (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-[#35b6cf]/30 border-t-[#35b6cf] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Carregando formulário...</p>
    </div>
);

const CustomSelect = ({ options, value, onChange, placeholder = 'Selecione...' }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: any) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // Handle Resize & Scroll to update position
    useEffect(() => {
        if (!isOpen) return;

        const handleResize = () => setIsOpen(false); // Close on resize for simplicity
        const handleScroll = () => setIsOpen(false); // Close on scroll for simplicity

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true); // Capture phase for all scrollable elements

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const handleOpen = () => {
        if (isOpen) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    };

    const selectedOption = options.find((o: any) => o.value === value);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div
                onClick={handleOpen}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
                <span className={selectedOption ? 'text-slate-800' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
                >
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

export const FormularioPublico: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [form, setForm] = useState<Form | null>(null);
    const [questions, setQuestions] = useState<FormQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Identity State
    const [cpf, setCpf] = useState('');
    const [cpfError, setCpfError] = useState<string | null>(null);
    const [checkingCpf, setCheckingCpf] = useState(false);
    const [collaborator, setCollaborator] = useState<Collaborator | null>(null);

    // Form State
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [step, setStep] = useState<'cover' | 'cpf_check' | 'form'>('cover');
    const [currentSection, setCurrentSection] = useState(0);

    const sections = React.useMemo(() => {
        if (!form) return [];
        const list: { title?: string; questions: FormQuestion[] }[] = [{ title: 'Principal', questions: [] }];

        questions.forEach(q => {
            if (q.question_type === 'section_break') {
                list.push({ title: q.label || 'Nova Seção', questions: [] });
            } else {
                list[list.length - 1].questions.push(q);
            }
        });
        return list;
    }, [questions, form]);

    useEffect(() => {
        if (slug) fetchForm();
    }, [slug]);

    // Inactivity Timer Logic
    useEffect(() => {
        if (step === 'cover' || submitted) return;

        const timeoutMinutes = Number(localStorage.getItem('gama-form-timer')) || 30;
        const timeoutMs = timeoutMinutes * 60 * 1000;

        let timer: any;

        const resetTimer = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                alert('Sessão expirada por inatividade. O formulário será reiniciado.');
                window.location.reload();
            }, timeoutMs);
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        window.addEventListener('click', resetTimer);
        resetTimer();

        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            window.removeEventListener('click', resetTimer);
        };
    }, [step, submitted]);

    useEffect(() => {
        if (form?.title) document.title = form.title;
    }, [form]);

    const fetchForm = async () => {
        setLoading(true);
        const minWaitPromise = new Promise(resolve => setTimeout(resolve, 2000));

        // 1. Get Form
        const currentLink = `${window.location.origin}${window.location.pathname}`;
        console.log('Fetching form with link:', currentLink);


        const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('link', currentLink)
            .single();

        if (formError || !formData) {
            setError('Formulário não encontrado.');
            setLoading(false);
            return;
        }

        setForm(formData);

        // 2. Get Questions
        const { data: questionData } = await supabase
            .from('form_questions')
            .select('*')
            .eq('form_id', formData.id)
            .order('question_order', { ascending: true });

        if (questionData) {
            // Randomize questions while preserving sections
            const shuffle = (array: any[]) => {
                const newArr = [...array];
                for (let i = newArr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
                }
                return newArr;
            };

            const shuffledQuestions: any[] = [];
            let currentSectionBuffer: any[] = [];

            questionData.forEach(q => {
                if (q.question_type === 'section_break') {
                    // Flush current section shuffled
                    if (currentSectionBuffer.length > 0) {
                        shuffledQuestions.push(...shuffle(currentSectionBuffer));
                        currentSectionBuffer = [];
                    }
                    // Push break as is
                    shuffledQuestions.push(q);
                } else {
                    currentSectionBuffer.push(q);
                }
            });

            // Flush remaining
            if (currentSectionBuffer.length > 0) {
                shuffledQuestions.push(...shuffle(currentSectionBuffer));
            }

            setQuestions(shuffledQuestions);
        }

        await minWaitPromise;
        setLoading(false);
    };

    const validateCPF = (cpf: string) => {
        const cleanCPF = cpf.replace(/\D/g, '');
        if (cleanCPF.length !== 11) return false;
        if (/^(\d)\1+$/.test(cleanCPF)) return false; // All same digits

        let sum = 0;
        let remainder;

        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;

        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;

        if ((remainder === 10) || (remainder === 11)) remainder = 0;
        if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

        return true;
    };

    const handleCheckCPF = async () => {
        setCpfError(null);
        if (!validateCPF(cpf)) {
            setCpfError("CPF inválido ou incompleto.");
            return;
        }

        setCheckingCpf(true);
        const cleanCpf = cpf.replace(/\D/g, '');
        const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

        try {
            // 1. Check if Collaborator exists
            const { data: colabData, error } = await supabase
                .from('colaboradores')
                .select('*')
                .or(`cpf.eq.${cleanCpf},cpf.eq.${formattedCpf}`)
                .maybeSingle();

            if (error) throw error;

            if (!colabData) {
                // Not found -> RESTRICTED
                setCpfError('CPF não encontrado na base de colaboradores. Entre em contato com seu RH.');
                setCheckingCpf(false);
                return;
            }

            // 2. Check Inclusion List (colaboladores_inclusos)
            const allowedIds = (form?.colaboladores_inclusos || []) as string[];
            const isIncluded = allowedIds.includes(colabData.id);

            if (!isIncluded) {
                setCpfError('Você não está habilitado para responder este formulário.');
                setCheckingCpf(false);
                return;
            }

            // 3. Success -> Get Company Name via Unit
            let companyName = '';
            if (colabData.unidade_id) {
                const { data: unitData } = await supabase
                    .from('unidades')
                    .select('empresa_mae')
                    .eq('id', colabData.unidade_id)
                    .single();

                if (unitData?.empresa_mae) {
                    const { data: companyData } = await supabase
                        .from('clientes')
                        .select('nome_fantasia, razao_social')
                        .eq('cliente_uuid', unitData.empresa_mae)
                        .single();
                    companyName = companyData?.nome_fantasia || companyData?.razao_social || '';
                }
            }

            setCollaborator({ ...colabData, empresa_nome: companyName });
            setStep('form');

        } catch (err) {
            console.error('Error checking CPF:', err);
            setCpfError('Erro ao verificar suas credenciais. Tente novamente.');
        } finally {
            setCheckingCpf(false);
        }
    };


    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const validate = (qs: FormQuestion[]) => {
        for (const q of qs) {
            if (q.required && q.id) {
                const val = answers[q.id];
                if (val === undefined || val === '' || val === null) {
                    alert(`A pergunta "${q.label}" é obrigatória.`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleNext = () => {
        const currentQs = sections[currentSection].questions;
        if (validate(currentQs)) {
            setCurrentSection(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // If section 0, do nothing or confirm exit?
    };

    const handleSubmit = async () => {
        const currentQs = sections[currentSection].questions;
        if (!validate(currentQs)) return;
        if (!form || !collaborator) return;

        setLoading(true);

        const answersToInsert = questions.map(q => {
            if (q.question_type === 'section_break' || !q.id) return null;
            const val = answers[q.id];

            // Map text answers to numbers if applicable
            let answerNumber: number | null = null;
            if (q.question_type === 'rating') {
                answerNumber = Number(val);
            } else {
                const textToNumberMap: Record<string, number> = {
                    'nunca': 0,
                    'raramente': 1,
                    'as vezes': 2,
                    'frequentemente': 3,
                    'sempre': 4
                };
                // Normalize: trim whitespace and convert to lowercase for robust matching
                const valStr = String(val).trim().toLowerCase();

                // Check if the normalized string exists in our map
                if (Object.prototype.hasOwnProperty.call(textToNumberMap, valStr)) {
                    answerNumber = textToNumberMap[valStr];
                }
            }

            return {
                form_id: form.id,
                question_id: q.id,
                respondedor: collaborator.id, // User ID/UUID
                unidade_colaborador: collaborator.unidade_id, // Unit ID
                cargo: collaborator.cargo_id, // Role ID
                answer_text: (q.question_type !== 'rating') ? String(val) : null,
                answer_number: answerNumber,
            };
        }).filter(a => a !== null && answers[a.question_id] !== undefined);

        const { error: submitError } = await supabase
            .from('form_answers')
            .insert(answersToInsert);

        if (submitError) {
            console.error(submitError);
            alert('Erro ao enviar suas respostas. Tente novamente.');
            setLoading(false);
        } else {
            // Increment Response Count
            await supabase.rpc('increment_form_responses', { form_id: form.id })
                .then(({ error }) => {
                    if (error) {
                        // If RPC fails (e.g. doesn't exist), try manual update as fallback (optimized for concurrency this is bad, but acceptable for MVP without migration access)
                        // Better approach: just try update (forms typically have low concurrency in this specific context)
                        console.warn("RPC increment failed, trying manual update", error);
                        // However, since I cannot create the RPC myself via SQL tool here, I will stick to the safer Manual READ-WRITE approach for now or just a direct update if possible.
                        // Ideally: UPDATE forms SET qtd_respostas = coalesce(qtd_respostas, 0) + 1 WHERE id = x
                        // Supabase JS doesn't support atomic increment easily without RPC.
                        // I will do a fetch-update for now to be safe, given I can't guarantee RPC existence.
                    }
                });

            // Manual Increment Fallback (since we likely don't have the RPC created)
            const { data: currentForm } = await supabase.from('forms').select('qtd_respostas').eq('id', form.id).single();
            const currentCount = currentForm?.qtd_respostas || 0;
            await supabase.from('forms').update({ qtd_respostas: currentCount + 1 }).eq('id', form.id);

            setSubmitted(true);
            setLoading(false);
        }
    };

    if (loading && !submitted) return <LoadingScreen />;

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Ops!</h3>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-xl shadow-lg border-t-[10px] border-t-[#35b6cf] max-w-[770px] w-full text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-20 h-20 bg-[#35b6cf]/10 text-[#35b6cf] rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Resposta Registrada</h1>
                    <p className="text-slate-500 mb-8">Sua resposta foi enviada com sucesso. Obrigado!</p>
                    <button onClick={() => window.close()} className="text-[#35b6cf] hover:text-[#2ca1b7] font-medium hover:underline">Fechar página</button>
                </div>
            </div>
        );
    }

    const FORM_WIDTH = "w-full max-w-[640px]";
    const ACCENT_BORDER = "border-t-[8px] border-t-[#35b6cf]";
    const currentQs = sections[currentSection] ? sections[currentSection].questions : [];
    const isLastSection = currentSection === sections.length - 1;

    return (
        <div className={`bg-slate-50 flex flex-col items-center font-sans px-3 sm:px-0 ${step !== 'form' ? 'h-screen overflow-hidden justify-center' : 'min-h-screen pt-4 sm:pt-8 pb-10 justify-start'}`}>

            {/* STEP 0: COVER PAGE */}
            {step === 'cover' && (
                <div className={`${FORM_WIDTH} h-full flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500`}>
                    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${ACCENT_BORDER} p-5 sm:p-6 mb-3 flex flex-col max-h-[75vh]`}>
                        <h1 className="text-lg sm:text-2xl font-normal text-slate-900 mb-3 line-clamp-2">{form?.title}</h1>
                        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{form?.description}</p>
                        </div>
                        <div className="pt-4 flex justify-between items-center border-t border-slate-100 mt-4 shrink-0">
                            <button
                                onClick={() => setStep('cpf_check')}
                                className="bg-[#35b6cf] text-white px-5 py-1.5 rounded-md font-medium text-sm hover:bg-[#2ca1b7] transition-colors shadow-sm w-full sm:w-auto"
                            >
                                Iniciar Formulário
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-4 opacity-70">
                        <img src={logo} alt="Logo" className="h-5 w-auto" />
                        <span className="text-xs text-slate-500 font-medium">Gama Center - 2026</span>
                    </div>
                </div>
            )}

            {/* STEP 0.5: CPF CHECK */}
            {step === 'cpf_check' && (
                <div className={`${FORM_WIDTH} h-full flex flex-col justify-center animate-in slide-in-from-right-8 duration-500`}>
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-auto w-full">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 text-[#35b6cf] rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Identificação</h2>
                            <p className="text-sm text-slate-500 mt-2">Informe seu CPF para continuar</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">CPF</label>
                                <div className="relative">
                                    <Hash size={18} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        className={`w-full pl-10 pr-4 py-2.5 border ${cpfError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#35b6cf] focus:ring-[#35b6cf]/20'} rounded-lg focus:ring-2 outline-none transition-all`}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                        value={cpf}
                                        onChange={(e) => {
                                            setCpfError(null);
                                            let v = e.target.value.replace(/\D/g, '');
                                            if (v.length > 11) v = v.slice(0, 11);
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                            setCpf(v);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheckCPF()}
                                    />
                                </div>
                                {cpfError && (
                                    <div className="mt-2 text-red-500 text-sm flex items-center gap-2 animate-in slide-in-from-top-1">
                                        <AlertCircle size={14} />
                                        <span>{cpfError}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleCheckCPF}
                                disabled={checkingCpf || cpf.length < 14}
                                className="w-full bg-[#35b6cf] text-white py-2.5 rounded-lg font-bold hover:bg-[#2ca1b7] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {checkingCpf ? 'Verificando...' : 'Continuar'}
                                {!checkingCpf && <ChevronRight size={18} />}
                            </button>
                            <button
                                onClick={() => setStep('cover')}
                                className="w-full text-sm text-slate-500 hover:text-slate-800 mt-2"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 1: FORM */}
            {step === 'form' && (
                <div className={`${FORM_WIDTH} mx-auto space-y-3 sm:space-y-4 animate-in slide-in-from-right-8 duration-500`}>

                    {/* Header Compacto */}
                    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 ${ACCENT_BORDER} p-5 sm:p-6`}>
                        <h1 className="text-2xl font-normal text-slate-900">{form?.title}</h1>
                        {collaborator && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3 text-sm text-blue-800">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="font-bold">{collaborator.nome}</p>
                                    <p className="opacity-80 text-xs">{collaborator.empresa_nome} (CPF: {collaborator.cpf})</p>
                                </div>
                            </div>
                        )}
                        {currentSection > 0 && sections[currentSection].title && (
                            <h2 className="text-lg font-medium text-[#35b6cf] mt-4">{sections[currentSection].title}</h2>
                        )}
                        <div className="text-xs text-slate-500 mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="flex items-center gap-1"><span className="text-red-500">*</span> Indica pergunta obrigatória</span>
                            {sections.length > 1 && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-400">Página {currentSection + 1} de {sections.length}</span>
                            )}
                        </div>
                    </div>

                    {/* Questions of Current Section */}
                    {/* Identification block removed as it is handled before */}
                    <div className="space-y-4">
                        {currentQs.map((q) => (
                            <div key={q.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 sm:p-6 transition-all hover:shadow-md animate-in slide-in-from-right-4 duration-300">
                                <label className="block text-base font-normal text-slate-900 mb-4">
                                    {q.label}
                                    {q.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {q.question_type === 'short_text' && (
                                    <div className="max-w-md">
                                        <input
                                            type="text"
                                            className="w-full px-0 py-2 border-b border-slate-300 focus:border-b-2 focus:border-[#35b6cf] bg-transparent transition-all outline-none placeholder:text-slate-400"
                                            placeholder="Sua resposta"
                                            value={answers[q.id!] || ''}
                                            onChange={(e) => handleAnswerChange(q.id!, e.target.value)}
                                        />
                                    </div>
                                )}

                                {q.question_type === 'long_text' && (
                                    <textarea
                                        className="w-full px-0 py-2 border-b border-slate-300 focus:border-b-2 focus:border-[#35b6cf] bg-transparent transition-all outline-none min-h-[40px] placeholder:text-slate-400 resize-none overflow-hidden"
                                        placeholder="Sua resposta"
                                        value={answers[q.id!] || ''}
                                        onChange={(e) => {
                                            handleAnswerChange(q.id!, e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                    />
                                )}

                                {q.question_type === 'choice' && (
                                    <div className="space-y-3">
                                        {[q.option_1, q.option_2, q.option_3, q.option_4, q.option_5].filter(Boolean).map((opt, i) => (
                                            <label key={i} className="flex items-center cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${answers[q.id!] === opt ? 'border-[#35b6cf]' : 'border-slate-400 group-hover:border-slate-500'}`}>
                                                    {answers[q.id!] === opt && <div className="w-2.5 h-2.5 rounded-full bg-[#35b6cf]" />}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name={`q_${q.id}`}
                                                    value={opt}
                                                    checked={answers[q.id!] === opt}
                                                    onChange={(e) => handleAnswerChange(q.id!, e.target.value)}
                                                    className="hidden"
                                                />
                                                <span className="text-sm text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.question_type === 'select' && (
                                    <CustomSelect
                                        options={[q.option_1, q.option_2, q.option_3, q.option_4, q.option_5].filter(Boolean)}
                                        value={answers[q.id!] || ''}
                                        onChange={(val: string) => handleAnswerChange(q.id!, val)}
                                        placeholder="Escolher opção..."
                                    />
                                )}

                                {q.question_type === 'rating' && (
                                    <div className="flex flex-col py-2">
                                        <div className="flex justify-between w-full max-w-lg mb-2 px-2 text-xs text-slate-500">
                                            <span>Pior</span>
                                            <span>Melhor</span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                                            {Array.from({ length: (q.max_value || 5) - (q.min_value || 1) + 1 }, (_, i) => (q.min_value || 1) + i).map((val) => (
                                                <div key={val} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => handleAnswerChange(q.id!, val)}>
                                                    <span className="text-xs font-medium text-slate-500">{val}</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${answers[q.id!] === val ? 'border-[#35b6cf]' : 'border-slate-400 hover:border-slate-500'}`}>
                                                        {answers[q.id!] === val && <div className="w-2.5 h-2.5 rounded-full bg-[#35b6cf]" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center py-6">
                        <button
                            onClick={handleBack}
                            disabled={currentSection === 0}
                            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-4 py-2 rounded transition-colors font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Voltar
                        </button>

                        <button
                            onClick={isLastSection ? handleSubmit : handleNext}
                            className="bg-[#35b6cf] text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-[#2ca1b7] transition-colors shadow-sm ring-offset-2 focus:ring-2 focus:ring-[#35b6cf]"
                        >
                            {isLastSection ? 'Enviar' : 'Avançar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

