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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header/Icon Area */}
                <div className="relative h-24 flex items-center justify-center border-b border-slate-50">
                    <div className={`w-16 h-16 ${style.bg} rounded-2xl flex items-center justify-center animate-bounce-subtle`}>
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
