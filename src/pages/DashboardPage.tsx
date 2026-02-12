import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Building, Wallet, ChevronRight, CheckCircle, Clock, Info } from 'lucide-react';
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
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                            Bom dia, Arthur. <span className="text-2xl">👋</span>
                        </h1>
                        <p className="text-slate-500 mt-1 text-lg">
                            Você tem <span className="text-[#35b6cf] font-bold">{pendingResponses} avaliações críticas</span> pendentes hoje.
                        </p>
                    </div>
                </div>

                {/* 2. TOP CARDS GRID (BENTO) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">

                    {/* TOKEN WALLET CARD */}
                    <div className="bg-[#f0f9fa] rounded-[2rem] p-6 shadow-sm border border-[#35b6cf]/20 relative group flex flex-col justify-between h-full hover:shadow-md transition-shadow">
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
                                    <h3 className="text-3xl font-black tracking-tight text-slate-800">{tokenBalance} <span className="text-lg font-medium text-slate-400">Tokens</span></h3>
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
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group h-full">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-slate-500">Empresas</span>
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                <Building size={20} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{companiesCount}</h3>
                        </div>
                    </div>

                    {/* KPI 1: RESPONDIDOS */}
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group h-full">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-slate-500">Respondidos</span>
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                                {totalResponses >= 1000 ? `${(totalResponses / 1000).toFixed(1)}k` : totalResponses}
                            </h3>
                        </div>
                    </div>

                    {/* KPI 2: PENDENTES */}
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group h-full">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-slate-500">Pendentes</span>
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                <Clock size={20} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{pendingResponses}</h3>
                        </div>
                    </div>
                </div>

                {/* 3. MIDDLE SECTION - Ranking & Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-1">
                        <RankingGeralWidget />
                    </div>
                    {/* Placeholder for future charts/widgets */}
                    <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center p-8 text-slate-400">
                        <span className="text-sm">Área disponível para gráficos detalhados</span>
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
