import React, { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export interface HSEReportData {
    companyName: string;
    respondentsCount: number;
    reportDate: string;
    dimensions: {
        id: number;
        name: string;
        average: number;
        isPositive: boolean;
        riskLevel: string;
        items: {
            questionLabel: string;
            average: number;
            riskText: string;
        }[];
    }[];
    texts?: {
        strengths: string[];
        weaknesses: string[];
    };
    analysisText?: string;
    actionPlans?: {
        title: string;
        action: string;
    }[];
    conclusionText?: string;
}

interface HSEReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: HSEReportData | null;
}

export const HSEReportModal: React.FC<HSEReportModalProps> = ({ isOpen, onClose, data }) => {
    const [techName, setTechName] = useState('');
    const [techDoc, setTechDoc] = useState('');

    // Reset inputs when modal opens
    useEffect(() => {
        if (isOpen) {
            setTechName('');
            setTechDoc('');
        }
    }, [isOpen]);

    if (!isOpen || !data) return null;

    const handleDownloadPDF = () => {
        const element = document.getElementById('hse-report-content');
        if (!element) return;
        const opt = {
            margin: [0, 0, 0, 0] as [number, number, number, number],
            filename: `Laudo_HSE_${data.companyName.replace(/\s+/g, '_')}_${data.reportDate.replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg' as const, quality: 1.0 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 1024,
                scrollY: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
            pagebreak: { mode: ['css', 'legacy'] }
        };
        html2pdf().set(opt).from(element).save();
    };

    const getRiskColor = (level: string) => {
        const l = level.toLowerCase();
        if (l.includes('baixo')) return 'text-emerald-600';
        if (l.includes('médio')) return 'text-cyan-600';
        if (l.includes('moderado')) return 'text-yellow-600';
        if (l.includes('alto')) return 'text-red-600';
        return 'text-slate-600';
    };

    const getRiskTextLabel = (level: string) => {
        const l = level.toLowerCase();
        if (l.includes('baixo')) return 'baixo risco de exposição';
        if (l.includes('médio')) return 'médio risco de exposição';
        if (l.includes('moderado')) return 'moderado risco de exposição';
        if (l.includes('alto')) return 'alto risco de exposição';
        return level;
    };

    return (
        // Wrapper Principal
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 print:p-0">

            {/* Backdrop Separado */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity print:hidden"
                onClick={onClose}
            />

            {/* Container do Modal */}
            <div
                className="relative bg-white rounded-t-[2rem] md:rounded-xl w-full max-w-5xl h-[94dvh] md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Toolbar */}
                <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-xl print:hidden">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={20} className="text-[#35b6cf]" /> Pré-visualização do Laudo</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X size={20} /></button>
                </div>

                {/* Inputs Responsável */}
                <div className="p-4 bg-blue-50 flex flex-col sm:flex-row gap-4 items-end border-b border-blue-100 print:hidden">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-blue-700 uppercase">Responsável Técnico</label>
                        <input value={techName} onChange={e => setTechName(e.target.value)} className="w-full p-2 rounded border border-blue-200 text-sm" placeholder="Ex: Dra. Maria Silva" />
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="text-xs font-bold text-blue-700 uppercase">CRP/Registro</label>
                        <input value={techDoc} onChange={e => setTechDoc(e.target.value)} className="w-full p-2 rounded border border-blue-200 text-sm" placeholder="Ex: 12345/RJ" />
                    </div>
                    <button onClick={handleDownloadPDF} className="bg-[#35b6cf] hover:bg-[#2a93a8] text-white px-6 py-2 rounded-lg font-bold flex gap-2 shadow-sm transition-colors w-full sm:w-auto justify-center">
                        <Download size={18} /> Baixar PDF
                    </button>
                </div>

                {/* CONTEÚDO DO PDF */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-0 sm:p-8">
                    <div
                        id="hse-report-content"
                        className="bg-white max-w-[210mm] mx-auto min-h-[297mm] px-[15mm] py-[20mm] shadow-sm text-sm leading-relaxed text-justify text-slate-900 font-sans [print-color-adjust:exact]"
                    >

                        {/* Cabeçalho */}
                        <div className="border-b-2 border-[#35b6cf] pb-4 mb-8">
                            <h1 className="text-2xl font-bold text-slate-900 mb-1">Laudo de Levantamento dos Riscos Psicossociais</h1>
                            <p className="italic text-slate-600 text-xs">Ferramenta: Health and Safety Executive Indicator Tool (HSE-IT)</p>
                            <div className="flex justify-between mt-6 text-xs text-slate-500 uppercase tracking-wider font-bold">
                                <span>Empresa: <b className="text-slate-800">{data.companyName}</b></span>
                                <span>Data: <b className="text-slate-800">{data.reportDate}</b></span>
                                <span>Participantes: <b className="text-slate-800">{data.respondentsCount}</b></span>
                            </div>
                        </div>

                        {/* 1. Introdução (Texto Fixo) */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-[#35b6cf] mb-3 border-l-4 border-[#35b6cf] pl-2 uppercase">1. Introdução</h2>
                            <p className="mb-3">Este laudo apresenta os resultados da avaliação psicossocial realizada com base no questionário HSE Indicator Tool (HSE-IT), que contempla 35 itens distribuídos em 7 dimensões: Demandas, Controle, Apoio da Chefia, Apoio dos Colegas, Relacionamentos, Cargo e Comunicação/Mudanças.</p>
                            <p>O objetivo é identificar os principais fatores de risco psicossocial que podem impactar o bem-estar, a saúde mental e a produtividade dos colaboradores, classificando os resultados em baixo, médio, moderado ou alto risco, de acordo com os parâmetros estabelecidos.</p>
                        </div>

                        {/* 2. Metodologia (Texto Fixo) */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-[#35b6cf] mb-3 border-l-4 border-[#35b6cf] pl-2 uppercase">2. Metodologia</h2>

                            <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
                                <p className="font-bold mb-2 text-slate-800">Escala de respostas utilizada:</p>
                                <ul className="list-none pl-0 text-xs font-medium text-slate-600 space-y-1">
                                    <li>(0) Nunca</li>
                                    <li>(1) Raramente</li>
                                    <li>(2) As vezes</li>
                                    <li>(3) Frequentemente</li>
                                    <li>(4) Sempre</li>
                                </ul>
                            </div>

                            <div className="mb-4">
                                <p className="font-bold text-slate-800 mb-2">Critério de análise:</p>
                                <ul className="text-xs space-y-1 text-slate-700 list-disc pl-4">
                                    <li>Dimensões <b>Demandas</b> e <b>Relacionamentos</b> → médias mais altas indicam maior risco.</li>
                                    <li>Demais dimensões (Controle, Apoio, Cargo, Comunicação/Mudanças) → médias mais baixas indicam maior risco.</li>
                                </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <p className="font-bold text-slate-700 mb-2 text-center border-b pb-1">Quanto MAIOR a média, MAIOR o risco</p>
                                    <ul className="space-y-1 text-center">
                                        <li>0 a 1: <span className="font-bold text-emerald-600 uppercase">baixo</span></li>
                                        <li>&gt;1 a 2: <span className="font-bold text-cyan-600 uppercase">médio</span></li>
                                        <li>&gt;2 a 3: <span className="font-bold text-yellow-600 uppercase">moderado</span></li>
                                        <li>&gt;3 a 4: <span className="font-bold text-red-600 uppercase">alto</span></li>
                                    </ul>
                                </div>
                                <div className="bg-slate-50 p-3 rounded border border-slate-100">
                                    <p className="font-bold text-slate-700 mb-2 text-center border-b pb-1">Quanto MENOR a média, MAIOR o risco</p>
                                    <ul className="space-y-1 text-center">
                                        <li>0 a 1: <span className="font-bold text-red-600 uppercase">alto</span></li>
                                        <li>&gt;1 a 2: <span className="font-bold text-yellow-600 uppercase">moderado</span></li>
                                        <li>&gt;2 a 3: <span className="font-bold text-cyan-600 uppercase">médio</span></li>
                                        <li>&gt;3 a 4: <span className="font-bold text-emerald-600 uppercase">baixo</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="html2pdf__page-break"></div>

                        {/* 3. Resultados por Item (Dinâmico) */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-[#35b6cf] mb-4 border-l-4 border-[#35b6cf] pl-2 uppercase">3. Resultados por Item (diagnóstico detalhado)</h2>

                            {data.dimensions.map((dim) => (
                                <div key={dim.id} className="mb-6 break-inside-avoid">
                                    <h3 className="font-bold text-slate-800 text-sm mb-2 pb-1 border-b border-slate-200">
                                        Dimensão {dim.name} <span className="font-normal text-slate-500 italic text-xs">(quanto {dim.isPositive ? 'menor' : 'maior'}, melhor)</span>
                                    </h3>
                                    <ul className="list-none pl-0 space-y-1">
                                        {dim.items.map((item, idx) => (
                                            <li key={idx} className="text-xs text-slate-700 leading-relaxed">
                                                - {item.questionLabel}?: <span className={`font-bold ${getRiskColor(item.riskText)}`}>{getRiskTextLabel(item.riskText)}</span> <span className="text-slate-400">({item.average.toFixed(2)})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* 4. Resultados por Dimensão (diagnóstico consolidado) */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-[#35b6cf] mb-4 border-l-4 border-[#35b6cf] pl-2 uppercase">4. Resultados por Dimensão (diagnóstico consolidado)</h2>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="py-3 text-left font-bold text-slate-600">Dimensão</th>
                                        <th className="py-3 text-right font-bold text-slate-600">Resultado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.dimensions.map((dim) => (
                                        <tr key={dim.id} className="border-b border-slate-100">
                                            <td className="py-3 text-slate-700">{dim.name}</td>
                                            <td className={`py-3 text-right font-bold ${getRiskColor(dim.riskLevel)}`}>
                                                {getRiskTextLabel(dim.riskLevel)} ({dim.average.toFixed(2)})
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 5. Análise Interpretativa (da view) */}
                        {data.analysisText && (
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-[#35b6cf] mb-3 border-l-4 border-[#35b6cf] pl-2 uppercase">5. Análise Interpretativa</h2>
                                <div
                                    className="text-sm text-slate-700 leading-relaxed [&>b]:font-bold [&>b]:text-slate-900"
                                    dangerouslySetInnerHTML={{
                                        __html: data.analysisText
                                            .replace(/<b>(PONTOS[^<]*:)<\/b>/gi, '<div style="margin-top:16px;margin-bottom:6px"><b>$1</b></div>')
                                    }}
                                />
                            </div>
                        )}

                        {/* 6. Recomendações de Plano de Ação */}
                        {(data.actionPlans?.length || 0) > 0 && (
                            <div className="mb-8">
                                <h2 className="text-lg font-bold text-[#35b6cf] mb-3 border-l-4 border-[#35b6cf] pl-2 uppercase">6. Recomendações de Plano de Ação</h2>
                                <div className="space-y-4">
                                    {data.actionPlans?.map((plan, i) => (
                                        <div key={i} className="border-l-2 border-slate-200 pl-3">
                                            <p className="font-bold text-slate-900 text-sm">{plan.title}</p>
                                            <p className="text-sm text-slate-600 mt-1">{plan.action}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 7. Conclusão */}
                        {data.conclusionText && (
                            <div className="mb-8">
                                <h2 className="text-lg font-bold text-[#35b6cf] mb-3 border-l-4 border-[#35b6cf] pl-2 uppercase">7. Conclusão</h2>
                                <div
                                    className="text-sm text-slate-700 leading-relaxed [&>b]:font-bold [&>b]:text-slate-900"
                                    dangerouslySetInnerHTML={{ __html: data.conclusionText }}
                                />
                            </div>
                        )}

                        {/* Assinatura */}
                        <div className="mt-20 pt-8 border-t border-slate-300 text-center w-2/3 mx-auto break-inside-avoid">
                            <p className="font-bold text-slate-800 text-lg">{techName || '__________________________________'}</p>
                            <p className="text-sm text-slate-500 uppercase tracking-wider mt-1">Responsável Técnico</p>
                            <p className="text-xs text-slate-400">CRP/Registro: {techDoc || '____________'}</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
