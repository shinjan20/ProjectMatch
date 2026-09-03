import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper, X } from 'lucide-react';

interface CelebrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    primaryActionText?: string;
    onPrimaryAction?: () => void;
    children?: React.ReactNode;
    hideConfetti?: boolean;
    icon?: React.ReactNode;
}

export default function CelebrationModal({ isOpen, onClose, title, message, primaryActionText, onPrimaryAction, children, hideConfetti, icon }: CelebrationModalProps) {
    useEffect(() => {
        if (isOpen && !hideConfetti) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full mx-auto relative z-10 shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-center">
                <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-20 h-20 mx-auto mb-6 relative">
                    <div className="w-full h-full bg-brand-600 dark:bg-brand-500 rounded-2xl flex items-center justify-center shadow-sm text-white">
                        {icon || <PartyPopper className="w-10 h-10" />}
                    </div>
                </div>

                <h3 className="text-2xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-2">
                    {title}
                </h3>

                <p className="text-slate-600 dark:text-slate-300 mb-8 text-base font-normal">
                    {message}
                </p>

                {children && <div className="mb-8 text-left">{children}</div>}

                <div className={`flex gap-3 ${primaryActionText ? 'flex-col sm:flex-row' : ''}`}>
                    <button
                        onClick={onClose}
                        className={`w-full py-4 text-white bg-slate-900 dark:bg-slate-800 dark:text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-md btn-interactive ${primaryActionText ? 'order-2 sm:order-1 sm:flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-none' : ''}`}
                    >
                        {primaryActionText ? 'Maybe Later' : 'Continue'}
                    </button>
                    {primaryActionText && onPrimaryAction && (
                        <button
                            onClick={() => {
                                onPrimaryAction();
                            }}
                            className="order-1 sm:order-2 w-full sm:flex-1 py-4 text-white bg-brand-600 hover:bg-brand-700 font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-brand-500/20 btn-interactive"
                        >
                            {primaryActionText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
