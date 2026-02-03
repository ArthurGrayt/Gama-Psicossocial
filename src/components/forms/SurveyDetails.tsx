import React, { useState } from 'react';
import { ArrowLeft, Copy, Clock, Search, FileText, X, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector, Tooltip as RechartsTooltip } from 'recharts';
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

// Map colors to dimensions: Rose (Direct), Indigo (Inverse)
// Direct: Demandas, Relacionamentos
// Inverse: Others
const RADIAL_DATA = [
    { name: 'Demandas', value: 3.2, fill: '#f43f5e' }, // Rose-500
    { name: 'Relacionamentos', value: 2.2, fill: '#f43f5e' },
    { name: 'Controle', value: 2.6, fill: '#6366f1' }, // Indigo-500
    { name: 'Apoio da Chefia', value: 2.3, fill: '#6366f1' },
    { name: 'Apoio dos Colegas', value: 2.6, fill: '#6366f1' },
    { name: 'Cargo', value: 1.7, fill: '#6366f1' },
    { name: 'Comunicação', value: 1.9, fill: '#6366f1' }, // Shortened for legend
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

    // Custom renderer for Polar Area (Rose) Chart
    const renderCustomPolarSector = (props: any) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, value } = props;
        const maxValue = 4;
        // Calculate radius based on value (0 to 4) relative to the available radius space
        // We keep a small innerRadius for the 'donut' hole, then expand from there.
        const r = innerRadius + (outerRadius - innerRadius) * (Math.min(value, maxValue) / maxValue);

        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={r}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    stroke="#fff"
                    strokeWidth={1}
                />
            </g>
        );
    };

    const tabs = [
        { value: 'overview', label: 'Visão Geral' },
        { value: 'analysis', label: 'Análise Interpretativa' },
        { value: 'recorte', label: 'Recorte Interpretativo' },
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
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

                            {/* LEFT COLUMN: DIRECT RISK CARD */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Risco Direto</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Demandas & Relacionamentos</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                                        <span>Dimensão</span>
                                        <span>Média</span>
                                    </div>
                                    {RADIAL_DATA.filter(d => d.fill === '#f43f5e').map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <span className="font-medium text-slate-600 text-sm group-hover:text-slate-900 transition-colors pl-2 border-l-2 border-slate-100 group-hover:border-rose-400 pl-3">
                                                {item.name}
                                            </span>
                                            <span className={`text-xs px-3 py-1 rounded-full font-bold w-16 text-center ${item.value >= 3 ? 'bg-red-50 text-red-600' :
                                                    item.value >= 2 ? 'bg-orange-50 text-orange-600' :
                                                        'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Legend Restored */}
                                    <div className="pt-4 mt-2 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legenda de Risco</h4>
                                        <div className="space-y-2">
                                            {[
                                                { range: '3.0 - 4.0', label: 'Alto', color: 'bg-red-50 text-red-600 border border-red-100' },
                                                { range: '2.0 - 2.9', label: 'Moderado', color: 'bg-orange-50 text-orange-600 border border-orange-100' },
                                                { range: '1.0 - 1.9', label: 'Médio', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
                                                { range: '0.0 - 0.9', label: 'Baixo', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 font-medium">{item.range}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-20 text-center ${item.color}`}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="border-t border-slate-100 mt-6 pt-4 text-xs text-slate-400 italic text-center">
                                    Quanto <strong>maior</strong> a média, <strong>maior</strong> o risco.
                                </p>
                            </div>

                            {/* CENTER COLUMN: POLAR AREA CHART (2 COLS) */}
                            <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col justify-center relative">
                                <h3 className="font-bold text-lg text-slate-800 mb-6 text-center">Dimensões Psicossociais</h3>
                                <div className="w-full h-[400px] flex justify-center items-center relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={RADIAL_DATA}
                                                dataKey="value"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={150}
                                                shape={renderCustomPolarSector}
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                                    const RADIAN = Math.PI / 180;
                                                    // Ensure midAngle is valid
                                                    const angle = -(midAngle || 0) * RADIAN;

                                                    // Position for the label text (closer to chart)
                                                    const radius = outerRadius * 1.15;
                                                    const x = cx + radius * Math.cos(angle);
                                                    const y = cy + radius * Math.sin(angle);

                                                    // Position for the start of the line (at the edge of the specific bar)
                                                    const maxValue = 4;
                                                    // Re-calculate the bar's outer edge for this specific value
                                                    const barRadius = innerRadius + (outerRadius - innerRadius) * (Math.min(value, maxValue) / maxValue);

                                                    const startRadius = barRadius;
                                                    const startX = cx + startRadius * Math.cos(angle);
                                                    const startY = cy + startRadius * Math.sin(angle);

                                                    // Mid-point for polyline (optional knee)
                                                    const midRadius = outerRadius * 1.08;
                                                    const midX = cx + midRadius * Math.cos(angle);
                                                    const midY = cy + midRadius * Math.sin(angle);

                                                    return (
                                                        <g>
                                                            <path
                                                                d={`M${startX},${startY} L${midX},${midY} L${x},${y}`}
                                                                stroke="#cbd5e1"
                                                                fill="none"
                                                            />
                                                            <text
                                                                x={x}
                                                                y={y}
                                                                fill="#64748b"
                                                                textAnchor={x > cx ? 'start' : 'end'}
                                                                dominantBaseline="central"
                                                                className="text-[11px] font-semibold"
                                                            >
                                                                {RADIAL_DATA[index].name}
                                                            </text>
                                                        </g>
                                                    );
                                                }}
                                                labelLine={false}
                                            >
                                                {RADIAL_DATA.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: INVERSE RISK CARD */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
                                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                                        <TrendingDown size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Risco Inverso</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Controle, Apoio, Cargo, etc.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                                        <span>Dimensão</span>
                                        <span>Média</span>
                                    </div>
                                    {RADIAL_DATA.filter(d => d.fill === '#6366f1').map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <span className="font-medium text-slate-600 text-sm group-hover:text-slate-900 transition-colors pl-2 border-l-2 border-slate-100 group-hover:border-indigo-400 pl-3">
                                                {item.name}
                                            </span>
                                            <span className={`text-xs px-3 py-1 rounded-full font-bold w-16 text-center ${item.value <= 2 ? 'bg-red-50 text-red-600' :
                                                item.value <= 3 ? 'bg-orange-50 text-orange-600' :
                                                    'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Legend Restored */}
                                    <div className="pt-4 mt-2 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legenda de Risco</h4>
                                        <div className="space-y-2">
                                            {[
                                                { range: '0.0 - 0.9', label: 'Alto', color: 'bg-red-50 text-red-600 border border-red-100' },
                                                { range: '1.0 - 1.9', label: 'Moderado', color: 'bg-orange-50 text-orange-600 border border-orange-100' },
                                                { range: '2.0 - 2.9', label: 'Médio', color: 'bg-blue-50 text-blue-600 border border-blue-100' },
                                                { range: '3.0 - 4.0', label: 'Baixo', color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 font-medium">{item.range}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-20 text-center ${item.color}`}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="border-t border-slate-100 mt-6 pt-4 text-xs text-slate-400 italic text-center">
                                    Quanto <strong>menor</strong> a média, <strong>maior</strong> o risco.
                                </p>
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
