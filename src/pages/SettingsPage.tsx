import React, { useState } from 'react';
import { Timer, Save } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';

export const SettingsPage: React.FC = () => {
    const [formTimer, setFormTimer] = useState<number>(() => {
        return Number(localStorage.getItem('gama-form-timer')) || 30;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSaveTimer = () => {
        setIsSaving(true);
        localStorage.setItem('gama-form-timer', String(formTimer));

        setTimeout(() => {
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 500);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col gap-1 mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
                    <p className="text-slate-500">Gerencie as preferências da sua plataforma</p>
                </div>

                {/* Section: Formulários */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Timer className="text-[#0f978e]" size={20} />
                            Gerenciamento de Formulários
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <p className="font-medium text-slate-900">Timer de atividade dos formulários</p>
                                <p className="text-sm text-slate-500">Defina o tempo limite (em minutos) para inatividade nos formulários públicos antes de reiniciá-los.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1"
                                    max="1440"
                                    value={formTimer}
                                    onChange={(e) => setFormTimer(Number(e.target.value))}
                                    className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f978e]/20 focus:border-[#0f978e]"
                                />
                                <span className="text-slate-500 text-sm">minutos</span>

                                <button
                                    onClick={handleSaveTimer}
                                    disabled={isSaving}
                                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#0f978e] text-white rounded-lg hover:bg-[#0d857d] transition-colors font-medium disabled:opacity-50"
                                >
                                    {isSaving ? 'Salvando...' : (
                                        <>
                                            <Save size={18} />
                                            Salvar
                                        </>
                                    )}
                                </button>
                            </div>
                            {showSuccess && (
                                <p className="text-emerald-600 text-sm font-medium animate-in fade-in slide-in-from-top-1 px-1">
                                    ✓ Configurações salvas com sucesso!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
