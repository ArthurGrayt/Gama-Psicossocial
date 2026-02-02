import React, { useState } from 'react';
import { ArrowLeft, Copy, Users, CheckCircle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { Form } from '../../types';

interface SurveyDetailsProps {
    form: Form;
    onBack: () => void;
}

// --- MOCK DATA ---
const PARTICIPANTS = [
    { id: 1, name: 'Ana Silva', sector: 'Financeiro', role: 'Analista Pleno', status: 'completed' },
    { id: 2, name: 'Carlos Oliveira', sector: 'TI', role: 'Desenvolvedor Senior', status: 'pending' },
    { id: 3, name: 'Mariana Santos', sector: 'RH', role: 'Coordenadora', status: 'completed' },
    { id: 4, name: 'João Pereira', sector: 'Operações', role: 'Operador I', status: 'completed' },
    { id: 5, name: 'Beatriz Costa', sector: 'Financeiro', role: 'Gerente', status: 'pending' },
    { id: 6, name: 'Lucas Lima', sector: 'TI', role: 'DevOps', status: 'completed' },
    { id: 7, name: 'Fernanda Rocha', sector: 'Marketing', role: 'Analista Jr', status: 'completed' },
    { id: 8, name: 'Rafael Souza', sector: 'Operações', role: 'Supervisor', status: 'pending' },
];

const RADAR_DATA = [
    { subject: 'Demanda', A: 120, fullMark: 150 },
    { subject: 'Controle', A: 98, fullMark: 150 },
    { subject: 'Apoio Social', A: 86, fullMark: 150 },
    { subject: 'Relacionamento', A: 99, fullMark: 150 },
    { subject: 'Recompensa', A: 85, fullMark: 150 },
    { subject: 'Justiça', A: 65, fullMark: 150 },
];

const HEATMAP_DATA = [
    { sector: 'Financeiro', risk: 'Baixo', score: 2.5 },
    { sector: 'TI', risk: 'Médio', score: 5.8 },
    { sector: 'RH', risk: 'Baixo', score: 1.2 },
    { sector: 'Operações', risk: 'Alto', score: 8.4 },
    { sector: 'Marketing', risk: 'Médio', score: 4.5 },
];

const QUESTIONS_LIST = [
    { id: 1, text: "O meu trabalho exige que eu trabalhe muito rápido.", category: "Demanda" },
    { id: 2, text: "O meu trabalho exige muito de mim intelectualmente.", category: "Demanda" },
    { id: 3, text: "Tenho possibilidade de decidir como realizar o meu trabalho.", category: "Controle" },
    { id: 4, text: "Recebo apoio dos meus colegas para realizar o trabalho.", category: "Apoio Social" },
];

// DONUT CHART DATA
const ADHESION_DATA = [
    { name: 'Respondido', value: 65 },
    { name: 'Pendente', value: 35 },
];
const COLORS = ['#35b6cf', '#e2e8f0']; // Primary Cyan, Slate 200

export const SurveyDetails: React.FC<SurveyDetailsProps> = ({ form, onBack }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { value: 'overview', label: 'Visão Geral' },
        { value: 'analysis', label: 'Análise Interpretativa' },
        { value: 'editor', label: 'Editor de Perguntas' },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[calc(100vh-140px)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            {/* HERDER */}
            <div className="border-b border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-xl text-slate-800 tracking-tight">{form.title}</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Ativo
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">Criado em {form.created_at ? new Date(form.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <SegmentedControl
                        options={tabs}
                        value={activeTab}
                        onChange={setActiveTab}
                        className="flex-1 md:flex-none"
                    />
                    <button className="flex items-center gap-2 bg-[#35b6cf] hover:bg-[#2ca1b7] text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm active:scale-95">
                        <Copy size={16} />
                        <span className="hidden sm:inline">Copiar Link</span>
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 p-8 bg-slate-50/50 overflow-y-auto">

                {/* --- TAB A: VISÃO GERAL --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 max-w-7xl mx-auto">
                        {/* Status Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-sm font-medium text-slate-500 mb-1">Total de Convidados</p>
                                <h3 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                                    {PARTICIPANTS.length * 3}
                                    <Users size={20} className="text-slate-300" />
                                </h3>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <p className="text-sm font-medium text-slate-500 mb-1">Respostas Recebidas</p>
                                <h3 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                                    {PARTICIPANTS.filter(p => p.status === 'completed').length * 3}
                                    <CheckCircle size={20} className="text-[#35b6cf]" />
                                </h3>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden h-32">
                                <div className="z-10">
                                    <p className="text-sm font-medium text-slate-500 mb-1">Taxa de Adesão</p>
                                    <h3 className="text-3xl font-bold text-slate-900">65%</h3>
                                </div>
                                <div className="w-24 h-24">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={ADHESION_DATA}
                                                innerRadius={25}
                                                outerRadius={40}
                                                paddingAngle={0}
                                                dataKey="value"
                                                startAngle={90}
                                                endAngle={-270}
                                                stroke="none"
                                            >
                                                {ADHESION_DATA.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Participants Table */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                                <h3 className="font-bold text-lg text-slate-800">Lista de Participantes</h3>
                                <button className="text-sm text-[#35b6cf] font-medium hover:underline">Ver apenas pendentes</button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3">Nome</th>
                                        <th className="px-6 py-3">Setor</th>
                                        <th className="px-6 py-3">Cargo</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {PARTICIPANTS.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-900">{p.name}</td>
                                            <td className="px-6 py-3 text-slate-500">{p.sector}</td>
                                            <td className="px-6 py-3 text-slate-500">{p.role}</td>
                                            <td className="px-6 py-3">
                                                {p.status === 'completed' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        Respondido
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                        Pendente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                {p.status === 'pending' && (
                                                    <button className="text-xs font-medium text-[#35b6cf] hover:text-[#2ca1b7] hover:underline">
                                                        Enviar Lembrete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB B: ANÁLISE INTERPRETATIVA --- */}
                {activeTab === 'analysis' && (
                    <div className="space-y-8 max-w-6xl mx-auto">
                        {/* Intro Card */}
                        <div className="bg-[#35b6cf]/10 border border-[#35b6cf]/20 p-6 rounded-xl flex items-start gap-4">
                            <div className="p-2 bg-white rounded-lg text-[#35b6cf] shadow-sm">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#35b6cf] text-lg">Análise em Tempo Real</h3>
                                <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                                    Os dados abaixo são processados automaticamente com base nas respostas.
                                    O gráfico de radar destaca as dimensões psicossociais predominantes e o mapa de calor identifica áreas críticas.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Radar Chart */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
                                <h3 className="font-bold text-lg text-slate-800 mb-6">Dimensões Psicossociais</h3>
                                <div className="flex-1 w-full min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                            <Radar
                                                name="Nível Atual"
                                                dataKey="A"
                                                stroke="#35b6cf"
                                                strokeWidth={3}
                                                fill="#35b6cf"
                                                fillOpacity={0.2}
                                            />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Heatmap List */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-lg text-slate-800 mb-6">Mapa de Risco por Setor</h3>
                                <div className="space-y-4">
                                    {HEATMAP_DATA.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-700">{item.sector}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${item.risk === 'Alto' ? 'bg-red-500' :
                                                                item.risk === 'Médio' ? 'bg-amber-400' : 'bg-emerald-500'
                                                                }`}
                                                            style={{ width: `${(item.score / 10) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-500">{item.score}</span>
                                                </div>
                                            </div>
                                            <div className={`
                                                px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                                                ${item.risk === 'Alto' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                    item.risk === 'Médio' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                }
                                            `}>
                                                {item.risk}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB C: EDITOR (READ ONLY) --- */}
                {activeTab === 'editor' && (
                    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Perguntas do Formulário</h3>
                                <p className="text-slate-500 text-sm">Visualização da estrutura atual.</p>
                            </div>
                            <button className="text-sm font-medium text-[#35b6cf] border border-[#35b6cf] px-3 py-1.5 rounded-lg hover:bg-[#35b6cf] hover:text-white transition-colors">
                                Editar Ordem
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {QUESTIONS_LIST.map((q, index) => (
                                <div key={q.id} className="p-5 flex gap-4 hover:bg-slate-50 group">
                                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 font-bold rounded-lg text-sm group-hover:bg-[#35b6cf] group-hover:text-white transition-colors">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">{q.category}</span>
                                        <p className="text-slate-800 font-medium">{q.text}</p>
                                    </div>
                                    <div className="text-slate-400 text-sm flex items-center gap-2">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs">Escala Likert 1-5</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
