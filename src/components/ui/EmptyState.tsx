import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    actionIcon?: LucideIcon;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
    icon: Icon, 
    title, 
    description, 
    actionLabel, 
    onAction,
    actionIcon: ActionIcon
}) => {
    return (
        <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700/50">
                <Icon className="w-10 h-10 text-brand-500/80" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-8">
                {description}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl hover:bg-brand-600 dark:hover:bg-brand-500 hover:text-white transition-all btn-interactive shadow-sm"
                >
                    {ActionIcon && <ActionIcon className="w-4 h-4" />}
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
