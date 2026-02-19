import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '../components/modals/PaymentModal';
import { EditableContent } from '../components/EditableContent';
import { supabase } from '../services/supabase';
import logo from '../assets/logo.png';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<{ id: string, name: string, tokens: number, price: string } | null>(null);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [youtubeVideoId, setYoutubeVideoId] = useState('dQw4w9WgXcQ'); // Exemplo padrão

    // Estado para MODO DE EDIÇÃO
    const [editMode, setEditMode] = useState(false);
    const [clickCount, setClickCount] = useState(0);

    const handlePortalClick = () => {
        navigate('/auth');
    };

    const handlePlanSelect = (plan: { id: string, name: string, tokens: number, price: string }) => {
        setSelectedPackage(plan);
        setIsPaymentModalOpen(true);
    };

    // Carregar ID do vídeo inicial
    useEffect(() => {
        const fetchVideoId = async () => {
            const { data } = await supabase
                .from('site_content')
                .select('content')
                .eq('section', 'hero')
                .eq('key', 'video_id')
                .maybeSingle();

            if (data?.content) {
                setYoutubeVideoId(data.content);
            }
        };
        fetchVideoId();
    }, []);

    // Lógica do Gatilho Secreto (3 cliques)
    const handleSecretTrigger = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (newCount === 3) {
            setEditMode(!editMode);
            setClickCount(0); // Reseta
            alert(!editMode ? 'Modo de Edição ATIVADO! Clique nos textos para editar.' : 'Modo de Edição DESATIVADO.');
        }

        // Reset automático do contador de cliques secretos após 2 segundos
        const timer = setTimeout(() => setClickCount(0), 2000);
        return () => clearTimeout(timer);
    };

    const handleVideoOpen = () => {
        setIsVideoModalOpen(true);
    };

    return (
        <div className={`bg-background-light text-slate-800 font-sans antialiased transition-colors duration-300 overflow-x-hidden ${editMode ? 'border-4 border-yellow-400' : ''}`}>
            {editMode && (
                <div className="fixed top-24 right-4 z-50 bg-yellow-400 text-black px-4 py-2 rounded-lg shadow-lg font-bold animate-pulse pointer-events-none">
                    MODO EDIÇÃO ATIVO
                </div>
            )}

            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div
                        className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none active:scale-95 transition-transform"
                        onClick={handleSecretTrigger}
                    >
                        <img src={logo} alt="Gama Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                        <span className="text-slate-900 font-display font-bold text-xl sm:text-2xl tracking-tight">
                            <EditableContent section="navbar" contentKey="brand_name" defaultContent="Gama Center" isEditing={editMode} tagName="span" />
                        </span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
                        <a className="hover:text-primary transition-colors" href="#workflow">
                            <EditableContent section="navbar" contentKey="link_workflow" defaultContent="Fluxo de Trabalho" isEditing={editMode} tagName="span" />
                        </a>
                        <a className="hover:text-primary transition-colors" href="#benefits">
                            <EditableContent section="navbar" contentKey="link_benefits" defaultContent="Benefícios" isEditing={editMode} tagName="span" />
                        </a>
                        <a className="hover:text-primary transition-colors" href="#testimonials">
                            <EditableContent section="navbar" contentKey="link_testimonials" defaultContent="Depoimentos" isEditing={editMode} tagName="span" />
                        </a>
                        <a className="hover:text-primary transition-colors" href="#pricing">
                            <EditableContent section="navbar" contentKey="link_pricing" defaultContent="Preços" isEditing={editMode} tagName="span" />
                        </a>
                        <a className="hover:text-primary transition-colors" href="#faq">
                            <EditableContent section="navbar" contentKey="link_faq" defaultContent="FAQ" isEditing={editMode} tagName="span" />
                        </a>
                    </div>
                    <button
                        onClick={handlePortalClick}
                        className="bg-primary hover:bg-teal-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md shadow-primary/20 text-sm"
                    >
                        <EditableContent section="navbar" contentKey="btn_portal" defaultContent="Portal do Cliente" isEditing={editMode} tagName="span" />
                    </button>
                </div>
            </nav>

            <section className="relative min-h-[90vh] flex items-center pt-28 pb-20 overflow-hidden bg-white" id="home">
                <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    {/* ... (Hero Content - Already Editable) ... */}
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-sm">health_and_safety</span>
                            <EditableContent
                                section="hero"
                                contentKey="chip_text"
                                defaultContent="Software de Avaliação Psicossocial"
                                isEditing={editMode}
                                tagName="span"
                            />
                        </div>
                        <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-slate-900 leading-[1.2] lg:leading-[1.15] break-words">
                            <EditableContent
                                section="hero"
                                contentKey="title_prefix"
                                defaultContent="Melhore o "
                                isEditing={editMode}
                                tagName="span"
                            />
                            <span className="text-primary relative inline-block">
                                <EditableContent
                                    section="hero"
                                    contentKey="title_highlight"
                                    defaultContent="Bem-estar dos Colaboradores"
                                    isEditing={editMode}
                                    tagName="span"
                                />
                            </span>
                            <EditableContent
                                section="hero"
                                contentKey="title_suffix"
                                defaultContent=" e Garanta a Conformidade Legal"
                                isEditing={editMode}
                                tagName="span"
                            />
                        </h1>
                        <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                            <EditableContent
                                section="hero"
                                contentKey="subtitle"
                                defaultContent="Uma plataforma humanocêntrica que simplifica avaliações de risco psicossocial, conectando psicologia profissional a relatórios automatizados."
                                isEditing={editMode}
                            />
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <a
                                href="https://wa.me/31971920766"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 bg-primary hover:bg-teal-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold transition-all shadow-xl shadow-primary/30 text-base transform hover:-translate-y-1 w-full sm:w-auto text-decoration-none"
                            >
                                <EditableContent
                                    section="hero"
                                    contentKey="cta_primary"
                                    defaultContent="Entre em contato"
                                    isEditing={editMode}
                                    tagName="span"
                                />
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </a>
                            <button
                                onClick={handleVideoOpen}
                                className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-medium transition-all shadow-sm hover:shadow-md select-none active:scale-95 cursor-pointer w-full sm:w-auto"
                            >
                                <span className="material-symbols-outlined text-primary">play_circle</span>
                                <EditableContent
                                    section="hero"
                                    contentKey="cta_secondary"
                                    defaultContent="Ver Como Funciona"
                                    isEditing={editMode}
                                    tagName="span"
                                />
                            </button>
                        </div>
                    </div>
                    {/* ... (Hero Image - Already Editable) ... */}
                    <div className="relative lg:h-[600px] flex items-center justify-center lg:justify-end">
                        <div className="relative z-10 w-full max-w-5xl">
                            {/* Browser Mockup Container */}
                            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#D1D1D6] overflow-hidden transition-all duration-700">
                                {/* Browser Header */}
                                <div className="bg-[#F6F6F6] border-b border-[#D1D1D6] px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                        <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
                                    </div>
                                    <div className="mx-auto bg-white rounded-md border border-[#EBEBEB] px-3 py-1 text-[10px] text-slate-400 w-48 text-center truncate">
                                        app.gamapsicossocial.com.br
                                    </div>
                                </div>
                                {/* Browser Content */}
                                <div className="overflow-hidden bg-slate-50">
                                    <EditableContent
                                        section="hero"
                                        contentKey="hero_image"
                                        defaultContent="https://lh3.googleusercontent.com/aida-public/AB6AXuAgTjHSNwimhOjpoOisnT7wa7gekhpGOYesZqHH8yIYL10CR4-xa56GHmLMVSgJ41DKGgCMYqkhkcHY9D4Zp3RXuLJf1ZSrKZm3hNNgTexDiwNtprmjaH94y5QO2wRLX0ptYcBxIaP7d1-ndg13xjAuiphQw6DlHQYn3OpvR_4xDAL8AQd1BgGpur-uct7h__9GooiWAoeqdZbhMz5qbEypZUT_iH5XGfWBGufM27VdtAkY2fewaQriLuFRWLtY_mjpvn4BkIkw-Gk"
                                        isEditing={editMode}
                                        type="image"
                                        className="w-full h-auto object-cover transform scale-[1.0] origin-top"
                                        alt="Tablet Interface showing psychological profile"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-3xl rounded-full -z-10"></div>
                    </div>
                </div>
            </section>


            <section className="py-24 bg-white relative" id="workflow">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-primary font-bold text-sm uppercase tracking-widest">Nosso Processo</span>
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mt-3">
                            Fluxo de Trabalho Simplificado do <span className="text-primary">Diagnóstico</span> ao Relatório
                        </h2>
                        <p className="mt-4 text-slate-500 max-w-2xl mx-auto text-lg">
                            Simplificamos o complexo processo de avaliação psicossocial em três etapas centradas no ser humano.
                        </p>
                    </div>
                    {/* ... Continua ... */}
                    <div className="relative">
                        <div className="hidden lg:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 border-t-2 border-dashed border-slate-200 z-0"></div>
                        <div className="grid lg:grid-cols-3 gap-12 relative z-10">
                            <div className="group text-center">
                                <div className="bg-white w-24 h-24 mx-auto rounded-full shadow-lg border-4 border-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <EditableContent section="workflow" contentKey="step_1_icon" defaultContent="psychology_alt" isEditing={editMode} tagName="span" className="material-symbols-outlined text-4xl text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">
                                    <EditableContent section="workflow" contentKey="step_1_title" defaultContent="1. Avaliação" isEditing={editMode} tagName="span" />
                                </h3>
                                <p className="text-slate-600 leading-relaxed px-4">
                                    <EditableContent section="workflow" contentKey="step_1_description" defaultContent="Os colaboradores completam questionários psicológicos confidenciais e cientificamente embasados em qualquer dispositivo." isEditing={editMode} tagName="span" />
                                </p>
                                <div className="mt-6 p-3 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#D1D1D6] mx-auto max-w-xs transform group-hover:-translate-y-1 transition-all">
                                    <EditableContent
                                        section="workflow"
                                        contentKey="step_1_image"
                                        type="image"
                                        defaultContent="https://lh3.googleusercontent.com/aida-public/AB6AXuCUagg3zLkxqnADxdJyv_jpR2hbAbkCS3PGDVH95-h3ZZgabintTDoxiW741MCLW1VhiFrTxYUy6rNXZrebYY0m-1HplW0JNTIoD-Ssmum8jw_-DV0Qrt520x6G7qTY48DBNK3uEpcd53N-D35Lmq_yVuL1lTQ6yhp5WK6KbNDa2pySBmDNDdnLUgqw9VgbGrc03TV-QvSzryikpHPMHjnzKWy1IVBzlLaR0nAJ9HjdClOkQqNVSDYCdy0vvI-3NoZNpbM9SoF-27U"
                                        isEditing={editMode}
                                        className="rounded shadow-sm opacity-90"
                                        alt="Assessment UI"
                                    />
                                </div>
                            </div>
                            <div className="group text-center">
                                <div className="bg-white w-24 h-24 mx-auto rounded-full shadow-lg border-4 border-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <EditableContent section="workflow" contentKey="step_2_icon" defaultContent="analytics" isEditing={editMode} tagName="span" className="material-symbols-outlined text-4xl text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">
                                    <EditableContent section="workflow" contentKey="step_2_title" defaultContent="2. Análise" isEditing={editMode} tagName="span" />
                                </h3>
                                <p className="text-slate-600 leading-relaxed px-4">
                                    <EditableContent section="workflow" contentKey="step_2_description" defaultContent="Nossos algoritmos processam os dados instantaneamente, identificando fatores de risco e mantendo o anonimato estrito." isEditing={editMode} tagName="span" />
                                </p>
                                <div className="mt-6 p-3 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#D1D1D6] mx-auto max-w-xs transform group-hover:-translate-y-1 transition-all">
                                    <EditableContent
                                        section="workflow"
                                        contentKey="step_2_image"
                                        type="image"
                                        defaultContent="https://lh3.googleusercontent.com/aida-public/AB6AXuCdWOC4G_GFtfv0oG9USegnMJWsp5JpEkR3tWgkoOFKiFyVu9yzBnMOZfpUVPxKF5cmzvvuc5guynO6Sm3wgeKnrJdVA1wTf5EOQrLAw5LhQCp9cPYNst-20iZVl4_fEFX9sCXo7PyvfR7llBNg8E6cc8duMSZPjMu4CQOr2kJg8Mym05xcTmahTfZ8Eunf9T1ZB3vwt2xN7aP3v_vXKKy-PC22CobB1vIoRUQc2bMTyKsgyxb6w3g_J1SSyWfPc-aCa57x04bB-a8"
                                        isEditing={editMode}
                                        className="rounded shadow-sm opacity-90"
                                        alt="Analysis Dashboard"
                                    />
                                </div>
                            </div>
                            <div className="group text-center">
                                <div className="bg-white w-24 h-24 mx-auto rounded-full shadow-lg border-4 border-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <EditableContent section="workflow" contentKey="step_3_icon" defaultContent="assignment_turned_in" isEditing={editMode} tagName="span" className="material-symbols-outlined text-4xl text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">
                                    <EditableContent section="workflow" contentKey="step_3_title" defaultContent="3. Relatório Acionável" isEditing={editMode} tagName="span" />
                                </h3>
                                <p className="text-slate-600 leading-relaxed px-4">
                                    <EditableContent section="workflow" contentKey="step_3_description" defaultContent="Receba relatórios abrangentes com recomendações claras para RH e documentação de conformidade legal." isEditing={editMode} tagName="span" />
                                </p>
                                <div className="mt-6 p-3 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#D1D1D6] mx-auto max-w-xs transform group-hover:-translate-y-1 transition-all">
                                    <EditableContent
                                        section="workflow"
                                        contentKey="step_3_image"
                                        type="image"
                                        defaultContent="https://lh3.googleusercontent.com/aida-public/AB6AXuBr71OqVG7z_0wuFgTJliFvVZB_81WJVo30xePop1HLtN_TFQgyJ1wslW91IMgQ2GCBH1gDyOLellMcgIQXg09O7IPbtl46jrdr8IG2aLRLXwN7HTkTnRO3NrTJ6CrA_7cN11ZXUufO-ex239RriXl27_KBoaJZiSXN1WrSx8gBdCJUY_p9cXmmKw1z5uhUW9wywmgxzdTNoCZ4IxtuOdwHgnU4Qho06dGxffOXjWblblCxajOIdTJiS7jie7k1-2BbbW4_CAQubwM"
                                        isEditing={editMode}
                                        className="rounded shadow-sm opacity-90"
                                        alt="Final Report"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-white relative overflow-hidden" id="benefits">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div className="max-w-2xl">
                            <span className="text-primary font-bold text-sm uppercase tracking-widest mb-2 block">
                                <EditableContent section="benefits" contentKey="subtitle" defaultContent="Por Que Importa" isEditing={editMode} tagName="span" />
                            </span>
                            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900">
                                <EditableContent section="benefits" contentKey="title" defaultContent="Cultivando uma Mentalidade Saudável" isEditing={editMode} tagName="span" />
                            </h2>
                            <p className="mt-4 text-slate-600 text-lg">
                                <EditableContent section="benefits" contentKey="description" defaultContent="Além da conformidade, focamos no aspecto humano da sua organização. Mentes saudáveis levam a negócios resilientes." isEditing={editMode} tagName="span" />
                            </p>
                        </div>
                        <button className="bg-primary hover:bg-teal-700 text-white px-6 py-3 rounded-lg border border-primary/10 transition-all flex items-center gap-2">
                            <EditableContent section="benefits" contentKey="btn_download" defaultContent="Baixar Brochura" isEditing={editMode} tagName="span" />
                            <span className="material-symbols-outlined text-sm">download</span>
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <EditableContent section="benefits" contentKey="benefit_1_icon" defaultContent="self_improvement" isEditing={editMode} tagName="span" className="material-symbols-outlined text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">
                                <EditableContent section="benefits" contentKey="benefit_1_title" defaultContent="Redução de Burnout" isEditing={editMode} tagName="span" />
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                <EditableContent section="benefits" contentKey="benefit_1_description" defaultContent="A identificação precoce de fatores de estresse ajuda a prevenir o esgotamento dos colaboradores e afastamentos." isEditing={editMode} tagName="span" />
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <EditableContent section="benefits" contentKey="benefit_2_icon" defaultContent="sentiment_content" isEditing={editMode} tagName="span" className="material-symbols-outlined text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">
                                <EditableContent section="benefits" contentKey="benefit_2_title" defaultContent="Inteligência Emocional" isEditing={editMode} tagName="span" />
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                <EditableContent section="benefits" contentKey="benefit_2_description" defaultContent="Dados que ajudam a liderança a entender o clima emocional de suas equipes." isEditing={editMode} tagName="span" />
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <EditableContent section="benefits" contentKey="benefit_3_icon" defaultContent="diversity_1" isEditing={editMode} tagName="span" className="material-symbols-outlined text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">
                                <EditableContent section="benefits" contentKey="benefit_3_title" defaultContent="Melhora na Retenção" isEditing={editMode} tagName="span" />
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                <EditableContent section="benefits" contentKey="benefit_3_description" defaultContent="Colaboradores permanecem onde se sentem ouvidos e cuidados. Reduza significativamente os custos de rotatividade." isEditing={editMode} tagName="span" />
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <EditableContent section="benefits" contentKey="benefit_4_icon" defaultContent="verified_user" isEditing={editMode} tagName="span" className="material-symbols-outlined text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">
                                <EditableContent section="benefits" contentKey="benefit_4_title" defaultContent="Salvaguardas Legais" isEditing={editMode} tagName="span" />
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                <EditableContent section="benefits" contentKey="benefit_4_description" defaultContent="Evidências documentadas de cuidado proativo protegem a empresa contra ações de responsabilidade." isEditing={editMode} tagName="span" />
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <EditableContent section="benefits" contentKey="benefit_5_icon" defaultContent="monitor_heart" isEditing={editMode} tagName="span" className="material-symbols-outlined text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">
                                <EditableContent section="benefits" contentKey="benefit_5_title" defaultContent="Monitoramento Contínuo" isEditing={editMode} tagName="span" />
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                <EditableContent section="benefits" contentKey="benefit_5_description" defaultContent="Acompanhe o progresso ao longo do tempo com dados longitudinais, não apenas avaliações pontuais." isEditing={editMode} tagName="span" />
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <EditableContent section="benefits" contentKey="benefit_6_icon" defaultContent="rocket_launch" isEditing={editMode} tagName="span" className="material-symbols-outlined text-3xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">
                                <EditableContent section="benefits" contentKey="benefit_6_title" defaultContent="Aumento de Produtividade" isEditing={editMode} tagName="span" />
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                <EditableContent section="benefits" contentKey="benefit_6_description" defaultContent="Uma força de trabalho mentalmente saudável é uma força de trabalho focada e produtiva." isEditing={editMode} tagName="span" />
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-white" id="testimonials">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                            <EditableContent
                                section="testimonials"
                                contentKey="chip_text"
                                defaultContent="Impacto Real"
                                isEditing={editMode}
                                tagName="span"
                            />
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mt-4">
                            <EditableContent
                                section="testimonials"
                                contentKey="title"
                                defaultContent="Aprovado por Diretores de RH"
                                isEditing={editMode}
                                tagName="span"
                            />
                        </h2>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100 flex flex-col md:flex-row gap-8 items-center md:items-start relative">
                            <div className="flex-shrink-0 relative">
                                <EditableContent
                                    section="testimonials"
                                    contentKey="review_1_image"
                                    defaultContent="https://lh3.googleusercontent.com/aida-public/AB6AXuBIY8-eVVnjBG-yaWY2kvTyyKgaqd2_yUh-LvIxbhhZmOFe3HgjCVlIQv9kdE4LBJwu9O3zT8-YDPf1p6E_uney6xQ3EGq2zfKsNBYHrlavE_ITHrNuqjSLuJvqUZ1ZcF7Qu5gAfJ5NBZAu7yfJhkvR2-IdpJK8K4qpI5aKiWukOl-l8nd11S59LcxX4ZaMwg_89N7K_E1-vUO8_rGwG0kwI5GZaQoNL2moz58umKWaJR0F-YMJMH5jK6Gwf6o2HmOPeoYULE-3Pgk"
                                    isEditing={editMode}
                                    type="image"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md"
                                    alt="Review 1"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1 rounded-full border-2 border-white">
                                    <span className="material-symbols-outlined text-sm">format_quote</span>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-slate-600 text-lg leading-relaxed italic mb-4">
                                    "<EditableContent
                                        section="testimonials"
                                        contentKey="review_1_text"
                                        defaultContent="A empatia no design combinada com o rigor dos dados é impressionante. Não apenas nos ajudou a cumprir uma exigência legal, mas realmente melhorou o moral da equipe em 3 meses."
                                        isEditing={editMode}
                                        tagName="span"
                                    />"
                                </p>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">
                                        <EditableContent
                                            section="testimonials"
                                            contentKey="review_1_author"
                                            defaultContent="Sarah Jenkins"
                                            isEditing={editMode}
                                            tagName="span"
                                        />
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        <EditableContent
                                            section="testimonials"
                                            contentKey="review_1_role"
                                            defaultContent="Diretora de Pessoas & Cultura, TechFlow"
                                            isEditing={editMode}
                                            tagName="span"
                                        />
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100 flex flex-col md:flex-row gap-8 items-center md:items-start relative">
                            <div className="flex-shrink-0 relative">
                                <EditableContent
                                    section="testimonials"
                                    contentKey="review_2_image"
                                    defaultContent="https://lh3.googleusercontent.com/aida-public/AB6AXuD-LcrZceZ5ADbRP2H5MHgfUEDAbkJSF4SIfarwep6zGQKO35gMSyuzTYIEUjs8N_dTTg_EX5Jsc8WlRJSZWXWrWJG4V6dktGk4BndfKotqSAhVExa8eTbr8L_bT_sNn3ViyS5ItfsvrXS1T-mN5RC5Z_phbRgE_vzonoqOgVC4qQsKIrUYtM5eS7rqjD7bgXEaHVJ-RjOT5nGQ-gO-iHzrzmR3gTeJDe6F8sI-8SHSDqPBG0rKf1jqtGHx_aMm0f2Te1mDcTMCfuk"
                                    isEditing={editMode}
                                    type="image"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md"
                                    alt="Review 2"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1 rounded-full border-2 border-white">
                                    <span className="material-symbols-outlined text-sm">format_quote</span>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-slate-600 text-lg leading-relaxed italic mb-4">
                                    "<EditableContent
                                        section="testimonials"
                                        contentKey="review_2_text"
                                        defaultContent="Finalmente, uma ferramenta que respeita o tempo e a privacidade do funcionário, enquanto nos fornece o painel que precisamos para reuniões de diretoria. Os relatórios são detalhados e fáceis de ler."
                                        isEditing={editMode}
                                        tagName="span"
                                    />"
                                </p>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">
                                        <EditableContent
                                            section="testimonials"
                                            contentKey="review_2_author"
                                            defaultContent="Michael Chen"
                                            isEditing={editMode}
                                            tagName="span"
                                        />
                                    </h4>
                                    <p className="text-sm text-slate-500">
                                        <EditableContent
                                            section="testimonials"
                                            contentKey="review_2_role"
                                            defaultContent="VP de RH, SOMA Construções"
                                            isEditing={editMode}
                                            tagName="span"
                                        />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section className="py-24 bg-white relative overflow-hidden" id="pricing">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold text-xs uppercase tracking-widest">
                            <EditableContent
                                section="pricing"
                                contentKey="chip_text"
                                defaultContent="Preços"
                                isEditing={editMode}
                                tagName="span"
                            />
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mt-2 break-words px-4">
                            <EditableContent
                                section="pricing"
                                contentKey="title"
                                defaultContent="Invista no Seu Pessoal"
                                isEditing={editMode}
                                tagName="span"
                            />
                        </h2>
                        <p className="mt-4 text-slate-500">
                            <EditableContent
                                section="pricing"
                                contentKey="subtitle"
                                defaultContent="Preços transparentes para empresas de todos os portes."
                                isEditing={editMode}
                                tagName="span"
                            />
                        </p>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-8 items-stretch mt-12">
                        {/* Pacote Mensal */}
                        <div className="relative flex flex-col rounded-2xl border border-slate-100 bg-white p-7 transition-all hover:shadow-lg group hover:border-primary">
                            <div className="flex flex-col gap-1 mb-8">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <EditableContent section="pricing" contentKey="plan_1_name" defaultContent="Pacote Mensal" isEditing={editMode} tagName="span" />
                                </h3>
                                <div className="flex flex-col">
                                    <p className="flex items-baseline gap-1 text-slate-800 mt-1">
                                        <span className="text-slate-400 text-sm font-medium">R$</span>
                                        <span className="text-4xl font-extrabold tracking-tight">
                                            <EditableContent section="pricing" contentKey="plan_1_price" defaultContent="3.000,00" isEditing={editMode} tagName="span" />
                                        </span>
                                    </p>
                                    <span className="text-xs text-primary font-bold mt-2 px-2 py-0.5 bg-primary/5 rounded-md border border-primary/10 w-fit">
                                        R$ <EditableContent section="pricing" contentKey="plan_1_per_eval" defaultContent="10,00" isEditing={editMode} tagName="span" />/aval
                                    </span>
                                </div>
                                <ul className="text-left space-y-3 mt-6 text-sm text-slate-600">
                                    <li className="flex gap-2 items-center">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <EditableContent section="pricing" contentKey="plan_1_feat_1" defaultContent="300 avaliações" isEditing={editMode} tagName="span" />
                                    </li>
                                    <li className="flex gap-2 items-center">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <EditableContent section="pricing" contentKey="plan_1_feat_2" defaultContent="Relatório de Conformidade Básico" isEditing={editMode} tagName="span" />
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={() => handlePlanSelect({ id: 'mensal', name: 'Pacote Mensal', tokens: 300, price: '3000.00' })}
                                className="mt-auto w-full cursor-pointer flex items-center justify-center rounded-xl h-12 px-6 font-bold transition-all bg-slate-50 hover:bg-primary text-slate-600 hover:text-white border border-slate-100 hover:border-primary"
                            >
                                Selecionar Plano
                            </button>
                        </div>

                        {/* Plano Anual - Featured */}
                        <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-white p-7 transition-all shadow-md scale-105 z-10">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                Melhor Valor
                            </div>
                            <div className="flex flex-col gap-1 mb-8">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <EditableContent section="pricing" contentKey="plan_2_name" defaultContent="Plano Anual" isEditing={editMode} tagName="span" />
                                    <span className="material-symbols-outlined text-primary text-sm">verified</span>
                                </h3>
                                <div className="flex flex-col">
                                    <p className="flex items-baseline gap-1 text-slate-800 mt-1">
                                        <span className="text-slate-400 text-sm font-medium">R$</span>
                                        <span className="text-5xl font-extrabold tracking-tight text-primary">
                                            <EditableContent section="pricing" contentKey="plan_2_price" defaultContent="6.000,00" isEditing={editMode} tagName="span" />
                                        </span>
                                    </p>
                                    <span className="text-xs text-primary font-bold mt-2 px-2 py-0.5 bg-primary/5 rounded-md border border-primary/10 w-fit">
                                        R$ <EditableContent section="pricing" contentKey="plan_2_per_eval" defaultContent="5,00" isEditing={editMode} tagName="span" />/aval
                                    </span>
                                </div>
                                <p className="text-primary text-xs font-bold mt-4 bg-primary/5 p-2 rounded-lg border border-primary/10">
                                    <EditableContent section="pricing" contentKey="plan_2_discount" defaultContent="Economize 50% com faturamento anual" isEditing={editMode} tagName="span" />
                                </p>
                                <ul className="text-left space-y-3 mt-6 text-sm text-slate-600">
                                    <li className="flex gap-2 items-center">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <EditableContent section="pricing" contentKey="plan_2_feat_1" defaultContent="Até 1.200 avaliações" isEditing={editMode} tagName="span" />
                                    </li>
                                    <li className="flex gap-2 items-center">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <EditableContent section="pricing" contentKey="plan_2_feat_2" defaultContent="Suíte Completa de Conformidade" isEditing={editMode} tagName="span" />
                                    </li>
                                    <li className="flex gap-2 items-center">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <EditableContent section="pricing" contentKey="plan_2_feat_3" defaultContent="Suporte Prioritário" isEditing={editMode} tagName="span" />
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={() => handlePlanSelect({ id: 'anual', name: 'Plano Anual', tokens: 1200, price: '6000.00' })}
                                className="mt-auto w-full cursor-pointer flex items-center justify-center rounded-xl h-12 px-6 font-bold transition-all bg-primary hover:bg-teal-700 text-white shadow-md shadow-primary/20"
                            >
                                Selecionar Plano
                            </button>
                        </div>

                        {/* Pacote Semestral */}
                        <div className="relative flex flex-col rounded-2xl border border-slate-100 bg-white p-7 transition-all hover:shadow-lg group hover:border-primary">
                            <div className="flex flex-col gap-1 mb-8">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <EditableContent section="pricing" contentKey="plan_3_name" defaultContent="Pacote Semestral" isEditing={editMode} tagName="span" />
                                </h3>
                                <div className="flex flex-col">
                                    <p className="flex items-baseline gap-1 text-slate-800 mt-1">
                                        <span className="text-slate-400 text-sm font-medium">R$</span>
                                        <span className="text-4xl font-extrabold tracking-tight">
                                            <EditableContent section="pricing" contentKey="plan_3_price" defaultContent="3.500,00" isEditing={editMode} tagName="span" />
                                        </span>
                                    </p>
                                    <span className="text-xs text-primary font-bold mt-2 px-2 py-0.5 bg-primary/5 rounded-md border border-primary/10 w-fit">
                                        R$ <EditableContent section="pricing" contentKey="plan_3_per_eval" defaultContent="7,00" isEditing={editMode} tagName="span" />/aval
                                    </span>
                                </div>
                                <ul className="text-left space-y-3 mt-6 text-sm text-slate-600">
                                    <li className="flex gap-2 items-center">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <EditableContent section="pricing" contentKey="plan_3_feat_1" defaultContent="Até 500 avaliações" isEditing={editMode} tagName="span" />
                                    </li>
                                    <li className="flex gap-2 items-center">
                                        <span className="material-symbols-outlined text-primary text-lg">check</span>
                                        <EditableContent section="pricing" contentKey="plan_3_feat_2" defaultContent="Relatórios Padrão" isEditing={editMode} tagName="span" />
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={() => handlePlanSelect({ id: 'semestral', name: 'Pacote Semestral', tokens: 500, price: '3500.00' })}
                                className="mt-auto w-full cursor-pointer flex items-center justify-center rounded-xl h-12 px-6 font-bold transition-all bg-slate-50 hover:bg-primary text-slate-600 hover:text-white border border-slate-100 hover:border-primary"
                            >
                                Selecionar Plano
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-slate-50/50 relative overflow-hidden" id="faq">
                <div className="container mx-auto px-4 sm:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                            <EditableContent section="faq" contentKey="chip" defaultContent="Suporte & Dúvidas" isEditing={editMode} tagName="span" />
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mt-2">
                            <EditableContent section="faq" contentKey="title" defaultContent="Perguntas Frequentes" isEditing={editMode} tagName="span" />
                        </h2>
                        <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
                            <EditableContent section="faq" contentKey="subtitle" defaultContent="Tudo o que você precisa saber sobre a implementação do Gama Psicossocial em sua operação." isEditing={editMode} tagName="span" />
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {[
                            {
                                q: "Posso cadastrar múltiplas empresas?",
                                a: "Sim, cada cliente terá um relatório separado e gestão independente dentro da plataforma."
                            },
                            {
                                q: "O software é seguro?",
                                a: "Sim, utilizamos criptografia de ponta a ponta e seguimos todas as normas de segurança de dados (LGPD) para garantir a confidencialidade das avaliações."
                            },
                            {
                                q: "Consigo acompanhar se as medidas estão sendo implementadas?",
                                a: "Sim, nosso dashboard oferece acompanhamento em tempo real do progresso das avaliações e da aplicação das recomendações."
                            },
                            {
                                q: "Posso reavaliar ao longo do tempo?",
                                a: "Com certeza. O sistema permite avaliações periódicas para que você possa monitorar a evolução do clima psicossocial na sua empresa."
                            },
                            {
                                q: "Posso cancelar quando quiser?",
                                a: "Sim, não temos fidelidade obrigatória nos planos. Você tem total liberdade para gerir sua assinatura."
                            }
                        ].map((item, index) => (
                            <div
                                key={index}
                                className={`group bg-white rounded-2xl border transition-all duration-300 ${openFaqIndex === index ? 'border-primary shadow-lg' : 'border-[#D1D1D6] shadow-sm'
                                    }`}
                            >
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                    className="w-full px-4 sm:px-6 py-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                                >
                                    <span className={`font-bold transition-colors break-words ${openFaqIndex === index ? 'text-primary' : 'text-slate-700'}`}>
                                        <EditableContent section="faq" contentKey={`q_${index}`} defaultContent={item.q} isEditing={editMode} tagName="span" />
                                    </span>
                                    <span className={`material-symbols-outlined flex-shrink-0 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180 text-primary' : 'text-slate-400'}`}>
                                        keyboard_arrow_down
                                    </span>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${openFaqIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="px-4 sm:px-6 pb-6 text-slate-500 text-sm leading-relaxed border-t border-slate-50 pt-4 break-words">
                                        <EditableContent section="faq" contentKey={`a_${index}`} defaultContent={item.a} isEditing={editMode} tagName="span" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-3xl rounded-full -z-10"></div>
            </section>

            <footer className="bg-white text-slate-500 py-16 border-t border-slate-100 overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <img src={logo} alt="Gama Logo" className="w-8 h-8 object-contain" />
                                <span className="text-slate-900 font-display font-bold text-xl tracking-tight">
                                    <EditableContent section="footer" contentKey="brand" defaultContent="Gama Center" isEditing={editMode} tagName="span" />
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                <EditableContent section="footer" contentKey="description" defaultContent="Preenchendo a lacuna entre os requisitos corporativos e as necessidades humanas. Tornamos a conformidade empática." isEditing={editMode} />
                            </p>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-bold mb-6">
                                <EditableContent section="footer" contentKey="col_3_title" defaultContent="Entre em Contato" isEditing={editMode} tagName="span" />
                            </h4>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">mail</span>
                                    <EditableContent section="footer" contentKey="contact_email" defaultContent="gamacentersst@gmail.com" isEditing={editMode} tagName="span" />
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">call</span>
                                    <EditableContent section="footer" contentKey="contact_phone" defaultContent="31 97192-0766" isEditing={editMode} tagName="span" />
                                </li>
                                <li className="mt-4 text-xs text-slate-400">
                                    <EditableContent section="footer" contentKey="address" defaultContent="R. Barão de Pouso Alegre, 90 - São Sebastiao, Conselheiro Lafaiete - MG, 36406-034" isEditing={editMode} tagName="span" />
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
                        <p>
                            <EditableContent section="footer" contentKey="copyright" defaultContent="© 2023 Gama Center. Todos os direitos reservados." isEditing={editMode} tagName="span" />
                        </p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <a className="hover:text-slate-600 transition-colors" href="#">
                                <EditableContent section="footer" contentKey="legal_1" defaultContent="Política de Privacidade" isEditing={editMode} tagName="span" />
                            </a>
                            <a className="hover:text-slate-600 transition-colors" href="#">
                                <EditableContent section="footer" contentKey="legal_2" defaultContent="Termos de Serviço" isEditing={editMode} tagName="span" />
                            </a>
                            <a className="hover:text-slate-600 transition-colors" href="#">
                                <EditableContent section="footer" contentKey="legal_3" defaultContent="Configurações de Cookies" isEditing={editMode} tagName="span" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                selectedPackage={selectedPackage}
            />

            {/* Modal de Vídeo */}
            {isVideoModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm cursor-pointer"
                        onClick={() => setIsVideoModalOpen(false)}
                    ></div>
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <button
                            onClick={() => setIsVideoModalOpen(false)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        {editMode ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white p-8 space-y-4">
                                <span className="material-symbols-outlined text-6xl text-primary">edit_note</span>
                                <h3 className="text-xl font-bold">Configurar Vídeo do YouTube</h3>
                                <p className="text-slate-400 text-center max-w-md">
                                    Insira apenas o <b>ID do vídeo</b> (ex: dQw4w9WgXcQ) no campo abaixo para alterar o player.
                                </p>
                                <div className="bg-white/10 p-3 rounded-lg border border-white/20 w-full max-w-sm text-center">
                                    <EditableContent
                                        section="hero"
                                        contentKey="video_id"
                                        defaultContent="dQw4w9WgXcQ"
                                        isEditing={editMode}
                                        tagName="span"
                                        className="text-primary font-mono text-lg"
                                        onSave={(val: string) => setYoutubeVideoId(val)}
                                    />
                                </div>
                                <button
                                    onClick={() => setIsVideoModalOpen(false)}
                                    className="mt-4 bg-primary px-6 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors"
                                >
                                    Fechar e Testar
                                </button>
                            </div>
                        ) : (
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
};
