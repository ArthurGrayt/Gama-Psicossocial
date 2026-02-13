import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Building, Wallet, ChevronRight, CheckCircle, Clock, Info, TrendingUp, Users, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PlanSelectionModal } from '../components/modals/PlanSelectionModal';
import { PaymentModal } from '../components/modals/PaymentModal';
import { useAuth } from '../contexts/AuthContext';
import { RankingGeralWidget } from '../components/RankingGeralWidget';



import { useDashboardKPIs } from '../hooks/useDashboardKPIs';

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { stats } = useDashboardKPIs(user);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<{ id: string; name: string; tokens: number; price: string } | null>(null);

    // Destructure stats for easier usage in the template
    const {
        tokenBalance,
        companiesCount,
        totalResponses,
        pendingResponses
    } = stats;

    const handlePlanSelect = (pkg: { id: string; name: string; tokens: number; price: string }) => {
        console.log('Pacote selecionado:', pkg);
        setSelectedPackage(pkg);
        setIsPlanModalOpen(false);
        setIsPaymentModalOpen(true);
    };

    // REMOVED local useEffect data fetching


    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* 1. WELCOME HEADER */}
                <div className="flex justify-between items-end mb-4 md:mb-8">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-slate-800 tracking-tight">
                            Bom dia, Arthur. <span className="text-lg md:text-2xl">👋</span>
                        </h1>
                    </div>
                </div>

                {/* 2. TOP CARDS GRID (BENTO) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-8">

                    {/* TOKEN WALLET CARD */}
                    <div className="col-span-2 lg:col-span-1 bg-[#f0f9fa] rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-[#35b6cf]/20 relative group flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <div className="flex items-center gap-1.5 group/info relative">
                                        <Wallet size={16} className="text-[#35b6cf]" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Minha Carteira</span>
                                        <Info size={14} className="text-slate-300 cursor-help" />

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-0 mb-3 w-56 p-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl opacity-0 group-hover/info:opacity-100 transition-all duration-300 translate-y-2 group-hover/info:translate-y-0 pointer-events-none shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] z-50">
                                            <div className="flex items-start gap-2">
                                                <div className="mt-0.5 p-1 bg-[#35b6cf]/10 rounded-lg">
                                                    <Info size={12} className="text-[#35b6cf]" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-[11px] leading-tight">Métrica de Consumo</p>
                                                    <p className="text-slate-500 text-[10px] mt-0.5 leading-relaxed">
                                                        Cada **1 token** equivale à geração de **1 formulário** no sistema.
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-4 -mt-1 w-3 h-3 bg-white/90 border-r border-b border-slate-200 rotate-45"></div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">{tokenBalance} <span className="text-sm md:text-lg font-medium text-slate-400">Tokens</span></h3>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsPlanModalOpen(true)}
                                className="bg-white hover:bg-[#35b6cf]/10 text-[#35b6cf] border border-[#35b6cf]/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 w-fit mt-3 shadow-sm">
                                Recarregar
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>

                    {/* KPI 3: EMPRESAS */}
                    <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group h-full">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-slate-500">Empresas</span>
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                <Building size={20} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">{companiesCount}</h3>
                        </div>
                    </div>

                    {/* KPI 1: RESPONDIDOS */}
                    <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group h-full">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-slate-500">Respondidos</span>
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                                {totalResponses >= 1000 ? `${(totalResponses / 1000).toFixed(1)}k` : totalResponses}
                            </h3>
                        </div>
                    </div>

                    {/* KPI 2: PENDENTES */}
                    <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group h-full">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-slate-500">Pendentes</span>
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                <Clock size={20} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">{pendingResponses}</h3>
                        </div>
                    </div>
                </div>

                {/* 3. MIDDLE SECTION - Ranking & Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-8">
                    <div className="lg:col-span-1">
                        <RankingGeralWidget />
                    </div>
                    {/* Ranking Explanation Card */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#35b6cf]/20 to-emerald-500/20 flex items-center justify-center shrink-0">
                                <TrendingUp size={20} className="text-[#35b6cf]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Como funciona o Score Global?</h3>
                                <p className="text-xs text-slate-400">Entenda o ranking de desempenho das suas empresas</p>
                            </div>
                        </div>

                        {/* Explanation */}
                        <p className="text-sm text-slate-500 leading-relaxed mb-5">
                            O <strong className="text-slate-700">Score Global</strong> é calculado com base nas respostas dos colaboradores aos questionários psicossociais da plataforma. Ele avalia fatores de <strong className="text-slate-700">risco e proteção</strong> no ambiente de trabalho, gerando uma nota que representa a saúde organizacional da empresa.
                        </p>

                        {/* Classification Tiers */}
                        <div className="mb-5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Classificações</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100/70">
                                    <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs font-bold text-emerald-700">Excelente</span>
                                        <p className="text-[11px] text-emerald-600/80 leading-snug mt-0.5">Ambiente saudável com baixo risco psicossocial.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100/70">
                                    <Users size={18} className="text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs font-bold text-blue-700">Bom</span>
                                        <p className="text-[11px] text-blue-600/80 leading-snug mt-0.5">Alguns pontos de atenção, mas dentro do esperado.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50/70 border border-red-100/70">
                                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-xs font-bold text-red-600">Risco</span>
                                        <p className="text-[11px] text-red-500/80 leading-snug mt-0.5">Fatores críticos identificados que exigem intervenção.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Insight */}
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#35b6cf]/5 to-emerald-500/5 rounded-xl border border-[#35b6cf]/10">
                            <Info size={14} className="text-[#35b6cf] shrink-0" />
                            <p className="text-xs text-slate-500">
                                Quanto <strong className="text-slate-700">maior</strong> o score, melhor a saúde organizacional da empresa. Use este ranking para priorizar ações de melhoria.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            <PlanSelectionModal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                onSelect={handlePlanSelect}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                selectedPackage={selectedPackage}
            />
        </DashboardLayout>
    );
};
