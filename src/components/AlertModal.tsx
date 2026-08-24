import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

const AlertModal = ({
    isOpen,
    title,
    message,
    type = 'info',
    onClose
}: AlertModalProps) => {
    useKeyboardShortcut('Escape', onClose, { enabled: isOpen });

    if (!isOpen) return null;

    const buttonColors = {
        success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        info: 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500'
    };

    const iconColors = {
        success: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
        error: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
        info: 'text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/30'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="flex justify-end -mt-2 -mr-2">
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex justify-center mb-4">
                        <div className={`p-4 rounded-full ${iconColors[type]}`}>
                            {type === 'success' && <CheckCircle2 className="w-8 h-8" />}
                            {type === 'error' && <AlertTriangle className="w-8 h-8" />}
                            {type === 'info' && <Info className="w-8 h-8" />}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className={`w-full py-2.5 rounded-xl font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 btn-interactive ${buttonColors[type]}`}
                    >
                        Okay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
