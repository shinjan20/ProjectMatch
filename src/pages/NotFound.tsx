import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19] px-4">
            <div className="text-center max-w-md">
                <p className="text-[120px] font-black text-slate-100 dark:text-slate-800 leading-none select-none">
                    404
                </p>
                <div className="-mt-6 relative z-10">
                    <h1 className="text-3xl font-bold font-heading text-slate-900 dark:text-white mb-3">
                        Page not found
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        The page you're looking for doesn't exist or may have been moved. Double-check the URL or head back to a known page.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> Go back
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-colors font-semibold text-sm"
                        >
                            <Home className="w-4 h-4" /> Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
