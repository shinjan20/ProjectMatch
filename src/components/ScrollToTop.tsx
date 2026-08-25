import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

const ScrollToTop = () => {
    const { pathname } = useLocation();
    const [isVisible, setIsVisible] = useState(false);

    // Route change scroll
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    // Scroll visibility toggle
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-[calc(var(--mobile-nav-height)+var(--safe-bottom)+16px)] md:bottom-8 right-4 md:right-8 z-[45] p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-full shadow-lg shadow-brand-900/20 hover:shadow-xl hover:-translate-y-1 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
            aria-label="Scroll to top"
        >
            <ArrowUp className="w-5 h-5" />
        </button>
    );
};

export default ScrollToTop;
