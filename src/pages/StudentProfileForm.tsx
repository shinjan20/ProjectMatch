import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, BookOpen, UploadCloud, CheckCircle2, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';
import { checkFormForProfanityAsync } from '../utils/profanityFilter';
import ProfanityWarningModal from '../components/ProfanityWarningModal';
import { supabase } from '../lib/supabase';

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

const StudentProfileForm = () => {
    const [college, setCollege] = useState('');
    const [domain, setDomain] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    // Refs for hidden file inputs
    const photoInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    const navigate = useNavigate();
    const { userName, updateUserPhoto, completeProfile, userId } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!college || !domain) {
            setError('Please fill out all required fields.');
            return;
        }

        setIsLoading(true);

        const profanityField = await checkFormForProfanityAsync({ college, domain });
        if (profanityField) {
            setError('Please remove inappropriate language before continuing.');
            setIsLoading(false);
            return;
        }

        try {
            if (userId) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ college, domain })
                    .eq('id', userId);

                if (profileError) throw profileError;
            }

            if (photoFile) {
                const objectUrl = URL.createObjectURL(photoFile);
                updateUserPhoto(objectUrl);
            }
            if (resumeFile) {
                console.log("Saving resume file:", resumeFile.name);
                localStorage.setItem('studentResumeName', resumeFile.name);
                localStorage.setItem('studentResumeUrl', '#');
            }

            // Save text fields to localStorage
            localStorage.setItem('studentCollege', college);
            localStorage.setItem('studentDomain', domain);

            completeProfile(); // Auth Context Flag
            setShowSuccessModal(true);

            // Fire short burst of Confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 10000
            });

            // Animate progress bar and redirect
            let currentProgress = 0;
            const interval = setInterval(() => {
                currentProgress += 10;
                setProgress(currentProgress);
                if (currentProgress >= 100) {
                    clearInterval(interval);
                    setShowSuccessModal(false);
                    setIsLoading(false);
                    navigate('/dashboard/student');
                }
            }, 150);
        } catch (err: any) {
            console.error("Failed to complete profile:", err);
            setError(err.message || 'An error occurred while saving your profile.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-12 flex flex-col justify-center sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-200">
            <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 animate-in fade-in duration-300">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-5">
                        <div className="bg-brand-600 dark:bg-brand-500 p-3.5 rounded-2xl shadow-sm text-white">
                            <Briefcase className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-slate-900 dark:text-white">
                        Complete your profile, {userName || 'Student'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Help verified companies match you with relevant live opportunities.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 sm:p-10 p-6 shadow-sm">
                    <ProfanityWarningModal error={error} onClose={() => setError('')} />
                    {error && (
                        <div className={`mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl items-start gap-3 text-sm animate-in fade-in duration-200 ${(error.toLowerCase().includes('inappropriate') || error.toLowerCase().includes('professional')) ? 'hidden md:flex' : 'flex'}`}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form noValidate onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* College Field */}
                            <div className="col-span-1 md:col-span-2">
                                <label htmlFor="college" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    College / University <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                    </div>
                                    <input
                                        id="college"
                                        type="text"
                                        required
                                        value={college}
                                        onChange={(e) => setCollege(e.target.value)}
                                        placeholder="e.g. University of California, Berkeley"
                                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            {/* Preferred Domain */}
                            <div className="col-span-1 md:col-span-2">
                                <label htmlFor="domain" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Primary Domain <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <BookOpen className="h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
                                    </div>
                                    <select
                                        id="domain"
                                        required
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-900 transition-colors text-sm appearance-none"
                                    >
                                        <option value="" disabled>Select your primary engineering/design track</option>
                                        {DOMAINS.map(d => (
                                            <option key={d} value={d} className="bg-white dark:bg-slate-900">{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Profile Photo Upload */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Profile Picture <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={() => photoInputRef.current?.click()}
                                >
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <ImageIcon className="h-5 w-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
                                    </div>
                                    <div className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white transition-colors text-sm flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700">
                                        <span className={photoFile ? "text-slate-900 dark:text-white" : "text-slate-400"}>
                                            {photoFile ? photoFile.name : "Select an image file..."}
                                        </span>
                                        <UploadCloud className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={photoInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setPhotoFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    PNG, JPG, or WebP up to 5MB.
                                </p>
                            </div>

                            {/* CV / Resume Upload */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Resume / CV Document <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={() => resumeInputRef.current?.click()}
                                >
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <FileText className="h-5 w-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
                                    </div>
                                    <div className="block w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white transition-colors text-sm flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700">
                                        <span className={resumeFile ? "text-slate-900 dark:text-white" : "text-slate-400"}>
                                            {resumeFile ? resumeFile.name : "Upload PDF or DOCX file..."}
                                        </span>
                                        <UploadCloud className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        ref={resumeInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setResumeFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    PDF or Word document up to 10MB.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={isLoading || !college || !domain}
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Save and Continue to Dashboard
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" />
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full mx-auto relative z-10 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Profile Complete!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">
                            Your profile has been saved successfully. Redirecting to your dashboard...
                        </p>

                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-500 transition-all duration-150 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentProfileForm;
