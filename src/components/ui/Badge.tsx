import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'info';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const VARIANTS: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    neutral: 'bg-slate-100 text-slate-600',
    info: 'bg-blue-100 text-blue-700',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]} ${className}`}>
            {children}
        </span>
    );
};
