
import React from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Building, FileText, CheckCircle, Clock } from 'lucide-react';

const DashboardStats: React.FC = () => {
    const stats = [
        {
            label: "Formulários Gerados",
            value: "1,248",
            trend: "+12% este mês",
            color: "blue",
            icon: FileText
        },
        {
            label: "Respondidos",
            value: "856",
            trend: "68% taxa de resposta",
            color: "green",
            icon: CheckCircle
        },
        {
            label: "Pendentes",
            value: "392",
            trend: "Aguardando envio",
            color: "orange",
            icon: Clock
        },
        {
            label: "Empresas Ativas",
            value: "12",
            trend: "+2 novas",
            color: "slate",
            icon: Building
        }
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'green': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'orange': return 'bg-orange-50 text-orange-600 border-orange-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${getColorClasses(stat.color)}`}>
                            <stat.icon size={24} />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.color === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {stat.trend}
                        </span>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-slate-400 block mb-1">{stat.label}</span>
                        <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const DashboardPage: React.FC = () => {
    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1">Bem-vindo de volta! Aqui está o resumo das suas atividades.</p>
                </div>

                <DashboardStats />

                {/* Visual Placeholder for more dashboard content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-96 flex items-center justify-center text-slate-400 italic">
                        Gráfico de Tendências (Em breve)
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-96 flex items-center justify-center text-slate-400 italic">
                        Atividades Recentes (Em breve)
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
