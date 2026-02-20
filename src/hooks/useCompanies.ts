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
            // Requisição para a API local para buscar as empresas
            const response = await fetch('http://localhost:3000/dashboard/empresas');

            // Verifica se a requisição foi bem sucedida
            if (!response.ok) {
                throw new Error('Erro ao buscar empresas da API');
            }

            // Converte a resposta para JSON
            const clientsData = await response.json();

            if (!clientsData || clientsData.length === 0) {
                setCompanies([]);
                globalCache = [];
                return;
            }

            // Fetch img_url and created_at separately from the clientes table (not in the view)
            const companyIds = clientsData.map(c => c.id);
            let extraMap: Record<number, { img_url: string | null; created_at: string | null }> = {};
            if (companyIds.length > 0) {
                const { data: extraData } = await supabase
                    .from('clientes')
                    .select('id, img_url, created_at')
                    .in('id', companyIds);
                if (extraData) {
                    extraData.forEach((row: any) => { extraMap[row.id] = { img_url: row.img_url, created_at: row.created_at }; });
                }
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
                img_url: extraMap[client.id]?.img_url || null,
                created_at: extraMap[client.id]?.created_at || null
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
