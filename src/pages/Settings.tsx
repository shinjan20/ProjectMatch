import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Briefcase, Mail, Globe, Save, Lock, Building2, BookOpen, Link as LinkIcon, AlertCircle, LogOut } from 'lucide-react';
import { checkFormForProfanityAsync } from '../utils/profanityFilter';
import ProfanityWarningModal from '../components/ProfanityWarningModal';
import { getPasswordStrength, type PasswordStrength } from '../utils/passwordStrength';

// DOMAINS reference duplicated from the profile form logic
const DOMAINS = [
    'Software Engineering',
    'Data Science & AI',
    'Product Management',
    'Design (UI/UX)',
    'Marketing',
    'Operations',
    'Business Analyst',
    'Other'
];

const Settings = () => {
    const { userRole, userName, userEmail, login, updatePassword, logout } = useAuth();

    // Form State
    const [name, setName] = useState(userName);
    const [email, setEmail] = useState(userEmail || '');
    const [companyName, setCompanyName] = useState('Acme Corp'); // Mock company data
    const [companyWebsite, setCompanyWebsite] = useState('https://acme.com');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

    // Student specific variables
    const [college, setCollege] = useState(localStorage.getItem('studentCollege') || '');
    const [domain, setDomain] = useState(localStorage.getItem('studentDomain') || '');
    const [resumeUrl, setResumeUrl] = useState(localStorage.getItem('studentResumeUrl') || '');

    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Basic Empty Field Validation
        if (!name) {
            setError('Full Name is required.');
            return;
        }

        if (userRole === 'recruiter') {
            if (!companyName || !companyWebsite) {
                setError('Company details are required.');
                return;
            }
        } else {
            if (!college || !domain) {
                setError('College and Domain are required.');
                return;
            }
        }

        // Profanity Check
        setIsSaving(true);
        const fieldsToCheck = { name, companyName, college };
        const profanityField = await checkFormForProfanityAsync(fieldsToCheck);
        if (profanityField) {
            setError('Please remove inappropriate language before saving.');
            setIsSaving(false);
            return;
        }

        // Simulate API save
        setTimeout(() => {
            login(userRole, name); // Update the name in context

            // Save student data if applicable
            if (userRole === 'student') {
                localStorage.setItem('studentCollege', college);
                localStorage.setItem('studentDomain', domain);
                localStorage.setItem('studentResumeUrl', resumeUrl);
            }

            setIsSaving(false);
            setSuccessMessage('Profile details updated successfully.');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        }, 1000);
    };

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const password = e.target.value;
        setNewPassword(password);
        if (password) {
            setPasswordStrength(getPasswordStrength(password));
        } else {
            setPasswordStrength(null);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!currentPassword || !newPassword) {
            setError('Please provide both current and new passwords.');
            return;
        }

        if (passwordStrength === 'Weak') {
            setError('Please choose a stronger password.');
            return;
        }

        try {
            await updatePassword(currentPassword, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setPasswordStrength(null);
            setSuccessMessage('Password changed successfully.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            // Note: If logged in with Google/OAuth, they won't have a password set to update.
            console.error("Password update error:", err);
            if (err.message?.includes("User not authenticated") || err.message?.includes("Incorrect current password")) {
                setError('Incorrect current password, or your account relies on Google Login and has no password.');
            } else {
                setError(err.message || 'Failed to update password.');
            }
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white mb-2">Account Settings</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Update your personal information and password.</p>
                </div>

                {successMessage && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                )}

                <ProfanityWarningModal error={error} onClose={() => setError('')} />
                {error && (
                    <div className={`mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${(error.toLowerCase().includes('inappropriate') || error.toLowerCase().includes('professional')) ? 'hidden md:flex' : 'flex'}`}>
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Profile Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card p-6 md:p-8">
                            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Personal Information</h2>

                            <form noValidate onSubmit={handleSaveProfile} className="space-y-5">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-not-allowed transition-all font-medium"
                                            disabled
                                            title="Email cannot be changed."
                                        />
                                    </div>
                                </div>

                                {userRole === 'recruiter' ? (
                                    <>
                                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Company Details</h3>
                                        </div>

                                        <div>
                                            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Briefcase className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <input
                                                    id="companyName"
                                                    type="text"
                                                    value={companyName}
                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="companyWebsite" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Website</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Globe className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <input
                                                    id="companyWebsite"
                                                    type="url"
                                                    value={companyWebsite}
                                                    onChange={(e) => setCompanyWebsite(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Student Profile Details</h3>
                                        </div>

                                        <div>
                                            <label htmlFor="college" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College / University Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Building2 className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <input
                                                    id="college"
                                                    type="text"
                                                    value={college}
                                                    onChange={(e) => setCollege(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                                    placeholder="e.g. Indian Institute of Technology"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="domain" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preferred Domain</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <BookOpen className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <select
                                                    id="domain"
                                                    value={domain}
                                                    onChange={(e) => setDomain(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none font-medium"
                                                >
                                                    <option value="" disabled>Select your primary domain</option>
                                                    {DOMAINS.map(d => (
                                                        <option key={d} value={d} className="bg-white dark:bg-slate-900">{d}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="resumeUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resume / CV Link</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <LinkIcon className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <input
                                                    id="resumeUrl"
                                                    type="url"
                                                    value={resumeUrl}
                                                    onChange={(e) => setResumeUrl(e.target.value)}
                                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                                    placeholder="https://drive.google.com/..."
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 border border-transparent text-white py-2.5 px-5 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-70"
                                    >
                                        {isSaving ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" /> Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar Area: Password Change */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-card p-6 border-red-100 dark:border-red-900/30">
                            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">Security</h2>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label htmlFor="currentPassword" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Current Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            id="currentPassword"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            id="newPassword"
                                            type="password"
                                            value={newPassword}
                                            onChange={handleNewPasswordChange}
                                            required
                                            className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                        />
                                    </div>
                                    {newPassword && passwordStrength && (
                                        <div className="mt-2.5 space-y-2 animate-in fade-in duration-300">
                                            <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-500 ${passwordStrength === 'Weak' ? 'w-1/3 bg-red-400' :
                                                        passwordStrength === 'Medium' ? 'w-2/3 bg-yellow-400' :
                                                            'w-full bg-green-400'
                                                    }`} />
                                            </div>
                                            <p className={`text-xs font-medium text-right ${passwordStrength === 'Weak' ? 'text-red-500 dark:text-red-400' :
                                                    passwordStrength === 'Medium' ? 'text-yellow-600 dark:text-yellow-500' :
                                                        'text-green-600 dark:text-green-500'
                                                }`}>
                                                {passwordStrength === 'Weak' ? 'Weak Password' :
                                                    passwordStrength === 'Medium' ? 'Good Password' :
                                                        'Strong Password'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700"
                                >
                                    Update Password
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Account Actions */}
                    <div className="lg:col-span-3 mt-4">
                        <div className="glass-card p-6 md:p-8 border-red-200/50 dark:border-red-900/30">
                            <h2 className="text-xl font-bold font-heading text-red-600 dark:text-red-400 mb-4 border-b border-red-100 dark:border-red-900/20 pb-4">Account Actions</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Sign out of your account on this device.
                            </p>
                            <button
                                onClick={logout}
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-bold transition-colors border border-red-200 dark:border-red-800/50"
                            >
                                <LogOut className="w-5 h-5" /> Sign Out
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Settings;
