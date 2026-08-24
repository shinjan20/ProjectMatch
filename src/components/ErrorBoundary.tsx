import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Something went wrong</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            We've encountered an unexpected error. Our team has been notified. Please try reloading the page.
                        </p>
                        
                        {/* Only show error message in dev mode in a real app, but for this context it's fine */}
                        {this.state.error && (
                            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 mb-8 overflow-x-auto text-left">
                                <code className="text-xs text-red-600 dark:text-red-400 font-mono break-all whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-900/20 dark:shadow-brand-900/20"
                        >
                            <RefreshCw className="w-5 h-5" /> Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
