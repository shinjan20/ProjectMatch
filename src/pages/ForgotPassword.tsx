import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address to reset your password.');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) throw resetError;

            setIsSuccess(true);
        } catch (err: any) {
            console.error('Password Reset Error:', err);
            setError(err.message || 'Failed to send password reset email.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen pt-24 pb-12 flex flex-col justify-center sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#030712] transition-colors duration-500 overflow-hidden">
            {/* Animated Mesh Background Splashes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-500/20 dark:bg-brand-500/10 blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 dark:bg-purple-500/10 blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen"></div>
                {/* Noise texture overlay for texture */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-center mb-6">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-12 h-12 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                <path d="M12 16 L4 8 H12 L20 16 L12 24 H4 L12 16 Z" fill="currentColor" className="text-slate-900 dark:text-white" />
                                <path d="M22 16 L14 8 H22 L30 16 L22 24 H14 L22 16 Z" fill="#4F46E5" />
                            </svg>
                        </div>
                    </Link>
                </div>
                <h2 className="mt-2 text-center text-3xl md:text-4xl font-extrabold font-heading tracking-tight text-slate-900 dark:text-white">
                    Reset your password
                </h2>
                <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                    {!isSuccess
                        ? "Enter your email address and we'll send you a link to reset your password."
                        : "Check your email for the reset link."}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="glass-card py-10 px-6 sm:px-10 relative overflow-hidden">
                    {/* Decorative blob */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-brand-500/10 blur-2xl"></div>

                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {isSuccess ? (
                        <div className="text-center relative z-10 animate-in fade-in zoom-in-95 duration-500">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Email Sent</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
                                We've sent an email to <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span> with instructions to reset your password.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex justify-center py-3 px-4 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 btn-interactive"
                            >
                                Return to login
                            </button>
                        </div>
                    ) : (
                        <form noValidate className="space-y-6 relative z-10" onSubmit={handlePasswordReset}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Email address
                                </label>
                                <div className="mt-1 relative rounded-xl shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all input-interactive"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !email.trim()}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-brand-500/20 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 btn-interactive"
                                >
                                    {isSubmitting ? (
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {!isSuccess && (
                    <div className="mt-8 text-center text-sm relative z-10">
                        <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to sign in
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
