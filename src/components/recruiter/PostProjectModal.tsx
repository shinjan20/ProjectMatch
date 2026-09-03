import { useState, useEffect, useRef } from 'react';
import { X, FileText, CheckCircle2, Briefcase, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DOMAINS } from '../../constants';
import { checkFormForProfanityAsync } from '../../utils/profanityFilter';
import ProfanityWarningModal from '../ProfanityWarningModal';
import { useAuth } from '../../contexts/AuthContext';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

export interface ProjectFormData {
    id?: string;
    role: string;
    domain: string;
    objective: string;
    expectations: string;
    positions: string | number;
    tenure: string | number;
    remuneration: string | number;
    attachmentName?: string;
    [key: string]: any;
}

interface PostProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (projectData: ProjectFormData) => Promise<void> | void;
    editingProject?: ProjectFormData | null;
}

const PostProjectModal = ({ isOpen, onClose, onSubmit, editingProject }: PostProjectModalProps) => {
    // Add escape to close shortcut
    useKeyboardShortcut('Escape', onClose, { enabled: isOpen });

    const [formData, setFormData] = useState({
        role: '',
        domain: '',
        customDomain: '',
        objective: '',
        expectations: '',
        tenure: '',
        remuneration: '0',
        positions: '1',
        attachmentName: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    const { userId } = useAuth();
    
    const draftKey = `project_draft_${userId}`;

    // Auto-save draft whenever formData changes (only for new projects)
    useEffect(() => {
        const hasContent = Object.values(formData).some(val => val && val !== '0' && val !== '1');
        if (!editingProject && isOpen && hasContent) {
            const timeoutId = setTimeout(() => {
                localStorage.setItem(draftKey, JSON.stringify(formData));
            }, 500); // Debounce to avoid excessive writes
            return () => clearTimeout(timeoutId);
        }
    }, [formData, editingProject, isOpen, draftKey]);

    useEffect(() => {
        if (error && modalRef.current) {
            // Target the fixed inset-0 wrapper which handles the overflow-y-auto scrolling
            modalRef.current.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [error]);

    useEffect(() => {
        if (editingProject && isOpen) {
            const isStandardDomain = DOMAINS.includes(editingProject.domain);
            setFormData({
                role: editingProject.role || '',
                domain: isStandardDomain ? editingProject.domain : 'Other',
                customDomain: isStandardDomain ? '' : (editingProject.domain || ''),
                objective: editingProject.objective || '',
                expectations: editingProject.expectations || '',
                tenure: editingProject.tenure ? String(editingProject.tenure) : '',
                remuneration: editingProject.remuneration !== undefined ? String(editingProject.remuneration) : '0',
                positions: editingProject.positions ? String(editingProject.positions) : '1',
                attachmentName: editingProject.attachmentName || ''
            });
        } else if (isOpen && !editingProject) {
            // Check for existing draft
            try {
                const savedDraft = localStorage.getItem(draftKey);
                if (savedDraft) {
                    const parsedDraft = JSON.parse(savedDraft);
                    setFormData(parsedDraft);
                }
            } catch (e) {
                console.error("Failed to load draft");
            }
        } else if (!isOpen) {
            setFormData({ role: '', domain: '', customDomain: '', objective: '', expectations: '', tenure: '', remuneration: '0', positions: '1', attachmentName: '' });
            setIsSuccess(false);
            setError('');
            setCurrentStep(1);
        }
    }, [editingProject, isOpen]);



    if (!isOpen) return null;


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setError(''); // Clear error on change

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData(prev => ({ ...prev, attachmentName: e.target.files![0].name }));
        }
    };

    const handleNext = () => {
        setError('');
        if (currentStep === 1) {
            const finalDomain = formData.domain === 'Other' ? formData.customDomain : formData.domain;
            if (!formData.role || !finalDomain || !formData.objective) {
                setError('Please fill in all required fields for this step.');
                return;
            }
        } else if (currentStep === 2) {
            if (!formData.positions || !formData.tenure || !formData.remuneration) {
                setError('Please fill in all required fields for this step.');
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setError('');
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.expectations) {
            setError('Please fill in all required fields.');
            return;
        }

        const finalDomain = formData.domain === 'Other' ? formData.customDomain : formData.domain;

        // Profanity Check
        setIsSubmitting(true);
        const profanityField = await checkFormForProfanityAsync({
            role: formData.role,
            domain: finalDomain,
            objective: formData.objective,
            expectations: formData.expectations
        });

        if (profanityField) {
            setError('Please use professional language. Unprofessional or inappropriate terms are strictly prohibited.');
            setIsSubmitting(false);
            return;
        }

        try {
            const submitData = { ...formData, domain: finalDomain };
            await onSubmit(submitData);
            setIsSuccess(true);
            
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
            });
            // Clear draft on successful submission
            if (!editingProject) {
                localStorage.removeItem(draftKey);
            }

            // Immediately clear the form to avoid the auto-save catching the old data before modal closes
            setFormData({ role: '', domain: '', customDomain: '', objective: '', expectations: '', tenure: '', remuneration: '0', positions: '1', attachmentName: '' });

            setTimeout(() => {
                setIsSuccess(false);
                setError('');
                onClose();
            }, 2500);
        } catch (err: unknown) {
            console.error("Project submission error:", err);
            setError(err instanceof Error ? err.message : 'Failed to save project.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-xl overflow-y-auto">
            <div ref={modalRef} className="w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden mt-10 mb-10 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 relative bg-white dark:bg-slate-900">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/60 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-500/10 p-2.5 rounded-xl text-brand-400">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                            {editingProject ? 'Edit Live Project' : 'Post New Live Project'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <ProfanityWarningModal error={error} onClose={() => setError('')} />
                {error && (
                    <div className={`mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg items-start gap-3 animate-in fade-in zoom-in-95 duration-200 relative z-20 ${(error.toLowerCase().includes('inappropriate') || error.toLowerCase().includes('professional')) ? 'hidden md:flex' : 'flex'}`}>
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                            {error}
                        </p>
                    </div>
                )}

                {isSuccess ? (
                    <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            {editingProject ? 'Project Updated Successfully!' : 'Project Posted Successfully!'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {editingProject ? 'The changes to your project are now live.' : 'Your live project is now active and visible to students.'}
                        </p>
                    </div>
                ) : (
                    <form noValidate onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()} className="p-5 md:p-6 space-y-4 relative z-10">
                        {/* Progress Indicator */}
                        <div className="mb-6 flex items-center justify-between relative px-2">
                            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-brand-500 rounded-full z-0 transition-all duration-500" style={{ width: `calc(${((currentStep - 1) / 2) * 100}% - ${currentStep === 1 ? 0 : 24}px)` }}></div>
                            
                            {[1, 2, 3].map(step => (
                                <div key={step} className={`relative z-10 flex flex-col items-center gap-2`}>
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-colors duration-500 ${currentStep >= step ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                        {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                                    </div>
                                    <span className={`absolute top-10 text-[10px] font-bold uppercase tracking-widest ${currentStep >= step ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                        {step === 1 ? 'Basics' : step === 2 ? 'Details' : 'Review'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="h-6"></div> {/* Spacer for the absolute positioned labels */}

                        {currentStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                    Role Title <span className="text-brand-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="role"
                                    required
                                    value={formData.role}
                                    onChange={handleChange}
                                    placeholder="e.g. Frontend Developer Intern"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700/60 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white dark:focus:bg-[#030712] transition-all input-interactive"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                    Domain <span className="text-brand-500">*</span>
                                </label>
                                <select
                                    name="domain"
                                    required
                                    value={formData.domain}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700/60 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white dark:focus:bg-[#030712] transition-all input-interactive appearance-none"
                                >
                                    <option value="" disabled>Select Domain</option>
                                    {DOMAINS.map((domain) => (
                                        <option key={domain} value={domain}>{domain}</option>
                                    ))}
                                    <option value="Other">Other (Specify below)</option>
                                </select>
                            </div>
                        </div>

                        {formData.domain === 'Other' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                    Custom Domain <span className="text-brand-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="customDomain"
                                    required
                                    value={formData.customDomain}
                                    onChange={handleChange}
                                    placeholder="e.g. Artificial Intelligence"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700/60 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white dark:focus:bg-[#030712] transition-all input-interactive"
                                />
                            </div>
                        )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                    Brief Objective <span className="text-brand-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="objective"
                                    required
                                    value={formData.objective}
                                    onChange={handleChange}
                                    placeholder="What is the main goal of this project?"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700/60 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white dark:focus:bg-[#030712] transition-all input-interactive"
                                />
                            </div>
                        </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                            Positions to Fill <span className="text-brand-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="positions"
                                            min="1"
                                            required
                                            value={formData.positions}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700/60 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white dark:focus:bg-[#030712] transition-all input-interactive"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                            Tenure (in Months) <span className="text-brand-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="tenure"
                                            min="1"
                                            required
                                            value={formData.tenure}
                                            onChange={handleChange}
                                            placeholder="e.g. 3"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700/60 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white dark:focus:bg-[#030712] transition-all input-interactive"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                            Remuneration <span className="text-brand-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="remuneration"
                                            min="0"
                                            required
                                            value={formData.remuneration}
                                            onChange={handleChange}
                                            placeholder="e.g. 20000 or 0 for Unpaid"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700/60 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white dark:focus:bg-[#030712] transition-all input-interactive"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                                        Expectations from Candidates <span className="text-brand-500">*</span>
                                    </label>
                                    <textarea
                                        name="expectations"
                                        required
                                        rows={2}
                                        value={formData.expectations}
                                        onChange={handleChange}
                                        placeholder="Describe the skills required and what the candidate will be doing..."
                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700/60 rounded-xl bg-white/50 dark:bg-[#0f172a]/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white dark:focus:bg-[#030712] transition-all resize-none input-interactive"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Job Description (Optional Attachment)
                                    </label>

                                    {formData.attachmentName ? (
                                        <div className="mt-1 flex items-center justify-between px-4 py-3 border border-brand-200 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-900/10 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-6 h-6 text-brand-500" />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white text-xs">{formData.attachmentName}</p>
                                                    <p className="text-[10px] text-slate-500">Document attached</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, attachmentName: '' }))}
                                                className="text-slate-400 hover:text-red-500 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex justify-center px-4 pt-4 pb-4 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:border-brand-500 dark:hover:border-brand-400 transition-colors bg-slate-50 dark:bg-slate-900/50 cursor-pointer relative">
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                accept=".pdf,.doc,.docx"
                                            />
                                            <div className="space-y-1 text-center pointer-events-none">
                                                <FileText className="mx-auto h-8 w-8 text-slate-400" />
                                                <div className="flex text-xs text-slate-600 dark:text-slate-400 justify-center">
                                                    <span className="font-medium text-brand-600 dark:text-brand-400">Upload a file</span>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-slate-500">PDF, DOCX up to 10MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="pt-6 flex justify-between items-center gap-4 border-t border-slate-100 dark:border-slate-800">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 text-sm rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all btn-interactive"
                                >
                                    Back
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 text-sm rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all btn-interactive"
                                >
                                    Cancel
                                </button>
                            )}

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-8 py-2.5 text-sm border border-transparent rounded-xl shadow-lg shadow-brand-500/20 font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all hover:-translate-y-0.5 btn-interactive ml-auto"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 text-sm border border-transparent rounded-xl shadow-lg shadow-brand-500/20 font-bold text-white bg-brand-600 hover:bg-brand-500 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 btn-interactive ml-auto"
                                >
                                    {isSubmitting ? 'Processing...' : (editingProject ? 'Save Changes' : 'Post Project')}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PostProjectModal;
