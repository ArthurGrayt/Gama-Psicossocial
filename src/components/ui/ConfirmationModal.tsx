import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            icon: <AlertTriangle className="text-red-500" size={24} />,
            button: 'bg-red-500 hover:bg-red-600 shadow-red-100',
            bg: 'bg-red-50'
        },
        info: {
            icon: <AlertTriangle className="text-[#35b6cf]" size={24} />,
            button: 'bg-[#35b6cf] hover:bg-[#2ca1b7] shadow-cyan-100',
            bg: 'bg-cyan-50'
        },
        warning: {
            icon: <AlertTriangle className="text-amber-500" size={24} />,
            button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100',
            bg: 'bg-amber-50'
        }
    };

    const style = typeStyles[type];

    return (
        // Alterado: Backdrop bg-slate-900/60 backdrop-blur-md
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div
                // Alterado: rounded-t-[2rem], overflow-hidden. Mantendo height auto para confirmação mas com max-h-[94dvh] se necessário.
                className="relative bg-white rounded-t-[2rem] md:rounded-2xl w-full md:max-w-md overflow-hidden isolation-isolate shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                style={{ paddingBottom: 'env(safe-area-inset-bottom)', maxHeight: '94dvh' }}
            >
                {/* Header/Icon Area */}
                {/* Alterado: Removida altura fixa h-24 para auto padding, garantindo que não corte */}
                <div className="p-6 md:p-8 flex flex-col items-center text-center relative z-10 rounded-t-[2rem] md:rounded-t-2xl bg-white">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${style.bg}`}>
                        {style.icon}
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="px-8 pt-6 pb-8 text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line">
                        {description}
                    </p>
                </div>

                {/* Actions Area */}
                <div className="px-8 pb-8 flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className={`w-full py-3.5 ${style.button} text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98] outline-none`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98] outline-none"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};
