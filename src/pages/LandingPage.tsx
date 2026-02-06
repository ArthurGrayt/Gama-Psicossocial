import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '../components/modals/PaymentModal';
import { PlansModal } from '../components/modals/PlansModal';
import logo from '../assets/logo.png';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<{ id: string, name: string, tokens: number, price: string } | null>(null);

    const handlePortalClick = () => {
        navigate('/auth');
    };

    const handlePlanSelect = (plan: { id: string, name: string, tokens: number, price: string }) => {
        setSelectedPackage(plan);
        setIsPaymentModalOpen(true);
    };

    return (
        <div className="bg-background-light text-slate-800 font-sans antialiased transition-colors duration-300">
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Gama Logo" className="w-10 h-10 object-contain" />
                        <span className="text-slate-900 font-display font-bold text-2xl tracking-tight">Gama Center</span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
                        <a className="hover:text-primary transition-colors" href="#workflow">Fluxo de Trabalho</a>
                        <a className="hover:text-primary transition-colors" href="#benefits">Benefícios</a>
                        <a className="hover:text-primary transition-colors" href="#testimonials">Depoimentos</a>
                        <a className="hover:text-primary transition-colors" href="#pricing">Preços</a>
                    </div>
                    <button
                        onClick={handlePortalClick}
                        className="bg-primary hover:bg-teal-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md shadow-primary/20 text-sm"
                    >
                        Portal do Cliente
                    </button>
                </div>
            </nav>

            <section className="relative min-h-[90vh] flex items-center pt-28 pb-20 overflow-hidden bg-white" id="home">
                <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-sm">health_and_safety</span>
                            Software de Avaliação Psicossocial
                        </div>
                        <h1 className="font-display font-extrabold text-5xl lg:text-6xl text-slate-900 leading-[1.15]">
                            Melhore o <span className="text-primary relative inline-block">
                                Bem-estar dos Colaboradores
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20" preserveAspectRatio="none" viewBox="0 0 100 10">
                                    <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="8"></path>
                                </svg>
                            </span> e Garanta a Conformidade Legal
                        </h1>
                        <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                            Uma plataforma humanocêntrica que simplifica avaliações de risco psicossocial, conectando psicologia profissional a relatórios automatizados.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button className="flex items-center justify-center gap-3 bg-primary hover:bg-teal-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-primary/30 text-base transform hover:-translate-y-1">
                                Iniciar Avaliação
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                            <button className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-medium transition-all shadow-sm hover:shadow-md">
                                <span className="material-symbols-outlined text-primary">play_circle</span>
                                Ver Como Funciona
                            </button>
                        </div>
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
                            <div className="flex -space-x-3">
                                <img alt="HR Director" className="w-10 h-10 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIY8-eVVnjBG-yaWY2kvTyyKgaqd2_yUh-LvIxbhhZmOFe3HgjCVlIQv9kdE4LBJwu9O3zT8-YDPf1p6E_uney6xQ3EGq2zfKsNBYHrlavE_ITHrNuqjSLuJvqUZ1ZcF7Qu5gAfJ5NBZAu7yfJhkvR2-IdpJK8K4qpI5aKiWukOl-l8nd11S59LcxX4ZaMwg_89N7K_E1-vUO8_rGwG0kwI5GZaQoNL2moz58umKWaJR0F-YMJMH5jK6Gwf6o2HmOPeoYULE-3Pgk" />
                                <img alt="Psychologist" className="w-10 h-10 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-LcrZceZ5ADbRP2H5MHgfUEDAbkJSF4SIfarwep6zGQKO35gMSyuzTYIEUjs8N_dTTg_EX5Jsc8WlRJSZWXWrWJG4V6dktGk4BndfKotqSAhVExa8eTbr8L_bT_sNn3ViyS5ItfsvrXS1T-mN5RC5Z_phbRgE_vzonoqOgVC4qQsKIrUYtM5eS7rqjD7bgXEaHVJ-RjOT5nGQ-gO-iHzrzmR3gTeJDe6F8sI-8SHSDqPBG0rKf1jqtGHx_aMm0f2Te1mDcTMCfuk" />
                                <img alt="Manager" className="w-10 h-10 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5yISE3vgwKx7ojlDGjXey8rgShkU_J9V3M0HM178mWRHHwUslFbJ9XZTMncTOzxMfeP37dqRTXJ90oWnz0UK0Dtb3C9hwI6koczNE37gMsk08Z3she9RmCUq5dTKQ9z3ivWzyqEipCotduLZIjRE65EsJ-TL6DWoD1qki7UnyjdDk5GfoDazQTZWoFBFyBY4MvOA8EryEeq6ULLmjmOTKnFjqAGaenNARHc6uFvJGyw6u_otfZN-H-yLldeuhVGl70DZ1287Isp0" />
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">+2k</div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Confiado por Profissionais</p>
                                <div className="flex text-yellow-400 text-xs">
                                    <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                                    <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                                    <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                                    <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                                    <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative lg:h-[600px] flex items-center justify-center lg:justify-end">
                        <div className="relative z-10 w-full max-w-lg">
                            <div className="bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 transform rotate-[-2deg] transition-transform hover:rotate-0 duration-700">
                                <img
                                    alt="Tablet Interface showing psychological profile"
                                    className="rounded-xl w-full h-auto object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgTjHSNwimhOjpoOisnT7wa7gekhpGOYesZqHH8yIYL10CR4-xa56GHmLMVSgJ41DKGgCMYqkhkcHY9D4Zp3RXuLJf1ZSrKZm3hNNgTexDiwNtprmjaH94y5QO2wRLX0ptYcBxIaP7d1-ndg13xjAuiphQw6DlHQYn3OpvR_4xDAL8AQd1BgGpur-uct7h__9GooiWAoeqdZbhMz5qbEypZUT_iH5XGfWBGufM27VdtAkY2fewaQriLuFRWLtY_mjpvn4BkIkw-Gk"
                                />
                                <div className="absolute -right-8 top-12 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                                        <span className="material-symbols-outlined">sentiment_very_satisfied</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold">Satisfação</p>
                                        <p className="text-slate-900 font-bold text-lg">94% Positiva</p>
                                    </div>
                                </div>
                                <div className="absolute -left-6 bottom-20 bg-card-dark p-4 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3">
                                    <div className="bg-primary/20 p-2 rounded-full text-primary">
                                        <span className="material-symbols-outlined">gavel</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold">Conformidade</p>
                                        <p className="text-white font-bold text-lg">100% Verificado</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-3xl rounded-full -z-10"></div>
                    </div>
                </div>
            </section >

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
                    <div className="relative">
                        <div className="hidden lg:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 border-t-2 border-dashed border-slate-200 z-0"></div>
                        <div className="grid lg:grid-cols-3 gap-12 relative z-10">
                            <div className="group text-center">
                                <div className="bg-white w-24 h-24 mx-auto rounded-full shadow-lg border-4 border-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-4xl text-primary">psychology_alt</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">1. Avaliação</h3>
                                <p className="text-slate-600 leading-relaxed px-4">
                                    Os colaboradores completam questionários psicológicos confidenciais e cientificamente embasados em qualquer dispositivo.
                                </p>
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 mx-auto max-w-xs transform group-hover:-translate-y-1 transition-transform">
                                    <img
                                        alt="Assessment UI"
                                        className="rounded shadow-sm opacity-90"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUagg3zLkxqnADxdJyv_jpR2hbAbkCS3PGDVH95-h3ZZgabintTDoxiW741MCLW1VhiFrTxYUy6rNXZrebYY0m-1HplW0JNTIoD-Ssmum8jw_-DV0Qrt520x6G7qTY48DBNK3uEpcd53N-D35Lmq_yVuL1lTQ6yhp5WK6KbNDa2pySBmDNDdnLUgqw9VgbGrc03TV-QvSzryikpHPMHjnzKWy1IVBzlLaR0nAJ9HjdClOkQqNVSDYCdy0vvI-3NoZNpbM9SoF-27U"
                                    />
                                </div>
                            </div>
                            <div className="group text-center">
                                <div className="bg-white w-24 h-24 mx-auto rounded-full shadow-lg border-4 border-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-4xl text-primary">analytics</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">2. Análise</h3>
                                <p className="text-slate-600 leading-relaxed px-4">
                                    Nossos algoritmos processam os dados instantaneamente, identificando fatores de risco e mantendo o anonimato estrito.
                                </p>
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 mx-auto max-w-xs transform group-hover:-translate-y-1 transition-transform">
                                    <img
                                        alt="Analysis Dashboard"
                                        className="rounded shadow-sm opacity-90"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdWOC4G_GFtfv0oG9USegnMJWsp5JpEkR3tWgkoOFKiFyVu9yzBnMOZfpUVPxKF5cmzvvuc5guynO6Sm3wgeKnrJdVA1wTf5EOQrLAw5LhQCp9cPYNst-20iZVl4_fEFX9sCXo7PyvfR7llBNg8E6cc8duMSZPjMu4CQOr2kJg8Mym05xcTmahTfZ8Eunf9T1ZB3vwt2xN7aP3v_vXKKy-PC22CobB1vIoRUQc2bMTyKsgyxb6w3g_J1SSyWfPc-aCa57x04bB-a8"
                                    />
                                </div>
                            </div>
                            <div className="group text-center">
                                <div className="bg-white w-24 h-24 mx-auto rounded-full shadow-lg border-4 border-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-4xl text-primary">assignment_turned_in</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">3. Relatório Acionável</h3>
                                <p className="text-slate-600 leading-relaxed px-4">
                                    Receba relatórios abrangentes com recomendações claras para RH e documentação de conformidade legal.
                                </p>
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 mx-auto max-w-xs transform group-hover:-translate-y-1 transition-transform">
                                    <img
                                        alt="Final Report"
                                        className="rounded shadow-sm opacity-90"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBr71OqVG7z_0wuFgTJliFvVZB_81WJVo30xePop1HLtN_TFQgyJ1wslW91IMgQ2GCBH1gDyOLellMcgIQXg09O7IPbtl46jrdr8IG2aLRLXwN7HTkTnRO3NrTJ6CrA_7cN11ZXUufO-ex239RriXl27_KBoaJZiSXN1WrSx8gBdCJUY_p9cXmmKw1z5uhUW9wywmgxzdTNoCZ4IxtuOdwHgnU4Qho06dGxffOXjWblblCxajOIdTJiS7jie7k1-2BbbW4_CAQubwM"
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
                            <span className="text-primary font-bold text-sm uppercase tracking-widest mb-2 block">Por Que Importa</span>
                            <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900">Cultivando uma Mentalidade Saudável</h2>
                            <p className="mt-4 text-slate-600 text-lg">Além da conformidade, focamos no aspecto humano da sua organização. Mentes saudáveis levam a negócios resilientes.</p>
                        </div>
                        <button className="bg-primary hover:bg-teal-700 text-white px-6 py-3 rounded-lg border border-primary/10 transition-all flex items-center gap-2">
                            Baixar Brochura <span className="material-symbols-outlined text-sm">download</span>
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">self_improvement</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Redução de Burnout</h3>
                            <p className="text-slate-600 leading-relaxed">A identificação precoce de fatores de estresse ajuda a prevenir o esgotamento dos colaboradores e afastamentos.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">sentiment_content</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Inteligência Emocional</h3>
                            <p className="text-slate-600 leading-relaxed">Dados que ajudam a liderança a entender o clima emocional de suas equipes.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">diversity_1</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Melhora na Retenção</h3>
                            <p className="text-slate-600 leading-relaxed">Colaboradores permanecem onde se sentem ouvidos e cuidados. Reduza significativamente os custos de rotatividade.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">verified_user</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Salvaguardas Legais</h3>
                            <p className="text-slate-600 leading-relaxed">Evidências documentadas de cuidado proativo protegem a empresa contra ações de responsabilidade.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">monitor_heart</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Monitoramento Contínuo</h3>
                            <p className="text-slate-600 leading-relaxed">Acompanhe o progresso ao longo do tempo com dados longitudinais, não apenas avaliações pontuais.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-slate-100 hover:border-primary/50 transition-all duration-300 group hover:-translate-y-1 shadow-soft">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900">Aumento de Produtividade</h3>
                            <p className="text-slate-600 leading-relaxed">Uma força de trabalho mentalmente saudável é uma força de trabalho focada e produtiva.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-white" id="testimonials">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">Impacto Real</span>
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mt-4">Aprovado por Diretores de RH</h2>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100 flex flex-col md:flex-row gap-8 items-center md:items-start relative">
                            <div className="flex-shrink-0 relative">
                                <img alt="Sarah Jenkins" className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIY8-eVVnjBG-yaWY2kvTyyKgaqd2_yUh-LvIxbhhZmOFe3HgjCVlIQv9kdE4LBJwu9O3zT8-YDPf1p6E_uney6xQ3EGq2zfKsNBYHrlavE_ITHrNuqjSLuJvqUZ1ZcF7Qu5gAfJ5NBZAu7yfJhkvR2-IdpJK8K4qpI5aKiWukOl-l8nd11S59LcxX4ZaMwg_89N7K_E1-vUO8_rGwG0kwI5GZaQoNL2moz58umKWaJR0F-YMJMH5jK6Gwf6o2HmOPeoYULE-3Pgk" />
                                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1 rounded-full border-2 border-white">
                                    <span className="material-symbols-outlined text-sm">format_quote</span>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-slate-600 text-lg leading-relaxed italic mb-4">
                                    "A empatia no design combinada com o rigor dos dados é impressionante. Não apenas nos ajudou a cumprir uma exigência legal, mas realmente melhorou o moral da equipe em 3 meses."
                                </p>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Sarah Jenkins</h4>
                                    <p className="text-sm text-slate-500">Diretora de Pessoas & Cultura, TechFlow</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100 flex flex-col md:flex-row gap-8 items-center md:items-start relative">
                            <div className="flex-shrink-0 relative">
                                <img alt="Michael Chen" className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-md" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-LcrZceZ5ADbRP2H5MHgfUEDAbkJSF4SIfarwep6zGQKO35gMSyuzTYIEUjs8N_dTTg_EX5Jsc8WlRJSZWXWrWJG4V6dktGk4BndfKotqSAhVExa8eTbr8L_bT_sNn3ViyS5ItfsvrXS1T-mN5RC5Z_phbRgE_vzonoqOgVC4qQsKIrUYtM5eS7rqjD7bgXEaHVJ-RjOT5nGQ-gO-iHzrzmR3gTeJDe6F8sI-8SHSDqPBG0rKf1jqtGHx_aMm0f2Te1mDcTMCfuk" />
                                <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1 rounded-full border-2 border-white">
                                    <span className="material-symbols-outlined text-sm">format_quote</span>
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-slate-600 text-lg leading-relaxed italic mb-4">
                                    "Finalmente, uma ferramenta que respeita o tempo e a privacidade do funcionário, enquanto nos fornece o painel que precisamos para reuniões de diretoria. Os relatórios são detalhados e fáceis de ler."
                                </p>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Michael Chen</h4>
                                    <p className="text-sm text-slate-500">VP de RH, SOMA Construções</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-16 pt-10 border-t border-slate-200 flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <span className="text-2xl font-display font-bold text-slate-400">Google</span>
                        <span className="text-2xl font-display font-bold text-slate-400">Microsoft</span>
                        <span className="text-2xl font-display font-bold text-slate-400">Spotify</span>
                        <span className="text-2xl font-display font-bold text-slate-400">Airbnb</span>
                        <span className="text-2xl font-display font-bold text-slate-400">Slack</span>
                    </div>
                </div>
            </section>

            <PlansModal
                isOpen={isPlansModalOpen}
                onClose={() => setIsPlansModalOpen(false)}
                onPlanSelect={handlePlanSelect}
            />

            <section className="py-24 bg-white relative" id="pricing">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold text-xs uppercase tracking-widest">Preços</span>
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mt-2">Invista no Seu Pessoal</h2>
                        <p className="mt-4 text-slate-500">Preços transparentes para empresas de todos os portes.</p>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={() => setIsPlansModalOpen(true)}
                            className="bg-primary hover:bg-teal-700 text-white px-12 py-4 rounded-xl font-bold transition-all shadow-xl shadow-primary/30 text-lg transform hover:-translate-y-1"
                        >
                            Ver Planos e Preços
                        </button>
                    </div>
                </div>
            </section>

            <footer className="bg-white text-slate-500 py-16 border-t border-slate-100">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <img src={logo} alt="Gama Logo" className="w-8 h-8 object-contain" />
                                <span className="text-slate-900 font-display font-bold text-xl tracking-tight">Gama Center</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                Preenchendo a lacuna entre os requisitos corporativos e as necessidades humanas. Tornamos a conformidade empática.
                            </p>
                            <div className="flex gap-4">
                                <a className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center hover:bg-primary hover:text-white transition-colors" href="#"><span className="material-symbols-outlined text-sm">public</span></a>
                                <a className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center hover:bg-primary hover:text-white transition-colors" href="#"><span className="material-symbols-outlined text-sm">mail</span></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-bold mb-6">Plataforma</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a className="hover:text-primary transition-colors" href="#">Avaliação Psicossocial</a></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Conformidade Legal</a></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Planos de Preços</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-bold mb-6">Recursos</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a className="hover:text-primary transition-colors" href="#">Guias de RH</a></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Blog de Bem-estar</a></li>
                                <li><a className="hover:text-primary transition-colors" href="#">Estudos de Caso</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-bold mb-6">Entre em Contato</h4>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">mail</span> support@gamacenter.com</li>
                                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">call</span> +55 11 99999-9999</li>
                                <li className="mt-4 text-xs text-slate-400">Av. Paulista, 1000 - São Paulo, SP</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
                        <p>© 2023 Gama Center. Todos os direitos reservados.</p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <a className="hover:text-slate-600 transition-colors" href="#">Política de Privacidade</a>
                            <a className="hover:text-slate-600 transition-colors" href="#">Termos de Serviço</a>
                            <a className="hover:text-slate-600 transition-colors" href="#">Configurações de Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                selectedPackage={selectedPackage}
            />
        </div >
    );
};
