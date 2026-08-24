import { useState, useEffect } from 'react';
import { X, Briefcase, MapPin, Clock, Users, FileText, Download, CheckSquare, Square, GitCompare, ChevronRight } from 'lucide-react';
import type { StudentProfile } from './StudentProfileCard';
import ApplicantReviewView from './ApplicantReviewView';
import WorkingCandidateView from './WorkingCandidateView';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

interface ProjectDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    onArchive?: (projectId: string) => void;
    onAcceptCandidate?: (projectId: string, candidateId: string) => void;
    onDeclineCandidate?: (projectId: string, candidateId: string) => void;
    onMessageWorkingCandidate?: (projectId: string, candidateId: string) => void;
    onSendLetter?: (projectId: string, candidateId: string, type: 'joining' | 'completion', content: string) => void;
    onCompleteProject?: (projectId: string, candidateId: string) => void;
    onRevertCandidate?: (projectId: string, candidateId: string) => void;
    onUpdateCandidateStage?: (projectId: string, candidateId: string, stage: string) => void;
    initialTab?: 'details' | 'applicants' | 'archived' | 'working';
}

const ProjectDashboard = ({ isOpen, onClose, project, onArchive, onAcceptCandidate, onDeclineCandidate, onMessageWorkingCandidate, onSendLetter, onCompleteProject, onRevertCandidate, onUpdateCandidateStage, initialTab = 'details' }: ProjectDashboardProps) => {
    const [activeTab, setActiveTab] = useState<'details' | 'applicants' | 'archived' | 'working'>(initialTab);
    const [reviewingCandidate, setReviewingCandidate] = useState<StudentProfile | null>(null);
    const [reviewingWorkingCandidate, setReviewingWorkingCandidate] = useState<StudentProfile | null>(null);
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

    const toggleCompare = (id: string) => {
        setCompareIds(prev =>
            prev.includes(id)
                ? prev.filter(c => c !== id)
                : prev.length < 3 ? [...prev, id] : prev
        );
    };

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    const resetViews = () => {
        setReviewingCandidate(null);
        setReviewingWorkingCandidate(null);
        setCompareIds([]);
        setShowCompareModal(false);
    };
    // Determine current list based on activeTab
    // Safe access using optional chaining for when project is null
    const currentCandidates = activeTab === 'applicants' 
        ? (project?.appliedCandidates || []) 
        : activeTab === 'working' 
            ? (project?.workingCandidates || []) 
            : (project?.archivedCandidates || []);

    const navigateCandidate = (direction: 'next' | 'prev') => {
        if (!reviewingCandidate) return;
        
        const currentIndex = currentCandidates.findIndex((c: any) => c.id === reviewingCandidate.id);
        if (currentIndex === -1) return;
        
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        if (newIndex < 0) newIndex = currentCandidates.length - 1;
        if (newIndex >= currentCandidates.length) newIndex = 0;
        
        setReviewingCandidate(currentCandidates[newIndex]);
    };

    useKeyboardShortcut('ArrowRight', () => navigateCandidate('next'), { enabled: !!reviewingCandidate });
    useKeyboardShortcut('ArrowLeft', () => navigateCandidate('prev'), { enabled: !!reviewingCandidate });

    if (!isOpen || !project) return null;

    const renderCandidateList = (candidates: StudentProfile[], emptyMessage: string, isWorkingList: boolean = false) => {
        if (!candidates || candidates.length === 0) {
            return (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Users className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">{emptyMessage}</h3>
                </div>
            );
        }

        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm font-sans">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-4 py-4 w-10"><span className="sr-only">Compare</span></th>
                                <th scope="col" className="px-6 py-4">Candidate</th>
                                <th scope="col" className="px-6 py-4">College</th>
                                <th scope="col" className="px-6 py-4">Domain</th>
                                <th scope="col" className="px-6 py-4 text-center">Completed</th>
                                <th scope="col" className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {candidates.map((candidate: any) => (
                                <tr
                                    key={candidate.id}
                                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                                        compareIds.includes(candidate.id) ? 'bg-brand-50/60 dark:bg-brand-900/10' : ''
                                    }`}
                                >
                                    {/* Compare checkbox */}
                                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => toggleCompare(candidate.id)}
                                            className={`p-1 rounded transition-colors ${
                                                compareIds.includes(candidate.id)
                                                    ? 'text-brand-600 dark:text-brand-400'
                                                    : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                                            }`}
                                            title={compareIds.includes(candidate.id) ? 'Remove from comparison' : compareIds.length >= 3 ? 'Max 3 candidates' : 'Add to comparison'}
                                        >
                                            {compareIds.includes(candidate.id)
                                                ? <CheckSquare className="w-4 h-4" />
                                                : <Square className="w-4 h-4" />
                                            }
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => isWorkingList ? setReviewingWorkingCandidate(candidate) : setReviewingCandidate(candidate)}>
                                        <div className="flex items-center gap-3">
                                            {candidate.photoUrl ? (
                                                <img src={candidate.photoUrl} alt={candidate.name} className="w-9 h-9 rounded-full object-cover bg-slate-100" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center">
                                                    {candidate.name.charAt(0)}
                                                </div>
                                            )}
                                            <span className="font-semibold text-slate-900 dark:text-white">{candidate.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 cursor-pointer" onClick={() => isWorkingList ? setReviewingWorkingCandidate(candidate) : setReviewingCandidate(candidate)}>
                                        {candidate.college}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-brand-600 dark:text-brand-400 font-medium cursor-pointer" onClick={() => isWorkingList ? setReviewingWorkingCandidate(candidate) : setReviewingCandidate(candidate)}>
                                        {candidate.domain}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-slate-700 dark:text-slate-300 font-bold cursor-pointer" onClick={() => isWorkingList ? setReviewingWorkingCandidate(candidate) : setReviewingCandidate(candidate)}>
                                        {candidate.completedProjects} Projects
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center cursor-pointer" onClick={() => isWorkingList ? setReviewingWorkingCandidate(candidate) : setReviewingCandidate(candidate)}>
                                        {candidate.applicationStatus === 'accepted' ? (
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold px-2 py-1 rounded-md text-[10px] uppercase tracking-wider">Accepted</span>
                                        ) : candidate.applicationStatus === 'rejected' ? (
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold px-2 py-1 rounded-md text-[10px] uppercase tracking-wider">Rejected</span>
                                        ) : (
                                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold px-2 py-1 rounded-md text-[10px] uppercase tracking-wider">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    /* ============================================================
       COMPARISON MODAL — side-by-side view of up to 3 candidates
       ============================================================ */
    const renderCompareModal = () => {
        const allCandidates = [
            ...(project.appliedCandidates || []),
            ...(project.workingCandidates || []),
            ...(project.archivedCandidates || []),
        ];
        const selected = allCandidates.filter((c: any) => compareIds.includes(c.id));
        if (!showCompareModal || selected.length < 2) return null;

        return (
            <div
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
                onClick={() => setShowCompareModal(false)}
            >
                <div
                    className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <GitCompare className="w-5 h-5 text-brand-600" />
                            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white">Candidate Comparison</h2>
                            <span className="text-xs font-semibold text-slate-500">{selected.length} candidates selected</span>
                        </div>
                        <button onClick={() => setShowCompareModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className={`grid grid-cols-${selected.length} gap-0 divide-x divide-slate-200 dark:divide-slate-800`}>
                        {selected.map((c: any) => (
                            <div key={c.id} className="p-6 space-y-5">
                                {/* Header */}
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xl font-black flex items-center justify-center">
                                        {c.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white font-heading">{c.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.college}</p>
                                    </div>
                                </div>
                                {/* Key metrics */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <span className="text-slate-500 font-medium">Domain</span>
                                        <span className="text-brand-600 dark:text-brand-400 font-semibold">{c.domain}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <span className="text-slate-500 font-medium">Projects Done</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{c.completedProjects}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <span className="text-slate-500 font-medium">AI Match</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{c.aiMatchScore ?? '—'}%</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <span className="text-slate-500 font-medium">Status</span>
                                        <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{c.applicationStatus ?? 'pending'}</span>
                                    </div>
                                </div>
                                {/* Skills */}
                                {c.skills && c.skills.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {c.skills.slice(0, 6).map((s: string) => (
                                                <span key={s} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => {
                onClose();
                setReviewingCandidate(null);
            }}
        >
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl relative overflow-hidden mt-10 mb-10 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Banner */}
                <div className="bg-slate-50 dark:bg-slate-800/80 px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start shrink-0 relative">
                    <div className="w-full pr-12 sm:pr-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                            {project.status === 'completed' ? (
                                <span className="w-fit bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                    Completed
                                </span>
                            ) : (
                                <span className="w-fit bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                                    Active Status
                                </span>
                            )}
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Posted {new Date(project.postedAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mb-2 leading-tight">
                                    {project.role}
                                </h2>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-brand-500" /> {project.domain}</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-purple-500" /> {project.tenure} Months</span>
                                </div>
                            </div>

                            {/* Archive Project Button */}
                            {project.status !== 'completed' && onArchive && (
                                <div className="relative mt-2 sm:mt-0 shrink-0">
                                    <button
                                        onClick={() => onArchive(project.id)}
                                        className="text-sm font-medium px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                                    >
                                        Archive Project
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            onClose();
                            setReviewingCandidate(null);
                        }}
                        className="absolute top-4 sm:top-6 right-4 sm:right-8 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 p-2 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-8 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <nav className="-mb-px flex space-x-6 md:space-x-8 overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => { setActiveTab('details'); resetViews(); }}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
                                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            Project Details
                        </button>
                        <button
                            onClick={() => { setActiveTab('applicants'); resetViews(); }}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'applicants'
                                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            Applicants
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-0.5 px-2 rounded-full text-xs">
                                {project.appliedCandidates?.length || 0}
                            </span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('working'); resetViews(); }}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'working'
                                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            Currently Working
                            <span className="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 py-0.5 px-2 rounded-full text-xs">
                                {project.workingCandidates?.length || 0}
                            </span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('archived'); resetViews(); }}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'archived'
                                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                        >
                            Archived Candidates
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-0.5 px-2 rounded-full text-xs">
                                {project.archivedCandidates?.length || 0}
                            </span>
                        </button>
                    </nav>
                </div>

                {/* Scrollable Content Area */}
                <div className="px-8 py-6 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0a0f1d]/50">
                    {reviewingCandidate ? (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <button
                                onClick={() => setReviewingCandidate(null)}
                                className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors"
                            >
                                ← Back to list
                            </button>
                            <ApplicantReviewView
                                candidate={reviewingCandidate}
                                onClose={() => setReviewingCandidate(null)}
                                onAccept={(id) => {
                                    if (onAcceptCandidate) onAcceptCandidate(project.id, id);
                                    setReviewingCandidate(null);
                                }}
                                onDecline={(id) => {
                                    if (onDeclineCandidate) onDeclineCandidate(project.id, id);
                                    setReviewingCandidate(null);
                                }}
                                isArchived={activeTab === 'archived'}
                                onRevert={(id) => {
                                    if (onRevertCandidate) onRevertCandidate(project.id, id);
                                    setReviewingCandidate(null);
                                }}
                                onUpdateStage={(id, stage) => {
                                    if (onUpdateCandidateStage) onUpdateCandidateStage(project.id, id, stage);
                                    setReviewingCandidate(null);
                                }}
                            />
                        </div>
                    ) : reviewingWorkingCandidate ? (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <button
                                onClick={() => setReviewingWorkingCandidate(null)}
                                className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors"
                            >
                                ← Back to Currently Working
                            </button>
                            <WorkingCandidateView
                                candidate={reviewingWorkingCandidate}
                                onClose={() => setReviewingWorkingCandidate(null)}
                                onMessage={(id) => {
                                    if (onMessageWorkingCandidate) onMessageWorkingCandidate(project.id, id);
                                }}
                                onSendLetter={(id, type, content) => {
                                    if (onSendLetter) onSendLetter(project.id, id, type, content);
                                }}
                                onCompleteProject={(id) => {
                                    if (onCompleteProject) onCompleteProject(project.id, id);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300 h-full">
                            {activeTab === 'details' && (
                                <div className="space-y-8">
                                    {/* Key Info Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
                                            <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Domain</div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white truncate" title={project.domain}>{project.domain}</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
                                            <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Duration</div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{project.tenure} Months</div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
                                            <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">Stipend</div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                {project.remuneration === '0' || project.remuneration === 0 ? 'Unpaid' : `₹${project.remuneration}`}
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
                                            <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Openings</div>
                                            <div className="font-bold text-sm text-brand-600 dark:text-brand-400 truncate">{project.positions || 1}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-brand-500" /> Objective
                                        </h3>
                                        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
                                            {project.objective}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Candidate Expectations</h3>
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl whitespace-pre-line text-slate-600 dark:text-slate-300 leading-relaxed shadow-sm">
                                            {project.expectations}
                                        </div>
                                    </div>

                                    {project.attachmentName && (
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Attachments</h3>
                                            <div className="flex items-center justify-between p-5 bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-900/40 rounded-xl max-w-md">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-brand-500">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">{project.attachmentName}</p>
                                                        <p className="text-xs text-slate-500 font-medium">Job Description Document</p>
                                                    </div>
                                                </div>
                                                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-brand-600 dark:text-brand-400 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm btn-interactive">
                                                    <Download className="w-4 h-4" /> Download
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'applicants' && (
                                renderCandidateList(project.appliedCandidates, "No pending applicants at the moment.")
                            )}

                            {activeTab === 'working' && (
                                renderCandidateList(project.workingCandidates, "No candidates are currently working on this project.", true)
                            )}

                            {activeTab === 'archived' && (
                                renderCandidateList(project.archivedCandidates, "No archived candidates.")
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Comparison Tray — appears when 2+ candidates are selected */}
            {compareIds.length >= 2 && !showCompareModal && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[55] animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex items-center gap-4 bg-slate-900 dark:bg-slate-800 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700">
                        <GitCompare className="w-4 h-4 text-brand-400 shrink-0" />
                        <span className="text-sm font-semibold">{compareIds.length} candidates selected</span>
                        <button
                            onClick={() => setShowCompareModal(true)}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-colors"
                        >
                            Compare Side-by-Side <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setCompareIds([])}
                            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Comparison Modal */}
            {renderCompareModal()}
        </div>
    );
};

export default ProjectDashboard;
