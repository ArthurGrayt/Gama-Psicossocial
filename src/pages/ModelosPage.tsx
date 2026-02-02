import React from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { FileText, Info, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_TEMPLATES = [
    {
        id: 'hse_2025',
        label: 'Formulário HSE 2025',
        description: 'Modelo padrão para avaliação de riscos psicossociais e segurança do trabalho.',
        questions: []
    },
    {
        id: 'clima_organizacional',
        label: 'Pesquisa de Clima',
        description: 'Avaliação geral do ambiente e satisfação dos colaboradores.',
        questions: []
    }
];

export const ModelosPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Modelos de Formulários</h1>
                    <p className="text-slate-500">Gerencie e visualize os modelos disponíveis para pesquisas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Create New Card (Placeholder) */}
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-[#35b6cf] hover:text-[#35b6cf] hover:bg-[#35b6cf]/5 transition-all cursor-pointer group h-full min-h-[200px]">
                        <div className="bg-slate-100 group-hover:bg-[#35b6cf] group-hover:text-white p-3 rounded-full mb-3 transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="font-semibold">Criar Novo Modelo</span>
                    </div>

                    {MOCK_TEMPLATES.map(template => (
                        <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-500 rounded-lg">
                                    <FileText size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#35b6cf] transition-colors" title="Ver Detalhes">
                                        <Info size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-800 mb-2">{template.label}</h3>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-2">{template.description}</p>

                            <button
                                onClick={() => navigate('/')} // In a real app, this would pre-select the template
                                className="w-full py-2.5 border border-[#35b6cf] text-[#35b6cf] font-bold rounded-lg hover:bg-[#35b6cf] hover:text-white transition-all"
                            >
                                Usar Modelo
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};
