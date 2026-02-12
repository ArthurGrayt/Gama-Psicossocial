import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { FormDashboard } from '../components/forms/FormDashboard';
// import { FormEditor } from '../components/forms/FormEditor'; // Removed
// import { FormAnalytics } from '../components/forms/FormAnalytics'; // OLD
import { SurveyDetails } from '../components/forms/SurveyDetails'; // NEW
import type { Form } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

type ViewState = 'dashboard' | 'editor' | 'analytics';

export const Formularios: React.FC = () => {
    const { user } = useAuth();
    const [view, setView] = useState<ViewState>('dashboard');
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);


    // Handlers
    const handleCreateForm = async (data: any) => {
        try {
            // Use provided slug or generate logical one
            let finalSlug = data.slug;

            if (!finalSlug) {
                const slugBase = (data.title || 'novo-formulario')
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '');
                finalSlug = `${slugBase}-${Date.now()}`;
            }

            // TOKEN DEDUCTION LOGIC
            const cost = data.selected_collaborators_count || 0;
            if (user && cost > 0) {
                // Check balance
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('total_tokens')
                    .eq('id', user.id)
                    .single();

                if (userError || !userData) {
                    alert('Erro ao verificar saldo de tokens.');
                    return;
                }

                if ((userData.total_tokens || 0) < cost) {
                    alert(`Saldo insuficiente. Você precisa de ${cost} tokens para ${cost} colaboradores, mas tem apenas ${userData.total_tokens || 0}.`);
                    return;
                }

                // Deduct
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ total_tokens: (userData.total_tokens || 0) - cost })
                    .eq('id', user.id);

                if (updateError) {
                    alert('Erro ao processar débito de tokens.');
                    return;
                }
            }

            const { error } = await supabase
                .from('forms')
                .insert([{
                    title: data.title,
                    description: data.description,
                    unidade_id: data.unit_id,
                    setor_id: data.sector_id,
                    colaboladores_inclusos: data.colaboladores_inclusos || [],
                    link: data.link || `${window.location.origin}/form/${finalSlug}`,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            // Just return to dashboard (which triggers refresh if we used a ref or context, but here maybe just simple reload or state reset)
            setView('dashboard');

            // Optionally could force refresh FormDashboard list if we had a mechanism, 
            // but for now user will see it next reload or we could key the component.
        } catch (error) {
            console.error('Error creating form:', error);
        }
    };

    const handleEditForm = (form: Form) => {
        // Feature temporarily disabled
        console.log('Edit form:', form.id);
    };

    const handleAnalyzeForm = (form: Form) => {
        setSelectedForm(form);
        setView('analytics');
    };

    const handleBackToDashboard = () => {
        setView('dashboard');
        setSelectedForm(null);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {view === 'dashboard' && (
                    <FormDashboard
                        onCreateForm={handleCreateForm}
                        onEditForm={handleEditForm}
                        onAnalyzeForm={handleAnalyzeForm}
                    />
                )}



                {view === 'analytics' && selectedForm && (
                    <SurveyDetails
                        form={selectedForm}
                        onBack={handleBackToDashboard}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};
