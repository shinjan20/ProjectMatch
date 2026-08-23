import { useState, useEffect } from 'react';
import { X, Briefcase, MapPin, Clock, Users, FileText, Download } from 'lucide-react';
import type { StudentProfile } from './StudentProfileCard';
import ApplicantReviewView from './ApplicantReviewView';
import WorkingCandidateView from './WorkingCandidateView';

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
    initialTab?: 'details' | 'applicants' | 'archived' | 'working';
}

const ProjectDashboard = ({ isOpen, onClose, project, onArchive, onAcceptCandidate, onDeclineCandidate, onMessageWorkingCandidate, onSendLetter, onCompleteProject, onRevertCandidate, initialTab = 'details' }: ProjectDashboardProps) => {
    const [activeTab, setActiveTab] = useState<'details' | 'applicants' | 'archived' | 'working'>(initialTab);
    const [reviewingCandidate, setReviewingCandidate] = useState<StudentProfile | null>(null);
    const [reviewingWorkingCandidate, setReviewingWorkingCandidate] = useState<StudentProfile | null>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    const resetViews = () => {
        setReviewingCandidate(null);
        setReviewingWorkingCandidate(null);
    };

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
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-855/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <tr>
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
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                                    onClick={() => {
                                        if (isWorkingList) {
                                            setReviewingWorkingCandidate(candidate);
                                        } else {
                                            setReviewingCandidate(candidate);
                                        }
                                    }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
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
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                        {candidate.college}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-brand-600 dark:text-brand-400 font-medium">
                                        {candidate.domain}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-slate-700 dark:text-slate-300 font-bold">
                                        {candidate.completedProjects} Projects
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {candidate.applicationStatus === 'accepted' ? (
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold px-2 py-1 rounded-md text-[10px] uppercase tracking-wider">
                                                Accepted
                                            </span>
                                        ) : candidate.applicationStatus === 'rejected' ? (
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold px-2 py-1 rounded-md text-[10px] uppercase tracking-wider">
                                                Rejected
                                            </span>
                                        ) : (
                                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold px-2 py-1 rounded-md text-[10px] uppercase tracking-wider">
                                                Pending
                                            </span>
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
        </div>
    );
};

export default ProjectDashboard;
