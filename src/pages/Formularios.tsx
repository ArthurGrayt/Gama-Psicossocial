import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { FormDashboard } from '../components/forms/FormDashboard';
// import { FormEditor } from '../components/forms/FormEditor'; // Removed
// import { FormAnalytics } from '../components/forms/FormAnalytics'; // OLD
import { SurveyDetails } from '../components/forms/SurveyDetails'; // NEW
import type { Form } from '../types';
import { supabase } from '../services/supabase';

type ViewState = 'dashboard' | 'editor' | 'analytics';

export const Formularios: React.FC = () => {
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
