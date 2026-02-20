import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
export const useCompanies = (user: any) => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const fetchCompanies = useCallback(async () => {
        if (!user) {
            setCompanies([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch from Supabase exclusively to ensure user-level filtering
            // Note: vw_empresas_dashboard already includes total_colaboradores, total_unidades, etc.
            const { data: clientsData, error: dbError } = await supabase
                .from('vw_empresas_dashboard')
                .select('*')
                .eq('empresa_responsavel', user.id);

            if (dbError) throw dbError;

            if (!clientsData || clientsData.length === 0) {
                setCompanies([]);
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

    // Update local state if another component updates the cache locally.
    const updateCompanyInCache = useCallback((updatedCompany: any) => {
        setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
    }, []);

    return {
        companies,
        loading,
        error,
        refetch: fetchCompanies,
        updateCompanyInCache
    };
};
