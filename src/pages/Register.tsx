import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Mail, Lock, User, AlertCircle, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { checkFormForProfanityAsync } from '../utils/profanityFilter';
import ProfanityWarningModal from '../components/ProfanityWarningModal';

const getPasswordStrength = (pass: string): 'Weak' | 'Medium' | 'Strong' | '' => {
    if (!pass) return '';
    if (pass.length < 8) return 'Weak';
    
    let score = 0;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 1) return 'Weak';
    if (score === 2 || score === 3) return 'Medium';
    if (score >= 4) return 'Strong';
    
    return 'Weak';
};

const Register = () => {
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { registerWithEmail, loginWithGoogle } = useAuth();
    
    const passwordStrength = getPasswordStrength(password);

    const typeParam = searchParams.get('type');
    const isStudent = typeParam === 'student';
    const isRecruiter = typeParam === 'recruiter';

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Check for profanity in the text fields
            const profanityField = await checkFormForProfanityAsync({ name, companyName });
            if (profanityField) {
                setError('Please remove inappropriate language before continuing.');
                setIsLoading(false);
                return;
            }

            if (!isRecruiter) {
                if (!name || !email || !password) {
                    setError('Please fill out all fields.');
                    setIsLoading(false);
                    return;
                }
                if (passwordStrength === 'Weak') {
                    setError('Please use a stronger password (must be at least 8 characters).');
                    setIsLoading(false);
                    return;
                }

                if (step === 1) {
                    await registerWithEmail(email, password, name, 'student');
                    setStep(2); // Show confirmation message
                    setIsLoading(false);
                } else if (step === 2) {
                    // Return to login
                    navigate('/login');
                }
                return;
            }

            // Recruiter flow
            if (step === 1) {
                if (!name || !email || !companyName || !companyWebsite || !password) {
                    setError('Please fill out all fields including password.');
                    setIsLoading(false);
                    return; // FIX #1: was missing — prevented early exit
                }
                if (passwordStrength === 'Weak') {
                    setError('Please use a stronger password (must be at least 8 characters).');
                    setIsLoading(false);
                    return;
                }

                const publicDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com'];
                const domain = email.split('@')[1]?.toLowerCase();
                if (!domain || publicDomains.includes(domain)) {
                    setError('Recruiters must register with a valid company email address.');
                    setIsLoading(false);
                    return;
                }

                await registerWithEmail(email, password, name, 'recruiter', { companyName, companyWebsite });
                setStep(2); // Show confirmation message
                setIsLoading(false);
            } else if (step === 2) {
                // For recruiters on step 2, they have seen the confirmation, so we just return them to login
                navigate('/login');
            }
        } catch (err: unknown) {
            console.error('Registration error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred during registration.');
            setIsLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setIsLoading(true);
        try {
            await loginWithGoogle(isRecruiter ? 'recruiter' : 'student');
            // Redirection happens via AuthCallback.tsx
        } catch (err: unknown) {
            console.error('Google Auth Error:', err);
            setError(err instanceof Error ? err.message : 'Failed to initialize Google Login.');
            setIsLoading(false);
        }
    };

    if (!isStudent && !isRecruiter) {
        return (
            <div className="relative min-h-screen pt-24 pb-12 flex flex-col justify-center sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-300 overflow-hidden">
                {/* Clean Flat Background */}
                <div className="absolute inset-0 pointer-events-none z-0" />

                <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-200 dark:bg-slate-800 p-3 rounded-2xl">
                            <Briefcase className="w-8 h-8 text-slate-850 dark:text-white" />
                        </div>
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                        Choose your account type to get started
                    </p>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="glass-card py-10 px-6 sm:px-10">
                        <div className="space-y-5">
                            <Link to="/register?type=student" className="relative block w-full">
                                <div className="relative flex items-center p-5 border border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-xl transition-all bg-white dark:bg-slate-900">
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="p-3.5 bg-brand-500/10 text-brand-400 rounded-xl transition-all duration-300">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Student</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Build experience with real-world projects</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link to="/register?type=recruiter" className="relative block w-full">
                                <div className="relative flex items-center p-5 border border-slate-200 dark:border-slate-800 hover:border-purple-500 rounded-xl transition-all bg-white dark:bg-slate-900">
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="p-3.5 bg-purple-500/10 text-purple-400 rounded-xl transition-all duration-300">
                                            <Briefcase className="w-7 h-7" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Recruiter</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Find top talent through live projects</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                    <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pt-24 pb-12 flex flex-col justify-center sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-300 overflow-hidden">
            {/* Clean Flat Background */}
            <div className="absolute inset-0 pointer-events-none z-0" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center gap-2 group">
                    <div className="bg-slate-200 dark:bg-slate-800 p-3 rounded-2xl">
                        <Briefcase className="w-8 h-8 text-slate-850 dark:text-white" />
                    </div>
                    </Link>
                </div>
                <h2 className="mt-2 text-center text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Join as a <span className="text-brand-600 dark:text-brand-400">{isRecruiter ? 'Recruiter' : 'Student'}</span>
                </h2>
                <p className="mt-3 text-center text-base text-slate-600 dark:text-slate-400">
                    {isRecruiter ? 'Find top talent through live projects' : 'Build experience with real-world projects'}
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="glass-card py-8 px-6 sm:px-10 relative overflow-hidden">
                    {/* No decorative blobs */}

                    <ProfanityWarningModal error={error} onClose={() => setError('')} />
                    {error && (
                        <div className={`mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl items-start gap-3 text-sm animate-in fade-in zoom-in duration-300 ${(error.toLowerCase().includes('inappropriate') || error.toLowerCase().includes('professional')) ? 'hidden md:flex' : 'flex'}`}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form noValidate className="space-y-5 relative z-10" onSubmit={handleEmailRegister}>
                        {(!isRecruiter || step === 1) && (
                            <>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                        Full name
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            autoComplete="name"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                {isRecruiter && (
                                    <>
                                        <div>
                                            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                                Company Name
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Briefcase className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                                                </div>
                                                <input
                                                    id="companyName"
                                                    name="companyName"
                                                    type="text"
                                                    required={isRecruiter}
                                                    value={companyName}
                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                                    placeholder="Acme Corp"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="companyWebsite" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                                Company Website
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Globe className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                                                </div>
                                                <input
                                                    id="companyWebsite"
                                                    name="companyWebsite"
                                                    type="url"
                                                    required={isRecruiter}
                                                    value={companyWebsite}
                                                    onChange={(e) => setCompanyWebsite(e.target.value)}
                                                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                                    placeholder="https://acme.com"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                        Email address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="mt-2 ml-1">
                                        <div className="flex gap-1 h-1.5 mb-1.5 w-full">
                                            <div className={`h-full flex-1 rounded-l-full transition-colors ${passwordStrength === 'Weak' ? 'bg-red-500' : passwordStrength === 'Medium' || passwordStrength === 'Strong' ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                            <div className={`h-full flex-1 transition-colors ${passwordStrength === 'Medium' ? 'bg-amber-500' : passwordStrength === 'Strong' ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                            <div className={`h-full flex-1 rounded-r-full transition-colors ${passwordStrength === 'Strong' ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                        </div>
                                        {passwordStrength && (
                                            <div className="flex justify-between items-center text-[11px] mt-1 pr-1">
                                                <span className={`font-semibold ${passwordStrength === 'Weak' ? 'text-red-500' : passwordStrength === 'Medium' ? 'text-amber-500' : passwordStrength === 'Strong' ? 'text-green-500' : 'text-slate-500'}`}>
                                                    {passwordStrength === 'Weak' && 'Weak - Must be 8+ chars & include letters/numbers'}
                                                    {passwordStrength === 'Medium' && 'Medium - Add uppercase or symbols'}
                                                    {passwordStrength === 'Strong' && 'Strong password'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div className="text-center py-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 mb-6 relative">
                                    <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping opacity-75"></div>
                                    <Mail className="w-8 h-8 relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center leading-relaxed">
                                    We've sent a confirmation link to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>. Click the link to activate your {isRecruiter ? 'Recruiter' : 'Student'} account.
                                </p>
                            </div>
                        )}

                        <div className="pt-2 flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full flex justify-center py-3.5 px-4 rounded-2xl shadow-md shadow-brand-500/20 text-white font-bold text-base focus:outline-none overflow-hidden group/btn bg-brand-600 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-brand-600 hover:bg-brand-500 transition-colors"></div>
                                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover/btn:w-56 group-hover/btn:h-56 opacity-10 blur-xl"></span>
                                <span className="relative flex items-center gap-2">
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        step === 1 ? 'Continue to Email Verification' :
                                            step === 2 ? 'Return to Login' : 'Create account'
                                    )}
                                </span>
                            </button>
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3.5 px-4 rounded-2xl text-slate-600 dark:text-slate-400 font-bold text-base hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-70"
                                >
                                    Back
                                </button>
                            )}
                        </div>
                    </form>

                    {!isRecruiter && (
                        <div className="mt-8 relative z-10">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-3 bg-white dark:bg-slate-900 text-slate-500 rounded-full text-xs font-semibold tracking-wide uppercase">
                                        Or sign up with
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={handleGoogleRegister}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-slate-300 dark:border-slate-750 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <svg className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                        <path d="M1 1h22v22H1z" fill="none" />
                                    </svg>
                                    Continue with Google
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-500 relative z-10">
                    By registering, you agree to our{' '}
                    <a href="#" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">Terms of Service</a> and{' '}
                    <a href="#" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">Privacy Policy</a>.
                </p>

                <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400 relative z-10">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
