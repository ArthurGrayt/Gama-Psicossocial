import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { FormDashboard } from '../components/forms/FormDashboard';
import { FormEditor } from '../components/forms/FormEditor';
// import { FormAnalytics } from '../components/forms/FormAnalytics'; // OLD
import { SurveyDetails } from '../components/forms/SurveyDetails'; // NEW
import type { Form } from '../types';

type ViewState = 'dashboard' | 'editor' | 'analytics';

export const Formularios: React.FC = () => {
    const [view, setView] = useState<ViewState>('dashboard');
    const [selectedForm, setSelectedForm] = useState<Form | null>(null);
    const [editorFormId, setEditorFormId] = useState<number | null>(null);

    const [initialFormData, setInitialFormData] = useState<any>(null);

    // Handlers
    const handleCreateForm = (data?: any) => {
        setInitialFormData(data || null);
        setEditorFormId(null);
        setView('editor');
    };

    const handleEditForm = (form: Form) => {
        setEditorFormId(form.id);
        setView('editor');
    };

    const handleAnalyzeForm = (form: Form) => {
        setSelectedForm(form);
        setView('analytics');
    };

    const handleBackToDashboard = () => {
        setView('dashboard');
        setSelectedForm(null);
        setEditorFormId(null);
    };

    const handleSaveSuccess = () => {
        setView('dashboard');
        // Ideally show a toast here
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

                {view === 'editor' && (
                    <FormEditor
                        formId={editorFormId}
                        initialData={initialFormData}
                        onBack={handleBackToDashboard}
                        onSaveSuccess={handleSaveSuccess}
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
