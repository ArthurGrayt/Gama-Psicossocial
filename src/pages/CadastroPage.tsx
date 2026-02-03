import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { FilePlus, FileSpreadsheet, ChevronRight, Upload, Download } from 'lucide-react';
import { FormEditor } from '../components/forms/FormEditor';

type ViewArgs = 'options' | 'manual' | 'import';

export const CadastroPage: React.FC = () => {
    const [view, setView] = useState<ViewArgs>('options');

    const handleBack = () => {
        setView('options');
    };

    const handleSaveSuccess = () => {
        // After successful save, maybe go back to options or stay?
        // For now, let's go back to options
        setView('options');
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto">
                {view === 'options' && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <header className="mb-10 text-center">
                            <h1 className="text-3xl font-bold text-slate-800 mb-3">Novo Cadastro</h1>
                            <p className="text-slate-500 text-lg">Escolha como você deseja iniciar o cadastro</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Manual Option */}
                            <button
                                onClick={() => setView('manual')}
                                className="group relative p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#35b6cf]/30 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden flex flex-col h-64 justify-between"
                            >
                                <div className="absolute top-0 right-0 p-32 bg-[#35b6cf]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#35b6cf]/10 transition-colors" />

                                <div className="w-16 h-16 rounded-2xl bg-[#35b6cf]/10 text-[#35b6cf] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <FilePlus size={32} />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-[#35b6cf] transition-colors">
                                        Cadastrar Manualmente
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Preencha o formulário passo a passo para cadastrar uma nova empresa e seus dados.
                                    </p>
                                </div>

                                <div className="absolute bottom-8 right-8 text-slate-300 group-hover:text-[#35b6cf] group-hover:translate-x-1 transition-all">
                                    <ChevronRight size={24} />
                                </div>
                            </button>

                            {/* Import Option */}
                            <button
                                onClick={() => setView('import')}
                                className="group relative p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#0f978e]/30 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden flex flex-col h-64 justify-between"
                            >
                                <div className="absolute top-0 right-0 p-32 bg-[#0f978e]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#0f978e]/10 transition-colors" />

                                <div className="w-16 h-16 rounded-2xl bg-[#0f978e]/10 text-[#0f978e] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <FileSpreadsheet size={32} />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-[#0f978e] transition-colors">
                                        Importar Planilha
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">
                                        Faça upload de uma planilha Excel para cadastrar múltiplos dados de uma só vez.
                                    </p>
                                </div>

                                <div className="absolute bottom-8 right-8 text-slate-300 group-hover:text-[#0f978e] group-hover:translate-x-1 transition-all">
                                    <ChevronRight size={24} />
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {view === 'manual' && (
                    <FormEditor
                        formId={null}
                        initialData={null}
                        onBack={handleBack}
                        onSaveSuccess={handleSaveSuccess}
                    />
                )}

                {view === 'import' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={handleBack}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ChevronRight className="rotate-180" size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Importar Planilha</h1>
                                <p className="text-slate-500">Carregue seus dados em massa</p>
                            </div>
                        </div>

                        {/* Import Area Placeholder */}
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center hover:border-slate-400 hover:bg-slate-50/50 transition-all cursor-pointer">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Clique ou arraste sua planilha aqui</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                                Suportamos arquivos .xlsx e .csv. Certifique-se de que sua planilha siga o modelo padrão.
                            </p>
                            <button className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                Selecionar Arquivo
                            </button>
                        </div>

                        {/* Support / Template Info */}
                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <Download size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">Precisa do modelo padrão?</h4>
                                <p className="text-sm text-slate-500 mt-1 mb-3">
                                    Para que a importação funcione corretamente, é necessário seguir a estrutura de colunas do nosso modelo.
                                </p>
                                <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
                                    Baixar planilha modelo
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
