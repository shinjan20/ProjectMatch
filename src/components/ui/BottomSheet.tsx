import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    fullScreenOnMobile?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    fullScreenOnMobile = false 
}) => {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            // Slight delay to allow DOM to render before triggering animation
            const timer = setTimeout(() => setIsVisible(true), 10);
            document.body.style.overflow = 'hidden'; // Lock body scroll
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            document.body.style.overflow = ''; // Restore body scroll
            const timer = setTimeout(() => setIsRendered(false), 300); // Wait for transition
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (!isRendered) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            
            {/* Sheet */}
            <div 
                className={`
                    relative w-full bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-out transform
                    ${isVisible ? 'translate-y-0' : 'translate-y-full'}
                    ${fullScreenOnMobile ? 'h-[90vh] sm:h-auto rounded-t-3xl' : 'max-h-[85vh] rounded-t-3xl'}
                    flex flex-col
                `}
            >
                {/* Drag handle area (purely visual in this simple version, could be extended for actual dragging) */}
                <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                        {title}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                        aria-label="Close sheet"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 pb-safe-bottom">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;
