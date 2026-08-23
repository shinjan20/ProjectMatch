import { useState } from 'react';
import { X, Send, Link as LinkIcon, AlertCircle, Sparkles } from 'lucide-react';
import { MOCK_PROJECTS } from '../../constants';
import { checkFormForProfanityAsync } from '../../utils/profanityFilter';
import ProfanityWarningModal from '../ProfanityWarningModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { calculateMatchScore } from '../../utils/aiMatch';

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | number; // Support string for UUIDs from Supabase
    project?: {
        id?: string | number;
        title?: string;
        company?: string;
        duration?: string;
        type?: string;
        tags?: string[];
        [key: string]: any;
    };
    onSubmitSuccess: () => void;
}

export default function ApplicationModal({ isOpen, onClose, projectId, project: passedProject, onSubmitSuccess }: ApplicationModalProps) {
    if (!isOpen) return null;

    const { userId } = useAuth();
    // Assuming for now project details might come from MOCK_PROJECTS if not fetched dynamically here. Realistically, we might want to pass project details as props or fetch them.
    // If it's a UUID, it won't be in MOCK_PROJECTS, but Projects.tsx currently filters from MOCK_PROJECTS.
    // So this is partially mocked until Projects.tsx is connected to Supabase full.
    const project = passedProject || MOCK_PROJECTS.find(p => p.id === projectId);

    const [coverLetter, setCoverLetter] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState(localStorage.getItem('studentResumeUrl') || '');
    const [availability, setAvailability] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [matchFeedback, setMatchFeedback] = useState<string>('');
    const [isCalculatingScore, setIsCalculatingScore] = useState(false);

    if (!project) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!userId) {
            setError('You must be logged in to apply.');
            return;
        }

        if (!coverLetter || !availability) {
            setError('Please fill out all required fields.');
            return;
        }

        setIsSubmitting(true);

        const profanityField = await checkFormForProfanityAsync({ coverLetter });
        if (profanityField) {
            setError('Please remove inappropriate language from your application.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Check if already applied (optional guard)
            const { data: existingApp } = await supabase
                .from('applications')
                .select('id')
                .eq('project_id', projectId)
                .eq('student_id', userId)
                .maybeSingle();

            if (existingApp) {
                setError('You have already applied to this project.');
                setIsSubmitting(false);
                return;
            }

            const { error: insertError } = await supabase
                .from('applications')
                .insert([{
                    project_id: projectId,
                    student_id: userId,
                    cover_letter: coverLetter,
                    portfolio_url: portfolioUrl,
                    availability: availability,
                    status: 'pending'
                }]);

            if (insertError) throw insertError;

            toast.success('Application submitted successfully!');
            onSubmitSuccess();
        } catch (err: unknown) {
            console.error('Application error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to submit application.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCalculateScore = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!coverLetter) {
            toast.error('Please write a cover letter first to calculate your match score.');
            return;
        }

        setIsCalculatingScore(true);
        setMatchScore(null);
        setMatchFeedback('');
        
        try {
            // We need a brief representation of the user. Ideally from a DB, but we will mock briefly if not available.
            const { data: profile } = await supabase.from('profiles').select('skills, domain, college').eq('id', userId).maybeSingle();
            const profileStr = profile ? `Domain: ${profile.domain}, Skills: ${profile.skills?.join(', ')}, College: ${profile.college}` : 'Standard Student Profile';
            
            const result = await calculateMatchScore(
                profileStr,
                coverLetter,
                project.title || 'Role',
                project.category || 'Category',
                project.tags?.join(', ') || ''
            );
            
            setMatchScore(result.score);
            setMatchFeedback(result.feedback);
        } catch (err: any) {
            toast.error('Could not calculate AI Match Score at this time.');
        } finally {
            setIsCalculatingScore(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-brand-500/10 border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                            Apply to {project.company}
                        </h2>
                        <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mt-0.5">
                            {project.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Form */}
                <form noValidate onSubmit={handleSubmit}>
                    <div className="p-6 max-h-[70vh] overflow-y-auto hide-scrollbar space-y-6">

                        <div className="bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-brand-800 dark:text-brand-200">
                                This is a <span className="font-bold">{project.duration}</span> project matching <span className="font-bold">{project.type}</span> work type.
                                Make sure your availability aligns before submitting.
                            </p>
                        </div>

                        <ProfanityWarningModal error={error} onClose={() => setError('')} />
                        {error && (
                            <div className={`bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl items-start gap-3 text-sm animate-in fade-in zoom-in duration-300 ${(error.toLowerCase().includes('inappropriate') || error.toLowerCase().includes('professional')) ? 'hidden md:flex' : 'flex'}`}>
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Why should we hire you? <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                Highlight your matching skills ({project.tags?.join(', ') || 'required skills'}) and any related past projects.
                            </p>
                            <textarea
                                required
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                rows={5}
                                className="block w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                                placeholder={`I'm a great fit for the ${project.title} role because...`}
                            />
                            
                            {/* AI Match Score Feature */}
                            <div className="mt-3">
                                {!matchScore && !isCalculatingScore && (
                                    <button
                                        type="button"
                                        onClick={handleCalculateScore}
                                        disabled={!coverLetter}
                                        className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Calculate AI Match Score
                                    </button>
                                )}
                                
                                {isCalculatingScore && (
                                    <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                        Analyzing fit...
                                    </div>
                                )}

                                {matchScore !== null && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                        matchScore >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                                        matchScore >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                                    }`}>
                                                        {matchScore}% Match
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-medium">AI Feedback Helper</span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                                                    {matchFeedback}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCalculateScore}
                                                className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline shrink-0 ml-3"
                                            >
                                                Recalculate
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Resume Link / Portfolio <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LinkIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="url"
                                    value={portfolioUrl}
                                    onChange={(e) => setPortfolioUrl(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                    placeholder="https://github.com/yourusername"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Confirm Availability <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={availability}
                                onChange={(e) => setAvailability(e.target.value)}
                                className="block w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none"
                            >
                                <option value="" disabled>Select your availability</option>
                                <option value="immediate">Immediately available for {project.duration}</option>
                                <option value="notice_2_weeks">Available in 2 weeks</option>
                                <option value="notice_1_month">Available in 1 month</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-[2rem]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !coverLetter || !availability}
                            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" /> Submit Application
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
