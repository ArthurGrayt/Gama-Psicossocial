import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GraficoRadarDemandas } from '../GraficoRadarDemandas';
import { useDimensionAnalysis } from '../../hooks/useDimensionAnalysis';

interface DimensionAnalysisSectionProps {
    unidadeId: number | null;
    setorId: number | null;
    formIds: number[];
}

export const DimensionAnalysisSection: React.FC<DimensionAnalysisSectionProps> = ({ unidadeId, setorId, formIds }) => {
    const { loading, chartData, positiveDimensions, negativeDimensions } = useDimensionAnalysis({
        unidadeId,
        setorId,
        formIds
    });

    return (
        <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">

                {/* LEFT COLUMN: DIRECT RISK CARD (Negative Dimensions e.g. Demandas) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Risco Direto</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Demandas & Relacionamentos</p>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                            <span>Dimensão</span>
                            <span>Média</span>
                        </div>

                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-50 rounded" />)}
                            </div>
                        ) : negativeDimensions.length === 0 ? (
                            <div className="text-center py-4 text-slate-400 text-sm">
                                Nenhuma dimensão encontrada.
                            </div>
                        ) : (
                            negativeDimensions.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <span className="font-medium text-slate-600 text-sm group-hover:text-slate-900 transition-colors pl-3 border-l-2 custom-border-hover" style={{ borderLeftColor: item.fill }}>
                                        {item.name}
                                    </span>
                                    <span
                                        className="text-xs px-3 py-1 rounded-full font-bold w-16 text-center shadow-sm"
                                        style={{
                                            backgroundColor: `${item.fill}15`, // 15% opacity hex
                                            color: item.fill
                                        }}
                                    >
                                        {item.value.toFixed(1)}
                                    </span>
                                </div>
                            ))
                        )}

                        {/* Legend */}
                        <div className="pt-4 mt-auto border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legenda de Risco</h4>
                            <div className="space-y-2">
                                {[
                                    { range: '3.0 - 4.0', label: 'Alto', color: 'text-[#f43f5e] bg-[#f43f5e15] border-[#f43f5e30]' },
                                    { range: '2.0 - 2.9', label: 'Moderado', color: 'text-[#ea580c] bg-[#ea580c15] border-[#ea580c30]' },
                                    { range: '1.0 - 1.9', label: 'Médio', color: 'text-[#6366f1] bg-[#6366f115] border-[#6366f130]' },
                                    { range: '0.0 - 0.9', label: 'Baixo', color: 'text-[#10b981] bg-[#10b98115] border-[#10b98130]' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium">{item.range}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-20 text-center border ${item.color}`}>
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

                    <GraficoRadarDemandas
                        data={chartData}
                        loading={loading}
                    />
                </div>

                {/* RIGHT COLUMN: INVERSE RISK CARD (Positive Dimensions e.g. Control, Support) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                            <TrendingDown size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Risco Inverso</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Controle, Apoio, Cargo, etc.</p>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                            <span>Dimensão</span>
                            <span>Média</span>
                        </div>

                        {loading ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-50 rounded" />)}
                            </div>
                        ) : positiveDimensions.length === 0 ? (
                            <div className="text-center py-4 text-slate-400 text-sm">
                                Nenhuma dimensão encontrada.
                            </div>
                        ) : (
                            positiveDimensions.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <span className="font-medium text-slate-600 text-sm group-hover:text-slate-900 transition-colors pl-3 border-l-2 custom-border-hover" style={{ borderLeftColor: item.fill }}>
                                        {item.name}
                                    </span>
                                    <span
                                        className="text-xs px-3 py-1 rounded-full font-bold w-16 text-center shadow-sm"
                                        style={{
                                            backgroundColor: `${item.fill}15`,
                                            color: item.fill
                                        }}
                                    >
                                        {item.value.toFixed(1)}
                                    </span>
                                </div>
                            ))
                        )}

                        {/* Legend */}
                        <div className="pt-4 mt-auto border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legenda de Risco</h4>
                            <div className="space-y-2">
                                {[
                                    { range: '0.0 - 0.9', label: 'Alto', color: 'text-[#f43f5e] bg-[#f43f5e15] border-[#f43f5e30]' },
                                    { range: '1.0 - 1.9', label: 'Moderado', color: 'text-[#ea580c] bg-[#ea580c15] border-[#ea580c30]' },
                                    { range: '2.0 - 2.9', label: 'Médio', color: 'text-[#6366f1] bg-[#6366f115] border-[#6366f130]' },
                                    { range: '3.0 - 4.0', label: 'Baixo', color: 'text-[#10b981] bg-[#10b98115] border-[#10b98130]' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-medium">{item.range}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-20 text-center border ${item.color}`}>
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
    );
};
