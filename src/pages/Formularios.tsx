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
        console.log('[CREATE FORM - DEBUG] Starting handleCreateForm with payload:', data);
        try {
            // Generate a unique identifier for the link if not provided
            const uniqueId = Date.now();
            const generatedLink = `${window.location.origin}/form/${uniqueId}`;

            // TOKEN DEDUCTION LOGIC
            const cost = data.selected_collaborators_count || 0;
            console.log(`[CREATE FORM - DEBUG] Cost: ${cost}, User ID: ${user?.id}`);

            if (user && cost > 0) {
                // Check balance
                console.log('[CREATE FORM - DEBUG] Fetching user token balance...');
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('tokens')
                    .eq('user_id', user.id)
                    .single();

                if (userError || !userData) {
                    console.error('[CREATE FORM - DEBUG] Error fetching user data:', userError);
                    alert(`Erro ao verificar saldo de tokens: ${userError?.message || 'Usuário não encontrado'}`);
                    return;
                }

                console.log(`[CREATE FORM - DEBUG] User has ${userData.tokens} tokens.`);
                if ((userData.tokens || 0) < cost) {
                    alert(`Saldo insuficiente. Você precisa de ${cost} tokens para ${cost} colaboradores, mas tem apenas ${userData.tokens || 0}.`);
                    return;
                }

                // Deduct
                console.log(`[CREATE FORM - DEBUG] Deducting ${cost} tokens from user...`);
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ tokens: (userData.tokens || 0) - cost })
                    .eq('user_id', user.id);

                if (updateError) {
                    console.error('[CREATE FORM - DEBUG] Token deduction error:', updateError);
                    alert(`Erro ao processar débito de tokens: ${updateError.message}`);
                    return;
                }
                console.log('[CREATE FORM - DEBUG] Tokens deducted successfully.');
            }

            const insertPayload = {
                title: data.title,
                description: data.description,
                unidade_id: data.unit_id,
                setor_id: data.sector_id,
                colaboladores_inclusos: data.colaboladores_inclusos || [],
                total_colabora: (data.colaboladores_inclusos || []).length,
                respondentes: 0,
                link: data.link || generatedLink,
                created_at: new Date().toISOString()
            };

            console.log('[CREATE FORM - DEBUG] Inserting into "forms" table...', insertPayload);

            const { data: newForm, error: insertError } = await supabase
                .from('forms')
                .insert([insertPayload])
                .select();

            if (insertError) {
                console.error('[CREATE FORM - DEBUG] Supabase INSERT Error:', insertError);
                alert(`Erro do Banco de Dados (tabela forms): ${insertError.message} (Código: ${insertError.code})`);
                throw insertError;
            }

            console.log('[CREATE FORM - DEBUG] Form created successfully:', newForm);
            alert('Formulário criado com sucesso!');

            // Just return to dashboard
            setView('dashboard');
        } catch (error: any) {
            console.error('[CREATE FORM - DEBUG] Fatal error in handleCreateForm:', error);
            alert(`Ocorreu um erro fatal ao criar o formulário: ${error.message || 'Erro desconhecido'}`);
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
