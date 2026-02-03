import React, { useState } from 'react';
import { ArrowLeft, Copy, Clock, Search, FileText, X } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { Form } from '../../types';

interface SurveyDetailsProps {
    form: Form;
    onBack: () => void;
}

// --- MOCK DATA ---
const PARTICIPANTS = [
    { id: 1, name: 'Ana Silva', sector: 'Financeiro', role: 'Analista Pleno', status: 'completed', submitted_at: '02/02/2026, 14:30:00' },
    { id: 2, name: 'Carlos Oliveira', sector: 'TI', role: 'Desenvolvedor Senior', status: 'pending', submitted_at: null },
    { id: 3, name: 'Mariana Santos', sector: 'RH', role: 'Coordenadora', status: 'completed', submitted_at: '02/02/2026, 10:15:00' },
    { id: 4, name: 'João Pereira', sector: 'Operações', role: 'Operador I', status: 'completed', submitted_at: '01/02/2026, 16:45:00' },
    { id: 5, name: 'Beatriz Costa', sector: 'Financeiro', role: 'Gerente', status: 'pending', submitted_at: null },
    { id: 6, name: 'Lucas Lima', sector: 'TI', role: 'DevOps', status: 'completed', submitted_at: '02/02/2026, 09:20:00' },
    { id: 7, name: 'Fernanda Rocha', sector: 'Marketing', role: 'Analista Jr', status: 'completed', submitted_at: '31/01/2026, 11:10:00' },
    { id: 8, name: 'Rafael Souza', sector: 'Operações', role: 'Supervisor', status: 'pending', submitted_at: null },
];

const RADAR_DATA = [
    { subject: 'Demandas', A: 3.2, fullMark: 4 },
    { subject: 'Controle', A: 2.6, fullMark: 4 },
    { subject: 'Apoio da Chefia', A: 2.3, fullMark: 4 },
    { subject: 'Apoio dos Colegas', A: 2.6, fullMark: 4 },
    { subject: 'Relacionamentos', A: 2.2, fullMark: 4 },
    { subject: 'Cargo', A: 1.7, fullMark: 4 },
    { subject: 'Comunicação e Mudanças', A: 1.9, fullMark: 4 },
];


const QUESTIONS_LIST = [
    { id: 1, text: "O meu trabalho exige que eu trabalhe muito rápido.", category: "Demanda" },
    { id: 2, text: "O meu trabalho exige muito de mim intelectualmente.", category: "Demanda" },
    { id: 3, text: "Tenho possibilidade de decidir como realizar o meu trabalho.", category: "Controle" },
    { id: 4, text: "Recebo apoio dos meus colegas para realizar o trabalho.", category: "Apoio Social" },
];

export const SurveyDetails: React.FC<SurveyDetailsProps> = ({ form, onBack }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedSector, setSelectedSector] = useState<string>('');
    const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

    // Derive Sectors from Participants
    const distinctSectors = Array.from(new Set(PARTICIPANTS.map(p => p.sector)));

    // Filter Logic
    const filteredParticipants = selectedSector
        ? PARTICIPANTS.filter(p => p.sector === selectedSector)
        : PARTICIPANTS;

    const tabs = [
        { value: 'overview', label: 'Visão Geral' },
        { value: 'analysis', label: 'Análise Interpretativa' },
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
                            </span>
                        </div>
                        {/* Sector Dropdown Replacement */}
                        <div className="mt-1">
                            <select
                                value={selectedSector}
                                onChange={(e) => setSelectedSector(e.target.value)}
                                className="bg-slate-50 border-none text-sm text-slate-500 font-medium focus:ring-0 cursor-pointer hover:text-slate-700 py-0 pl-0 pr-8 transition-colors outline-none"
                            >
                                <option value="">Todos os Setores</option>
                                {distinctSectors.map(sector => (
                                    <option key={sector} value={sector}>{sector}</option>
                                ))}
                            </select>
                        </div>
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
                        {/* Status Cards Row (New Design) */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            {/* Participação */}
                            <div className="p-6 flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Participação</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-slate-900">
                                        {filteredParticipants.filter(p => p.status === 'completed').length}
                                    </span>
                                    <span className="text-lg text-slate-400 font-medium">
                                        /{filteredParticipants.length}
                                    </span>
                                </div>
                            </div>

                            {/* Total de Perguntas */}
                            <div className="p-6 flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total de Perguntas</p>
                                <span className="text-3xl font-bold text-slate-900">
                                    {QUESTIONS_LIST.length}
                                </span>
                            </div>

                            {/* Tempo Médio */}
                            <div className="p-6 flex flex-col items-center justify-center text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tempo Médio</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-slate-900">--</span>
                                    <span className="text-lg text-slate-900 font-bold">min</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Responses Table (New Design) */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                                <h3 className="font-bold text-lg text-slate-800">Respostas Recentes</h3>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar colaborador..."
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#35b6cf] transition-all"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="px-8 py-4">Participante</th>
                                            <th className="px-8 py-4">Data Envio</th>
                                            <th className="px-8 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredParticipants.filter(p => p.status === 'completed').map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                            {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-700">{p.name}</p>
                                                            <p className="text-xs text-slate-400">Anônimo</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="text-sm text-slate-500 font-medium">
                                                        {p.submitted_at}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedParticipant(p)}
                                                        className="text-slate-400 hover:text-[#35b6cf] transition-colors p-2 hover:bg-slate-50 rounded-lg"
                                                        title="Ver Respostas"
                                                    >
                                                        <FileText size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
                                            <PolarRadiusAxis angle={30} domain={[0, 4]} tick={true} tickCount={5} axisLine={false} />
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

                            {/* Analysis Criteria Card */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                <h3 className="font-bold text-lg text-slate-800 mb-4">Critério de análise:</h3>

                                <div className="space-y-3 mb-8 text-sm text-slate-600">
                                    <p>
                                        <span className="font-semibold text-slate-800">- Dimensões Demandas e Relacionamentos</span> &rarr; médias mais altas indicam maior risco.
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-800">- Demais dimensões (Controle, Apoio, Cargo, Comunicação/Mudanças)</span> &rarr; médias mais baixas indicam maior risco.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                                    {/* Higher Mean = Higher Risk */}
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-3">Quanto <em>maior</em> a média <em>maior</em> o risco:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2">
                                                <span className="w-16 font-medium text-slate-500">0 a 1:</span>
                                                <span className="font-bold text-emerald-600">baixo</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-16 font-medium text-slate-500">&gt;1 a 2:</span>
                                                <span className="font-bold text-cyan-600">médio</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-16 font-medium text-slate-500">&gt;2 a 3:</span>
                                                <span className="font-bold text-amber-500">moderado</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-16 font-medium text-slate-500">&gt;3 a 4:</span>
                                                <span className="font-bold text-red-600">alto</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Lower Mean = Higher Risk */}
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-3">Quanto <em>menor</em> a média <em>maior</em> o risco:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2">
                                                <span className="w-16 font-medium text-slate-500">0 a 1:</span>
                                                <span className="font-bold text-red-600">alto</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-16 font-medium text-slate-500">&gt;1 a 2:</span>
                                                <span className="font-bold text-amber-500">moderado</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-16 font-medium text-slate-500">&gt;2 a 3:</span>
                                                <span className="font-bold text-cyan-600">médio</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-16 font-medium text-slate-500">&gt;3 a 4:</span>
                                                <span className="font-bold text-emerald-600">baixo</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            </div>

            {/* RESPONSE MODAL */}
            {selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#35b6cf]/10 flex items-center justify-center text-[#35b6cf] font-bold text-lg">
                                    {selectedParticipant.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{selectedParticipant.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span>{selectedParticipant.sector}</span>
                                        <span>•</span>
                                        <span>{selectedParticipant.submitted_at}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedParticipant(null)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {QUESTIONS_LIST.map((q, idx) => (
                                <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-[#35b6cf] uppercase tracking-wider">{q.category}</span>
                                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                                    </div>
                                    <p className="font-medium text-slate-800 mb-3">{q.text}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500">Resposta:</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((val) => {
                                                // Mock random answer strictly for UI demo based on question ID + participant ID
                                                const mockAnswer = ((q.id + selectedParticipant.id) % 5) + 1;
                                                const isSelected = val === mockAnswer;
                                                return (
                                                    <div
                                                        key={val}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${isSelected
                                                            ? 'bg-[#35b6cf] border-[#35b6cf] text-white shadow-sm'
                                                            : 'bg-white border-slate-200 text-slate-300'
                                                            }`}
                                                    >
                                                        {val}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setSelectedParticipant(null)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
