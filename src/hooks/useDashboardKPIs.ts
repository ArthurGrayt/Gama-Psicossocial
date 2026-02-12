import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

// Global cache for Dashboard KPIs
let globalKpiCache: any | null = null;
let lastKpiFetchTime = 0;
const KPI_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useDashboardKPIs = (user: any) => {
    const [stats, setStats] = useState<{
        tokenBalance: number;
        companiesCount: number;
        totalResponses: number;
        pendingResponses: number;
    }>({
        tokenBalance: 0,
        companiesCount: 0,
        totalResponses: 0,
        pendingResponses: 0
    });

    // Initialize loading based on cache availability
    const [loading, setLoading] = useState(!globalKpiCache);
    const [error, setError] = useState<any>(null);

    const fetchKPIs = useCallback(async (force = false) => {
        if (!user) return;

        const now = Date.now();
        // Return cached data immediately if valid
        if (!force && globalKpiCache && (now - lastKpiFetchTime < KPI_CACHE_DURATION)) {
            setStats(globalKpiCache);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error: apiError } = await supabase
                .from('vw_kpis_dashboard')
                .select('*')
                .single();

            if (apiError) throw apiError;

            if (data && data.usuario_id === user.id) {
                const newStats = {
                    tokenBalance: data.total_tokens || 0,
                    companiesCount: data.empresas_ativas || 0,
                    totalResponses: data.total_respondidos || 0,
                    pendingResponses: data.total_pendentes || 0,
                };

                // Update Cache
                globalKpiCache = newStats;
                lastKpiFetchTime = Date.now();
                setStats(newStats);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching dashboard KPIs:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial Fetch
    useEffect(() => {
        if (user) {
            fetchKPIs();
        }
    }, [user, fetchKPIs]);

    return {
        stats,
        loading,
        error,
        refetch: () => fetchKPIs(true)
    };
};
