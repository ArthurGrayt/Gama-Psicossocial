import React from 'react';
import { X, Check } from 'lucide-react';

interface PlansModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPlanSelect: (plan: { id: string, name: string, tokens: number, price: string }) => void;
}

export const PlansModal: React.FC<PlansModalProps> = ({ isOpen, onClose, onPlanSelect }) => {
    if (!isOpen) return null;

    const plans = [
        {
            id: 'mensal',
            name: 'Pacote Mensal',
            price: '3.000,00',
            pricePerEval: '10,00',
            tokens: 300,
            features: ['300 avaliações', 'Relatório de Conformidade Básico']
        },
        {
            id: 'anual',
            name: 'Plano Anual',
            price: '6.000,00',
            pricePerEval: '5,00',
            tokens: 1200,
            isFeatured: true,
            discount: 'Economize 50% com faturamento anual',
            features: ['Até 1.200 avaliações', 'Suíte Completa de Conformidade', 'Suporte Prioritário']
        },
        {
            id: 'semestral',
            name: 'Pacote Semestral',
            price: '3.500,00',
            pricePerEval: '7,00',
            tokens: 500,
            features: ['Até 500 avaliações', 'Relatórios Padrão']
        }
    ];

    return (
        // Wrapper Principal
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4">

            {/* Backdrop Separado */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Container do Modal */}
            <div
                className="relative bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-6xl h-[94dvh] md:h-auto md:max-h-[90vh] shadow-2xl overflow-hidden isolation-isolate animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300 border border-slate-100 flex flex-col"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 relative z-10 rounded-t-[2rem] md:rounded-t-[2rem] bg-white">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50"
                    >
                        <X size={24} />
                    </button>

                    <div className="text-center mb-12">
                        <span className="text-[#139690] font-bold text-xs uppercase tracking-widest">Preços</span>
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mt-2">Invista no Seu Pessoal</h2>
                        <p className="mt-4 text-slate-500">Preços transparentes para empresas de todos os portes.</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 items-stretch">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col rounded-2xl border p-7 transition-all hover:shadow-lg group ${plan.isFeatured
                                    ? 'border-[#139690] bg-white shadow-md'
                                    : 'border-slate-100 bg-white hover:border-[#139690]'
                                    }`}
                            >
                                {plan.isFeatured && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#139690] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                        Melhor Valor
                                    </div>
                                )}

                                <div className="flex flex-col gap-1 mb-8">
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        {plan.name}
                                        {plan.isFeatured && <Check className="text-[#139690]" size={14} />}
                                    </h3>
                                    <div className="flex flex-col">
                                        <p className="flex items-baseline gap-1 text-slate-800 mt-1">
                                            <span className="text-slate-400 text-sm font-medium">R$</span>
                                            <span className={`${plan.isFeatured ? 'text-5xl' : 'text-4xl'} font-extrabold tracking-tight`}>{plan.price}</span>
                                        </p>
                                        <span className="text-xs text-[#139690] font-bold mt-2 px-2 py-0.5 bg-[#139690]/5 rounded-md border border-[#139690]/10 w-fit">
                                            R$ {plan.pricePerEval}/aval
                                        </span>
                                    </div>
                                    {plan.discount && (
                                        <p className="text-[#139690] text-xs font-bold mt-4 bg-[#139690]/5 p-2 rounded-lg border border-[#139690]/10">
                                            {plan.discount}
                                        </p>
                                    )}
                                    <ul className="text-left space-y-3 mt-6 text-sm text-slate-600">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex gap-2 items-center">
                                                <Check className="text-[#139690]" size={18} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => onPlanSelect({ id: plan.id, name: plan.name, tokens: plan.tokens, price: plan.price })}
                                    className={`mt-auto w-full cursor-pointer flex items-center justify-center rounded-xl h-12 px-6 font-bold transition-all ${plan.isFeatured
                                        ? 'bg-[#139690] hover:bg-teal-700 text-white shadow-md shadow-[#139690]/20'
                                        : 'bg-slate-50 hover:bg-[#139690] text-slate-600 hover:text-white border border-slate-100 hover:border-[#139690]'
                                        }`}
                                >
                                    Selecionar Plano
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
