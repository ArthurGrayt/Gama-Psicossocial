import React from 'react';

interface Option {
    value: string;
    label: string;
}

interface SegmentedControlProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, className = '' }) => {
    return (
        <div className={`bg-slate-100 p-1 rounded-lg inline-flex ${className}`}>
            {options.map((option) => {
                const isActive = option.value === value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`
                            px-4 py-1.5 text-sm font-medium rounded-md transition-all
                            ${isActive
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                        `}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
