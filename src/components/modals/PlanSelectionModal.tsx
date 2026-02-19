import React, { useState } from 'react';
import { X, Star, Settings2 } from 'lucide-react';

interface PlanSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (pkg: { id: string; name: string; tokens: number; price: string }) => void;
}

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [customTokens, setCustomTokens] = useState<number>(2000);

    if (!isOpen) return null;

    const PRICE_PER_TOKEN_BASIC = 49 / 300;
    const PRICE_PER_TOKEN_PRO = 120 / 1000;
    const PRICE_PER_TOKEN_CUSTOM = 0.10;

    const customTotal = (customTokens * PRICE_PER_TOKEN_CUSTOM).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        // Wrapper Principal
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4">

            {/* Backdrop Separado */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="relative bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-[960px] h-[94dvh] md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden isolation-isolate animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300 border border-slate-100"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
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
                                <div className="flex flex-col">
                                    <p className="flex items-baseline gap-1 text-slate-800 mt-1">
                                        <span className="text-4xl font-bold tracking-tight">300</span>
                                        <span className="text-slate-400 text-sm font-medium">tokens</span>
                                    </p>
                                    <span className="text-xs text-[#35b6cf] font-bold ml-1 px-2 py-0.5 bg-[#35b6cf]/5 rounded-md border border-[#35b6cf]/10 w-fit">
                                        R$ {PRICE_PER_TOKEN_BASIC.toFixed(2).replace('.', ',')}/token
                                    </span>
                                </div>
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
                                <div className="flex flex-col">
                                    <p className="flex items-baseline gap-1 text-slate-800 mt-1">
                                        <span className="text-4xl font-bold tracking-tight">1.000</span>
                                        <span className="text-slate-400 text-sm font-medium">tokens</span>
                                    </p>
                                    <span className="text-xs text-[#35b6cf] font-bold ml-1 px-2 py-0.5 bg-[#35b6cf]/5 rounded-md border border-[#35b6cf]/10 w-fit">
                                        R$ {PRICE_PER_TOKEN_PRO.toFixed(2).replace('.', ',')}/token
                                    </span>
                                </div>
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
                        <div className="flex flex-col rounded-2xl border border-[#35b6cf]/30 bg-white p-7 transition-all hover:border-[#35b6cf] hover:shadow-lg hover:shadow-slate-100 group">
                            <div className="flex flex-col gap-1 mb-6">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    Customizado
                                    <Settings2 size={14} className="text-slate-300" />
                                </h3>

                                <div className="mt-4 space-y-3">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={customTokens}
                                            onChange={(e) => setCustomTokens(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35b6cf]/20 focus:border-[#35b6cf] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="Ex: 2000"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold uppercase tracking-tight">tokens</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-xs text-[#35b6cf] font-bold ml-1 px-2 py-0.5 bg-[#35b6cf]/5 rounded-md border border-[#35b6cf]/10 w-fit">
                                            R$ {PRICE_PER_TOKEN_CUSTOM.toFixed(2).replace('.', ',')}/token
                                        </span>
                                        <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                                            <span className="text-xs font-bold text-slate-600">Total: R$ {customTotal}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => onSelect({
                                    id: 'custom',
                                    name: 'Pacote Customizado',
                                    tokens: customTokens,
                                    price: customTotal
                                })}
                                className="w-full cursor-pointer flex items-center justify-center rounded-xl h-12 px-6 bg-[#35b6cf]/10 hover:bg-[#35b6cf] text-[#35b6cf] hover:text-white text-sm font-bold transition-all border border-[#35b6cf]/20 hover:border-[#35b6cf]"
                            >
                                Selecionar
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
