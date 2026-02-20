import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
    label: string;
    value: string | number;
}

interface SelectProps {
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = "Selecione...",
    disabled = false,
    className = "",
    fullWidth = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    const toggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;

        if (isOpen) {
            setIsOpen(false);
        } else {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (rect) {
                setPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
                setIsOpen(true);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (menuRef.current && !menuRef.current.contains(target) &&
                triggerRef.current && !triggerRef.current.contains(target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', () => setIsOpen(false), true);
            window.addEventListener('resize', () => setIsOpen(false));
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', () => setIsOpen(false), true);
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    return (
        <div className={`relative inline-block ${fullWidth ? 'w-full' : ''} ${className}`}>
            <button
                ref={triggerRef}
                onClick={toggle}
                disabled={disabled}
                type="button" // Important to prevent form submission inside forms
                className={`
                    flex items-center justify-between w-full h-full text-left
                    px-4 py-2.5 rounded-xl border transition-all shadow-sm
                    ${disabled
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : isOpen
                            ? 'bg-slate-50 text-slate-800 border-[#35b6cf] ring-2 ring-[#35b6cf]/10'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#35b6cf] hover:bg-slate-50'
                    }
                `}
            >
                <span className={`block truncate ${!selectedOption ? 'text-slate-400' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`ml-2 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#35b6cf]' : 'text-slate-400'}`}
                />
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[10000] bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col"
                    style={{
                        top: `${position.top + 8}px`,
                        left: `${position.left}px`,
                        width: `${position.width}px`,
                        maxHeight: '300px'
                    }}
                >
                    <div className="overflow-y-auto custom-scrollbar py-1.5 p-1">
                        {options.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center">
                                Sem opções disponíveis
                            </div>
                        ) : (
                            options.map((option, index) => {
                                const isSelected = String(option.value) === String(value);
                                return (
                                    <button
                                        key={`${option.value}-${index}`}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChange(String(option.value));
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            w-full text-left px-3 py-2.5 text-sm font-medium flex items-center gap-2 transition-all rounded-lg mb-0.5 last:mb-0
                                            ${isSelected
                                                ? 'bg-[#35b6cf]/10 text-[#35b6cf]'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }
                                        `}
                                    >
                                        <span className="flex-1 truncate">{option.label}</span>
                                        {isSelected && <Check size={14} className="text-[#35b6cf] shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
