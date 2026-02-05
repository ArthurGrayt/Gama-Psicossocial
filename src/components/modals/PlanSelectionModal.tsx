import React from 'react';
import { X, Star } from 'lucide-react';

interface PlanSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (pkg: { id: string; name: string; tokens: number; price: string }) => void;
}

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
            {/* Modal Container */}
            <div className="relative w-full max-w-[960px] bg-white rounded-[2rem] shadow-xl flex flex-col max-h-[90vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50"
                >
                    <X size={20} />
                </button>

                {/* Modal Content */}
                <div className="p-10 md:p-12 flex flex-col items-center">
                    {/* Header Section */}
                    <div className="text-center mb-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                            Recarga de Saldo
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
                            Escolha o pacote ideal
                        </h2>
                        <p className="text-slate-500 text-base leading-relaxed">
                            Adicione tokens à sua conta para continuar gerando formulários.
                        </p>
                    </div>

                    {/* Pricing Cards Grid */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

                        {/* Card 1: 300 Tokens */}
                        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-7 transition-all hover:border-[#35b6cf] hover:shadow-lg hover:shadow-slate-100 group">
                            <div className="flex flex-col gap-1 mb-8">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pacote Básico</h3>
                                <p className="flex items-baseline gap-1 text-slate-800 mt-1">
                                    <span className="text-4xl font-bold tracking-tight">300</span>
                                    <span className="text-slate-400 text-sm font-medium">tokens</span>
                                </p>
                                <div className="mt-4 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                                    <span className="text-[10px] font-semibold text-slate-500">R$ 49,00</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onSelect({ id: 'basic', name: 'Pacote Básico', tokens: 300, price: '49,00' })}
                                className="w-full cursor-pointer flex items-center justify-center rounded-xl h-12 px-6 bg-slate-50 hover:bg-[#35b6cf] text-slate-600 hover:text-white text-sm font-bold transition-all border border-slate-100 hover:border-[#35b6cf]"
                            >
                                Selecionar
                            </button>
                        </div>

                        {/* Card 2: 1000 Tokens (Featured) */}
                        <div className="relative flex flex-col rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:border-[#35b6cf] hover:shadow-lg hover:shadow-slate-100">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#35b6cf] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                Mais Popular
                            </div>

                            <div className="flex flex-col gap-1 mb-8">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    Pacote Pro
                                    <Star size={14} className="text-[#35b6cf] fill-[#35b6cf]" />
                                </h3>
                                <p className="flex items-baseline gap-1 text-slate-800 mt-1">
                                    <span className="text-4xl font-bold tracking-tight">1.000</span>
                                    <span className="text-slate-400 text-sm font-medium">tokens</span>
                                </p>
                                <div className="mt-4 px-3 py-1 bg-[#35b6cf]/5 rounded-lg border border-[#35b6cf]/10 w-fit">
                                    <span className="text-[10px] font-bold text-[#35b6cf]">R$ 120,00</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onSelect({ id: 'pro', name: 'Pacote Pro', tokens: 1000, price: '120,00' })}
                                className="w-full cursor-pointer flex items-center justify-center rounded-xl h-12 px-6 bg-slate-50 hover:bg-[#35b6cf] text-slate-600 hover:text-white text-sm font-bold transition-all border border-slate-100 hover:border-[#35b6cf]"
                            >
                                Comprar Agora
                            </button>
                        </div>

                        {/* Card 3: Custom */}
                        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-7 transition-all hover:border-[#35b6cf] hover:shadow-lg hover:shadow-slate-100 group">
                            <div className="flex flex-col gap-1 mb-8">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Empresarial</h3>
                                <p className="flex items-baseline gap-1 text-slate-800 mt-1">
                                    <span className="text-2xl font-bold tracking-tight">Customizado</span>
                                </p>
                                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Sob demanda para altos volumes.</p>
                            </div>

                            <button
                                onClick={() => onSelect({ id: 'custom', name: 'Empresarial', tokens: 0, price: 'Custom' })}
                                className="w-full cursor-pointer flex items-center justify-center rounded-xl h-12 px-6 bg-slate-50 hover:bg-[#35b6cf] text-slate-600 hover:text-white text-sm font-bold transition-all border border-slate-100 hover:border-[#35b6cf]"
                            >
                                Consultar
                            </button>
                        </div>

                    </div>

                    {/* Footer Text */}
                    <div className="mt-10 pt-6 border-t border-slate-50 w-full flex flex-col items-center">
                        <p className="text-[10px] text-slate-400 text-center max-w-sm leading-relaxed">
                            Tokens adicionados instantaneamente após confirmação. <br />
                            Sujeitos aos <a className="text-[#35b6cf] font-medium hover:underline" href="#">Termos de Uso</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
