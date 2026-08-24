import { X, Clock, Banknote, Calendar, Home as HomeIcon, MapPin, Tag, Users, ShieldAlert, Zap, Send } from 'lucide-react';
import { MOCK_PROJECTS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useInterviewStatus } from '../../hooks/useInterviewStatus';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

interface ProjectDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | number;
    project?: any;
    onApplyClicked: () => void;
}

const timeAgo = (dateInput?: string) => {
    if (!dateInput) return 'Recently';
    const seconds = Math.floor((new Date().getTime() - new Date(dateInput).getTime()) / 1000);
    // ... basic logic mapping
    const d = seconds / 86400;
    if (d > 1) return Math.floor(d) + ' days ago';
    return 'Recently';
};

export default function ProjectDetailsModal({ isOpen, onClose, projectId, project, onApplyClicked }: ProjectDetailsModalProps) {
    const { isAuthenticated, userRole } = useAuth();

    if (!isOpen) return null;

    // Support both string UUIDs and numeric IDs for backwards compatibility
    const numericId = typeof projectId === 'string' ? parseInt(projectId) : projectId;
    
    // Add escape to close shortcut
    useKeyboardShortcut('Escape', onClose, { enabled: isOpen });

    // Prefer the passed-in project data (from Supabase), fallback to MOCK_PROJECTS
    const projectData = project || MOCK_PROJECTS.find(p => p.id === numericId);
    if (!projectData) return null;

    const { interviewStatus } = useInterviewStatus();

    // Simulate metrics
    const applicantCount = Math.floor(Math.random() * 50) + 12;

    const handleApplyWithFeedback = () => {
        if (interviewStatus === 'closed') return;

        // Skip the fake delay and toast, just proceed directly to the application steps
        onApplyClicked();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-[#080d1a] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">

                {/* Header Section */}
                <div className="relative bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6 sm:p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center text-2xl font-black text-brand-600 dark:text-brand-400 border border-brand-500/30 shrink-0 shadow-inner">
                            {project.company.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <span className="inline-flex px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs font-bold tracking-widest uppercase mb-3 shadow-sm">
                                {project.category}
                            </span>
                            <h2 className="text-3xl font-black font-heading text-slate-900 dark:text-white mb-2 leading-tight">
                                {project.title}
                            </h2>
                            <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 flex items-center flex-wrap gap-4">
                                <span>{project.company}</span>
                                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                                <span className="flex items-center text-sm"><MapPin className="w-4 h-4 mr-1.5 opacity-70" /> {project.type} Work</span>
                                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                                <span className="flex items-center text-sm text-slate-500"><Calendar className="w-4 h-4 mr-1.5 opacity-70" /> Posted {timeAgo(project.postedAt)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto hide-scrollbar">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Description */}
                        <div className="lg:col-span-2 space-y-8">

                            <section>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                                    <Zap className="w-5 h-5 mr-2 text-brand-500" /> About the Project
                                </h3>
                                <div className="prose-reading">
                                    <p>
                                        We are looking for an enthusiastic individual to join our team for the <strong>{project.title}</strong> live project.
                                        You will be working directly with our core team to design, engineer, and iterate on actual product deliverables.
                                    </p>
                                    <p>
                                        This is a great chance to gain real-world experience, build your portfolio, and optionally transition into a full-time role depending on performance.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                                    <ShieldAlert className="w-5 h-5 mr-2 text-brand-500" /> Requirements & Skills
                                </h3>
                                <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
                                    <li>Available to dedicate 15-20 hours a week for the full duration of {project.duration}.</li>
                                    <li>Strong communication skills and ability to work autonomously.</li>
                                    <li>Proficient in the following core technologies:</li>
                                </ul>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {project.tags.map((tag: string) => (
                                        <span key={tag} className="flex items-center text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <Tag className="w-3.5 h-3.5 mr-1.5 opacity-50" /> {tag}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Overview */}
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase text-xs tracking-wider">Project Overview</h4>

                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <Banknote className="w-5 h-5 mr-3 text-emerald-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Stipend</p>
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {project.remuneration === '0' ? 'Unpaid' : `₹${project.remuneration}/month`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Clock className="w-5 h-5 mr-3 text-brand-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Duration</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{project.duration}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <HomeIcon className="w-5 h-5 mr-3 text-purple-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Location Config</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{project.type}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Users className="w-5 h-5 mr-3 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Positions</p>
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {project.totalPositions - project.hiredPositions} Openings Left
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-brand-50 dark:bg-brand-500/10 rounded-2xl p-5 border border-brand-100 dark:border-brand-500/20 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">Competition</p>
                                    <p className="font-bold text-slate-900 dark:text-white">{applicantCount} applicants</p>
                                </div>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-[#080d1a] flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                            {String.fromCharCode(64 + Math.floor(Math.random() * 26))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#040914] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 w-full sm:w-auto text-center sm:text-left">
                        Applications are reviewed on a rolling basis.
                    </p>

                    {userRole !== 'recruiter' && (
                        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>

                            {!isAuthenticated ? (
                                <button className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-transform" onClick={() => window.location.href = '/login?returnTo=/projects'}>
                                    Login to Apply
                                </button>
                            ) : (
                                <button
                                    onClick={handleApplyWithFeedback}
                                    disabled={interviewStatus === 'closed'}
                                    title={interviewStatus === 'closed' ? "Your profile is closed to projects." : ""}
                                    className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center min-w-[160px] gap-2 ${interviewStatus === 'closed'
                                        ? 'bg-brand-600/50 cursor-not-allowed opacity-50 grayscale blur-[1px]'
                                        : 'bg-brand-600 hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-500/20 active:scale-95'
                                        }`}
                                >
                                    <Send className="w-4 h-4" /> Apply Now
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
