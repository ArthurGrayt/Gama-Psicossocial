import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

// Global cache to persist data between tab switches
let globalCache: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCompanies = (user: any) => {
    const [companies, setCompanies] = useState<any[]>(globalCache || []);
    const [loading, setLoading] = useState(!globalCache);
    const [error, setError] = useState<any>(null);

    const fetchCompanies = useCallback(async (force = false) => {
        if (!user) {
            // Clear cache on logout/no-user
            globalCache = null;
            setCompanies([]);
            return;
        }

        // Use cache if available and fresh, unless forced
        const now = Date.now();
        if (!force && globalCache && (now - lastFetchTime < CACHE_DURATION)) {
            setCompanies(globalCache);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch from Supabase exclusively to ensure user-level filtering
            const { data: clientsData, error: dbError } = await supabase
                .from('clientes')
                .select('id, cliente_uuid, nome_fantasia, razao_social, cnpj, total_colaboradores, total_unidades, img_url, created_at')
                .eq('empresa_responsavel', user.id);

            if (dbError) throw dbError;

            if (!clientsData || clientsData.length === 0) {
                setCompanies([]);
                globalCache = [];
                return;
            }

            // Map efficiently
            const mappedCompanies = clientsData.map(client => ({
                id: client.id,
                cliente_uuid: client.cliente_uuid,
                name: client.nome_fantasia || client.razao_social || 'Sem Nome',
                cnpj: client.cnpj,
                total_collaborators: client.total_colaboradores || 0,
                // Initialize empty arrays/objects to prevent UI errors, details loaded later
                units: [],
                roles: [],
                cargos: [],
                collaborators: [],
                setores: [],
                detailsLoaded: false,
                total_units: client.total_unidades || 0,
                img_url: client.img_url || null,
                created_at: client.created_at || null
            }));

            // Update state and cache
            globalCache = mappedCompanies;
            lastFetchTime = Date.now();
            setCompanies(mappedCompanies);
            setError(null);

        } catch (err) {
            console.error('Error fetching companies:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Update local state if another component updates the global cache (simple synchronization)
    // For a more robust solution we would use a listener, but for this scope it's fine.
    // actually, we can expose a method to update the cache locally.

    // Initial fetch
    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    // Helper to update a specific company in the list (e.g. after lazy loading details)
    const updateCompanyInCache = useCallback((updatedCompany: any) => {
        if (!globalCache) return;

        globalCache = globalCache.map(c => c.id === updatedCompany.id ? updatedCompany : c);
        setCompanies(globalCache);
    }, []);

    return {
        companies,
        loading,
        error,
        refetch: () => fetchCompanies(true),
        updateCompanyInCache
    };
};
