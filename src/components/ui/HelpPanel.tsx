// Importações necessárias do React, ícones do Lucide e cliente do Supabase
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    X,          // Ícone de fechar
    Search,     // Ícone de busca
    ChevronDown,// Ícone de seta do dropdown
    ChevronUp,  // Ícone de seta para cima
    Upload,     // Ícone de upload de imagem
    BookOpen,   // Ícone do manual
    LogIn,      // Ícone de login
    Building2,  // Ícone de empresa
    Users,      // Ícone de colaboradores
    ClipboardList, // Ícone de formulários
    BarChart3,  // Ícone de relatórios
    UserCog,    // Ícone de perfil
    Coins,      // Ícone de tokens
    Loader2,    // Ícone de carregamento
} from 'lucide-react';
import { supabase } from '../../services/supabase'; // Cliente do Supabase

// ─────────────────────────────────────────────
// TIPOS E INTERFACES
// ─────────────────────────────────────────────

// Propriedades aceitas pelo componente HelpPanel
interface HelpPanelProps {
    isOpen: boolean;       // Controla se o painel está visível
    onClose: () => void;   // Callback chamado ao fechar o painel
}

// Estrutura de uma imagem no banco de dados (dentro do JSONB)
interface ImageField {
    id: string;    // Identificador único do campo
    label: string; // Legenda descritiva
    url?: string | null; // URL da imagem no Storage
}

// Estrutura do conteúdo vindo do Supabase
interface HelpRecord {
    id: string;
    type: 'tutorial' | 'faq';
    title: string;
    icon?: string;
    content: {
        paragraphs?: string[];
        images?: ImageField[];
        answer?: string;
    };
    order_index: number;
    parent_id?: string | null;
}

// Mapeamento de nomes de ícones para componentes Lucide
const ICON_MAP: Record<string, React.ReactNode> = {
    'LogIn': <LogIn size={18} />,
    'Building2': <Building2 size={18} />,
    'Users': <Users size={18} />,
    'ClipboardList': <ClipboardList size={18} />,
    'BarChart3': <BarChart3 size={18} />,
    'UserCog': <UserCog size={18} />,
    'Coins': <Coins size={18} />,
    'BookOpen': <BookOpen size={18} />,
};

// ─────────────────────────────────────────────
// SUBCOMPONENTS
// ─────────────────────────────────────────────

// Componente para renderizar campos de upload de imagem vinculados ao Supabase
const ImageUploadField: React.FC<{
    recordId: string;
    field: ImageField;
    isAdmin: boolean; // Controla se o usuário tem permissão para editar
    onUploadSuccess: (newUrl: string) => void;
    onExpand: (url: string) => void; // Abre a imagem no Lightbox
}> = ({ recordId, field, isAdmin, onUploadSuccess, onExpand }) => {
    // Estado de carregamento do upload
    const [isUploading, setIsUploading] = useState(false);

    // Referência ao input de arquivo oculto
    const inputRef = useRef<HTMLInputElement>(null);

    // Função de upload para o bucket "data"
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin) return;

        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${recordId}_${field.id}_${Date.now()}.${fileExt}`;
            const filePath = `tutorial/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('data')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('data')
                .getPublicUrl(filePath);

            const { data: current, error: fetchError } = await supabase
                .from('help_content')
                .select('content')
                .eq('id', recordId)
                .single();

            if (fetchError) throw fetchError;

            const updatedImages = (current.content.images || []).map((img: ImageField) =>
                img.id === field.id ? { ...img, url: publicUrl } : img
            );

            const { error: updateError } = await supabase
                .from('help_content')
                .update({ content: { ...current.content, images: updatedImages } })
                .eq('id', recordId);

            if (updateError) throw updateError;

            onUploadSuccess(publicUrl);
        } catch (error) {
            console.error("Erro no upload:", error);
            alert("Falha ao enviar imagem.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div
            className={`mt-3 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden transition-colors group relative aspect-square ${isAdmin ? 'cursor-pointer hover:border-[#0f978e]/50' : 'cursor-default'}`}
            onClick={() => {
                if (isAdmin && !isUploading) {
                    inputRef.current?.click();
                } else if (!isAdmin && field.url) {
                    onExpand(field.url);
                }
            }}
        >
            {isAdmin && (
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
            )}

            {isUploading && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center flex-col gap-2">
                    <Loader2 className="animate-spin text-[#0f978e]" size={24} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center px-4">Enviando...</span>
                </div>
            )}

            {field.url ? (
                // Fundo cinza médio para destacar imagens brancas
                <div className="relative w-full h-full bg-slate-200/60">
                    <img
                        src={field.url}
                        alt={field.label}
                        className="w-full h-full object-contain p-2"
                    />

                    {isAdmin && (
                        <button
                            className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-slate-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#0f978e]"
                            onClick={(e) => {
                                e.stopPropagation();
                                onExpand(field.url!);
                            }}
                        >
                            <Search size={14} />
                        </button>
                    )}

                    {isAdmin && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-[2px] py-2 text-white text-[10px] font-bold uppercase tracking-tighter text-center translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center gap-1.5">
                            <Upload size={12} />
                            Trocar Imagem
                        </div>
                    )}

                    {!isAdmin && (
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-zoom-in">
                            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-xl text-slate-800 flex items-center gap-2 scale-90 group-hover:scale-100 transition-transform">
                                <Search size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Ver Detalhes</span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 group-hover:text-[#0f978e] transition-colors p-6 bg-slate-100/30">
                    <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-[#0f978e]/10 flex items-center justify-center transition-colors shadow-sm border border-slate-200">
                        <Upload size={22} />
                    </div>
                    <div className="text-center">
                        <p className="text-[11px] font-bold uppercase tracking-tight leading-tight px-4 text-slate-600">{field.label}</p>
                        {isAdmin && <p className="text-[9px] mt-1.5 text-slate-400 font-medium">Clique para fazer upload</p>}
                        {!isAdmin && <p className="text-[9px] mt-1.5 text-slate-400 font-medium italic">Imagem pendente</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL: HelpPanel
// ─────────────────────────────────────────────

export const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
    // Estados para os dados vindos do Supabase
    const [sections, setSections] = useState<HelpRecord[]>([]);
    const [faqs, setFaqs] = useState<HelpRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    // Estados de UI
    const [searchQuery, setSearchQuery] = useState('');
    const [openFaqIndex, setOpenFaqIndex] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<string>('primeiros-passos');
    const [expandedImage, setExpandedImage] = useState<string | null>(null); // Estado para o Ligthbox

    // Referências
    const contentRef = useRef<HTMLDivElement>(null);

    // Define se o usuário é o administrador permitido
    const isAdmin = currentUserEmail === 'arthurgrayy@gmail.com';

    // Busca usuário separadamente para não bloquear o manual
    useEffect(() => {
        const getAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserEmail(user?.email || null);
        };
        getAuth();
    }, []);

    // Busca dados no Supabase
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('help_content')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) {
                // Se for um AbortError, não tratamos como erro crítico
                if (error.message?.includes('AbortError')) return;
                throw error;
            }

            if (data) {
                setSections(data.filter((r: HelpRecord) => r.type === 'tutorial'));
                setFaqs(data.filter((r: HelpRecord) => r.type === 'faq'));
            }
        } catch (err) {
            console.error("Erro ao carregar manual:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen, fetchData]);

    // Tecla ESC para fechar painel e lightbox
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (expandedImage) setExpandedImage(null);
                else onClose();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose, expandedImage]);

    // Lógica de Filtragem (Busca) — retorna tudo se não há query
    const filteredSections = sections.filter((s: HelpRecord) => {
        if (s.parent_id) return false; // Exibe apenas seções raiz
        if (!searchQuery.trim()) return true; // Sem busca → mostra tudo
        const q = searchQuery.toLowerCase();
        const inTitle = s.title.toLowerCase().includes(q);
        const inContent = s.content.paragraphs?.some((p: string) => p.toLowerCase().includes(q));

        // Verifica também nas subseções
        const subSections = sections.filter((sub: HelpRecord) => sub.parent_id === s.id);
        const inSubs = subSections.some((sub: HelpRecord) =>
            sub.title.toLowerCase().includes(q) ||
            sub.content.paragraphs?.some((p: string) => p.toLowerCase().includes(q))
        );

        return inTitle || inContent || inSubs;
    });

    const filteredFaqs = faqs.filter((f: HelpRecord) => {
        if (!searchQuery.trim()) return true; // Sem busca → mostra tudo
        return (
            f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.content.answer?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    // Rola suavemente até uma seção
    const scrollToSection = useCallback((sectionId: string) => {
        const el = document.getElementById(`section-${sectionId}`);
        if (el && contentRef.current) {
            const containerTop = contentRef.current.getBoundingClientRect().top;
            const elementTop = el.getBoundingClientRect().top;
            const offset = elementTop - containerTop;
            contentRef.current.scrollBy({ top: offset - 16, behavior: 'smooth' });
        }
        setActiveSection(sectionId);
    }, []);

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Lightbox / Modal de Expansão de Imagem */}
            {expandedImage && (
                <div
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 animate-in fade-in zoom-in duration-200"
                    onClick={() => setExpandedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        onClick={() => setExpandedImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={expandedImage}
                        alt="Zoom"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Painel com inversão cromática: Fundo Verde e Sidebar Branca */}
            <div
                className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: 'clamp(360px, 60vw, 100vw)' }}
            >
                {/* Cabeçalho Branco */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0f978e] flex items-center justify-center shadow-lg shadow-[#0f978e]/15">
                            <BookOpen size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800 tracking-tight">Manual de Ajuda</h2>
                            <p className="text-[11px] text-slate-500 font-medium">
                                {isAdmin ? '✏️ Modo de Edição Ativado' : 'Guia completo do sistema'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Busca - Fundo Claro */}
                <div className="flex-shrink-0 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Como podemos ajudar?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f978e]/30 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Corpo */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Branca Clean */}
                    <div className="hidden sm:flex flex-col w-64 bg-white border-r border-slate-100 overflow-y-auto py-5 px-4">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-2 mb-4">Manual de Instruções</p>
                        <div className="flex flex-col gap-1.5">
                            {sections.filter(s => !s.parent_id).map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => scrollToSection(s.id)}
                                    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-left text-[12px] font-semibold transition-all ${activeSection === s.id ? 'bg-[#0f978e]/10 text-[#0f978e] shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                                >
                                    <div className={`${activeSection === s.id ? 'text-[#0f978e]' : 'text-slate-400'}`}>
                                        {ICON_MAP[s.icon || 'BookOpen']}
                                    </div>
                                    <span className="truncate">{s.title.replace(/^\d+\.\s/, '')}</span>
                                </button>
                            ))}
                            <div className="my-4 border-t border-slate-50 mx-2" />
                            <button
                                onClick={() => scrollToSection('faq-section')}
                                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-left text-[12px] font-bold transition-all ${activeSection === 'faq-section' ? 'text-[#0f978e] bg-emerald-50/50 shadow-sm border border-[#0f978e]/10' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span className="text-base">💬</span>
                                <span>Perguntas Frequentes</span>
                            </button>
                        </div>
                    </div>

                    {/* Conteúdo - Fundo Verde Suave (Emerald-50) */}
                    <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-10 scroll-smooth relative bg-emerald-50/60">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                                <Loader2 className="animate-spin mb-4 text-[#0f978e]" size={40} />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Sincronizando manual...</p>
                            </div>
                        ) : (
                            <>
                                {filteredSections.length === 0 && filteredFaqs.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                        <Search size={32} className="mb-3 opacity-20" />
                                        <p className="text-sm font-medium italic">Nenhum tópico encontrado.</p>
                                    </div>
                                )}

                                {filteredSections.map((s) => (
                                    <div key={s.id} id={`section-${s.id}`} className="mb-16 scroll-mt-6 group/section">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#0f978e] shadow-sm border border-[#0f978e]/10 transition-transform group-hover/section:scale-110 duration-300">{ICON_MAP[s.icon || 'BookOpen']}</div>
                                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{s.title}</h3>
                                        </div>

                                        <div className="space-y-5 mb-8">
                                            {s.content.paragraphs?.map((p, i) => <p key={i} className="text-[14.5px] text-slate-600 leading-relaxed text-justify">{p}</p>)}
                                        </div>

                                        {s.content.images && s.content.images.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                                                {s.content.images.map((img) => (
                                                    <ImageUploadField
                                                        key={img.id}
                                                        recordId={s.id}
                                                        field={img}
                                                        isAdmin={isAdmin}
                                                        onExpand={(url) => setExpandedImage(url)}
                                                        onUploadSuccess={(url) => {
                                                            setSections(prev => prev.map(sec =>
                                                                sec.id === s.id
                                                                    ? { ...sec, content: { ...sec.content, images: sec.content.images?.map(i => i.id === img.id ? { ...i, url } : i) } }
                                                                    : sec
                                                            ));
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Subseções */}
                                        {sections.filter(sub => sub.parent_id === s.id).map((sub) => (
                                            <div key={sub.id} className="mt-8 pl-5 border-l-4 border-[#0f978e]/20 bg-white/40 rounded-r-2xl py-4 pr-4 border border-white/20">
                                                <h4 className="text-base font-bold text-slate-800 mb-3">{sub.title}</h4>
                                                <div className="space-y-3 mb-4">
                                                    {sub.content.paragraphs?.map((p, i) => <p key={i} className="text-[13px] text-slate-600 leading-relaxed">{p}</p>)}
                                                </div>
                                                {sub.content.images && sub.content.images.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                                        {sub.content.images.map((img) => (
                                                            <ImageUploadField
                                                                key={img.id}
                                                                recordId={sub.id}
                                                                field={img}
                                                                isAdmin={isAdmin}
                                                                onExpand={(url) => setExpandedImage(url)}
                                                                onUploadSuccess={(url) => {
                                                                    setSections(prev => prev.map(sec =>
                                                                        sec.id === sub.id
                                                                            ? { ...sec, content: { ...sec.content, images: sec.content.images?.map(i => i.id === img.id ? { ...i, url } : i) } }
                                                                            : sec
                                                                    ));
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {/* Separador */}
                                        <div className="mt-12 border-t border-slate-100" />
                                    </div>
                                ))}

                                {/* FAQ */}
                                <div id="section-faq-section" className="mb-20 pt-4">
                                    <h3 className="text-xl font-bold text-slate-800 mb-8 border-b border-[#0f978e]/10 pb-4">Dúvidas Comuns</h3>
                                    <div className="space-y-3">
                                        {filteredFaqs.map((f) => (
                                            <div key={f.id} className={`border rounded-2xl transition-all duration-200 ${openFaqIndex === f.id ? 'border-[#0f978e]/30 bg-white shadow-sm' : 'border-[#0f978e]/10 bg-white/50 hover:bg-white hover:border-[#0f978e]/20'}`}>
                                                <button onClick={() => setOpenFaqIndex(openFaqIndex === f.id ? null : f.id)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                                                    <span className={`text-[14px] font-semibold ${openFaqIndex === f.id ? 'text-[#0f978e]' : 'text-slate-800'}`}>{f.title}</span>
                                                    {openFaqIndex === f.id
                                                        ? <ChevronUp size={16} className="text-[#0f978e] shrink-0" />
                                                        : <ChevronDown size={16} className="text-slate-400 shrink-0" />
                                                    }
                                                </button>
                                                {openFaqIndex === f.id && (
                                                    <div className="px-6 pb-5 pt-1">
                                                        <p className="text-[13.5px] text-slate-600 leading-relaxed pl-4 border-l-2 border-[#0f978e]/30">{f.content.answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
