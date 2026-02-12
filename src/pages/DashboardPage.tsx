import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Building, Wallet, ChevronRight, CheckCircle, Clock, Activity, Calendar, Info, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PlanSelectionModal } from '../components/modals/PlanSelectionModal';
import { PaymentModal } from '../components/modals/PaymentModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';



// Mock Data for Risk Ranking (Lowest Adherence First)
const MOCK_RISK_DATA = [
    { id: 1, name: 'Logística - Filial RJ', total: 20, responses: 4, percentage: 20, status: 'critical' as const },
    { id: 2, name: 'Produção - Planta A', total: 100, responses: 45, percentage: 45, status: 'warning' as const },
    { id: 3, name: 'Vendas - Filial SP', total: 30, responses: 18, percentage: 60, status: 'warning' as const },
    { id: 4, name: 'TI - Matriz', total: 20, responses: 19, percentage: 95, status: 'good' as const },
];

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [activeFilter, setActiveFilter] = useState<'semanal' | 'quinzenal' | 'mensal'>('mensal');
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<{ id: string; name: string; tokens: number; price: string } | null>(null);
    const [companiesCount, setCompaniesCount] = useState<number>(0);
    const [totalResponses, setTotalResponses] = useState<number>(0);
    const [tokenBalance, setTokenBalance] = useState<number>(0);

    const handlePlanSelect = (pkg: { id: string; name: string; tokens: number; price: string }) => {
        console.log('Pacote selecionado:', pkg);
        setSelectedPackage(pkg);
        setIsPlanModalOpen(false);
        setIsPaymentModalOpen(true);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;

            try {
                // 0. Fetch User Tokens
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('tokens')
                    .eq('user_id', user.id)
                    .single();

                if (userError) {
                    console.error('Error fetching user tokens:', userError);
                } else if (userData) {
                    setTokenBalance(userData.tokens || 0);
                }

                // 1. Fetch Companies Count
                const { data: companies, error: companiesError } = await supabase
                    .from('clientes')
                    .select('id, cliente_uuid')
                    .eq('empresa_responsavel', user.id);

                if (companiesError) {
                    console.error('Error fetching companies:', companiesError);
                } else {
                    setCompaniesCount(companies?.length || 0);

                    if (companies && companies.length > 0) {
                        const clienteUuids = companies.map(c => c.cliente_uuid);

                        // 2. Fetch Units for these companies
                        const { data: units, error: unitsError } = await supabase
                            .from('unidades')
                            .select('id')
                            .in('empresa_mae', clienteUuids);

                        if (unitsError) {
                            console.error('Error fetching units:', unitsError);
                        } else if (units && units.length > 0) {
                            const unitIds = units.map(u => u.id);

                            // 3. Fetch Forms for these units and sum responses
                            const { data: forms, error: formsError } = await supabase
                                .from('forms')
                                .select('qtd_respostas')
                                .in('unidade_id', unitIds);

                            if (formsError) {
                                console.error('Error fetching forms:', formsError);
                            } else if (forms) {
                                const total = forms.reduce((sum, f) => sum + (f.qtd_respostas || 0), 0);
                                setTotalResponses(total);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Exception fetching dashboard data:', err);
            }
        };

        fetchDashboardData();
    }, [user]);

    // Filtered Mock Data
    const CHART_DATA = {
        semanal: [
            { name: 'Seg', generated: 50, responses: 30 },
            { name: 'Ter', generated: 80, responses: 45 },
            { name: 'Qua', generated: 120, responses: 70 },
            { name: 'Qui', generated: 60, responses: 40 },
            { name: 'Sex', generated: 90, responses: 55 },
            { name: 'Sab', generated: 30, responses: 20 },
            { name: 'Dom', generated: 20, responses: 15 },
        ],
        quinzenal: [
            { name: 'D1-3', generated: 150, responses: 100 },
            { name: 'D4-6', generated: 200, responses: 130 },
            { name: 'D7-9', generated: 180, responses: 110 },
            { name: 'D10-12', generated: 250, responses: 160 },
            { name: 'D13-15', generated: 220, responses: 140 },
        ],
        mensal: [
            { name: 'Jan', generated: 400, responses: 240 },
            { name: 'Fev', generated: 300, responses: 139 },
            { name: 'Mar', generated: 200, responses: 980 },
            { name: 'Abr', generated: 278, responses: 390 },
            { name: 'Mai', generated: 189, responses: 480 },
            { name: 'Jun', generated: 239, responses: 380 },
        ]
    };

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
                            Você tem <span className="text-[#35b6cf] font-bold">3 avaliações críticas</span> pendentes hoje.
                        </p>
                    </div>
                </div>

                {/* 2. TOP CARDS GRID (BENTO) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">

                    {/* TOKEN WALLET CARD (Gradient) */}
                    {/* TOKEN WALLET CARD (Gradient) */}
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
                            <div className="flex items-center gap-1 mt-1 text-blue-500 font-bold text-sm">
                                <Building size={16} />
                                <span>Ativas</span>
                            </div>
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
                            <div className="flex items-center gap-1 mt-1 text-emerald-500 font-bold text-sm">
                                <CheckCircle size={16} />
                                <span>Total acumulado</span>
                            </div>
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
                            <h3 className="text-3xl font-bold text-slate-800 tracking-tight">45</h3>
                            <div className="flex items-center gap-1 mt-1 text-amber-500 font-bold text-sm">
                                <Activity size={16} />
                                <span>Requer atenção</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. MAIN CONTENT GRID (Charts + Lists) */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* LEFT PANEL: Chart (60% -> col-span-3) */}
                    <div className="lg:col-span-3 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Engajamento</h3>
                            <div className="flex flex-wrap gap-2">
                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                    <button
                                        onClick={() => setActiveFilter('semanal')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === 'semanal' ? 'bg-white text-[#35b6cf] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Semanal
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('quinzenal')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === 'quinzenal' ? 'bg-white text-[#35b6cf] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Quinzenal
                                    </button>
                                    <button
                                        onClick={() => setActiveFilter('mensal')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === 'mensal' ? 'bg-white text-[#35b6cf] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Mensal
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group">
                                    <Calendar size={14} className="text-slate-400 group-hover:text-[#35b6cf]" />
                                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">Período personalizado</span>
                                </div>
                            </div>
                        </div>
                        {/* Chart */}
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={CHART_DATA[activeFilter]}>
                                    <CartesianGrid vertical={false} strokeDasharray="4 8" stroke="#e2e8f0" strokeOpacity={0.6} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="generated" name="Formulários Gerados" fill="#35b6cf" radius={[8, 8, 0, 0]} barSize={32} />
                                    <Bar dataKey="responses" name="Respostas" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Risk Monitor (40% -> col-span-2) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm h-full flex flex-col max-h-[500px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800">Monitor de Adesão</h3>
                                <button className="text-[#35b6cf] text-xs font-bold hover:underline">Ver todos</button>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {MOCK_RISK_DATA.map((item) => (
                                    <div key={item.id} className="group relative">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                            <span className="text-xs font-medium text-slate-400">
                                                <span className={`${item.status === 'critical' ? 'text-rose-500 font-bold' : item.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                    {item.percentage}%
                                                </span>
                                                {' '}({item.responses}/{item.total})
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${item.status === 'critical' ? 'bg-rose-500' :
                                                    item.status === 'warning' ? 'bg-amber-400' :
                                                        'bg-emerald-400'
                                                    }`}
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>

                                        {/* Action Button (Visible on Hover for Critical Items) */}
                                        {item.status === 'critical' && (
                                            <div className="absolute right-0 -top-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                <button
                                                    className="bg-rose-500 text-white p-2 rounded-lg shadow-lg hover:bg-rose-600 transition-colors flex items-center gap-2 text-xs font-bold group/btn"
                                                    title="Notificar Pendentes"
                                                >
                                                    <Bell size={12} className="group-hover/btn:animate-swing" />
                                                    Notificar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

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
        </DashboardLayout >
    );
};
