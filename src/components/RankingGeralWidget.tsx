import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Trophy, Medal, Award } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext'; // Simplify for debugging

interface RankingItem {
    empresa: string;
    score_global: number | null;
    total_colaboradores: number;
    status_classificacao: 'Excelente' | 'Bom' | 'Risco';
}

export const RankingGeralWidget: React.FC = () => {
    // Debug state
    const [debugMsg, setDebugMsg] = useState('Initializing...');
    const [ranking, setRanking] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRanking();
    }, []);

    const fetchRanking = async () => {
        setLoading(true);
        setDebugMsg('Starting fetch...');

        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Fetch timeout')), 15000)
            );

            // Create the fetch promise
            const fetchPromise = supabase
                .from('vw_dashboard_ranking_geral')
                .select('empresa, score_global, total_colaboradores, status_classificacao')
                .order('score_global', { ascending: false })
                .limit(5);

            // Race them
            setDebugMsg('Sending request to Supabase...');
            const result = await Promise.race([fetchPromise, timeoutPromise]) as any;

            const { data, error } = result;

            if (error) {
                console.error('Erro ao buscar ranking:', error);
                setDebugMsg(`Error: ${error.message}`);
                setRanking([]);
            } else {
                console.log('Ranking Carregado:', data);
                setDebugMsg(`Loaded ${data?.length || 0} items`);
                setRanking((data || []) as unknown as RankingItem[]);
            }
        } catch (error: any) {
            console.error('Erro inesperado no widget de ranking:', error);
            setDebugMsg(`Exception: ${error.message || 'Unknown error'}`);
            setRanking([]);
        } finally {
            setLoading(false);
        }
    };

    // Helper para cores do score
    const getScoreColor = (status: RankingItem['status_classificacao']) => {
        if (!status) return 'text-slate-600';
        switch (status) {
            case 'Excelente': return 'text-emerald-600';
            case 'Bom': return 'text-blue-600';
            case 'Risco': return 'text-red-600';
            default: return 'text-slate-600';
        }
    };

    // Helper para ícones/badges de posição
    const renderPositionBadge = (index: number) => {
        const position = index + 1;

        if (position === 1) {
            return (
                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center border border-yellow-200 shadow-sm">
                    <Trophy size={16} className="text-yellow-600" />
                </div>
            );
        }
        if (position === 2) {
            return (
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-sm">
                    <Medal size={16} className="text-slate-500" />
                </div>
            );
        }
        if (position === 3) {
            return (
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center border border-orange-200 shadow-sm">
                    <Award size={16} className="text-orange-600" />
                </div>
            );
        }
        return (
            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-100">
                {position}º
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full flex flex-col relative">
                <div className="absolute top-2 right-2 text-[10px] text-slate-300 pointer-events-none">
                    {debugMsg}
                </div>
                <div className="h-6 w-48 bg-slate-100 rounded mb-6 animate-pulse" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse" />
                            <div className="flex-1">
                                <div className="h-4 w-32 bg-slate-100 rounded mb-2 animate-pulse" />
                                <div className="h-3 w-20 bg-slate-50 rounded animate-pulse" />
                            </div>
                            <div className="h-6 w-12 bg-slate-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full overflow-hidden flex flex-col relative">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                Ranking de Desempenho
                <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Score Global</span>
            </h2>

            {/* Debug Message */}
            {/* <div className="absolute top-2 right-2 text-[10px] text-slate-300">
                {debugMsg}
            </div> */}

            {ranking.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
                    <p>Nenhum dado de desempenho disponível</p>
                    <p className="text-xs mt-2 text-slate-300">{debugMsg}</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {ranking.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors group"
                        >
                            {/* Posição */}
                            <div className="flex-shrink-0">
                                {renderPositionBadge(index)}
                            </div>

                            {/* Info Empresa */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                                    {item.empresa || 'Empresa desconhecida'}
                                </h3>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    {item.total_colaboradores || 0} colaboradores
                                </p>
                            </div>

                            {/* Score */}
                            <div className="text-right">
                                <span className={`text-xl font-bold ${getScoreColor(item.status_classificacao)}`}>
                                    {typeof item.score_global === 'number' ? item.score_global.toFixed(1) : '-'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
