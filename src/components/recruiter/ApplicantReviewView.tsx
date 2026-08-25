import { useState } from 'react';
import { X, FileText, User, Github, Linkedin, GraduationCap, ChevronLeft, ChevronRight, AlertTriangle, SquareTerminal } from 'lucide-react';
import type { StudentProfile } from './StudentProfileCard';
import { useAIContext } from '../../contexts/AIContext';

interface ApplicantReviewViewProps {
    candidate: StudentProfile;
    onClose: () => void;
    onAccept: (candidateId: string) => void;
    onDecline: (candidateId: string) => void;
    isArchived?: boolean;
    onRevert?: (candidateId: string) => void;
    onUpdateStage?: (candidateId: string, stage: string) => void;
    onNext?: () => void;
    onPrev?: () => void;
}

const ApplicantReviewView = ({ candidate, onClose, onAccept, onDecline, isArchived: _isArchived = false, onRevert: _onRevert, onUpdateStage, onNext, onPrev }: ApplicantReviewViewProps) => {
    const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
    const { openAssistant } = useAIContext();

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-stretch md:justify-end bg-slate-900/40 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none" onClick={onClose}>
            {/* Desktop Backdrop overlay */}
            <div className="fixed inset-0 bg-transparent md:bg-slate-900/20 md:backdrop-blur-sm -z-10 hidden md:block" onClick={onClose} />
            
            <div 
                className="w-full md:w-[600px] lg:w-[700px] max-h-[95vh] md:max-h-none h-auto md:h-full bg-slate-50 dark:bg-slate-900 rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom-full md:slide-in-from-right duration-300 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Mobile drag handle */}
                <div className="w-full flex md:hidden justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 md:bg-transparent rounded-t-3xl md:rounded-none">
                <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-brand-500 hidden sm:block" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Reviewing Applicant</h3>
                </div>
                <div className="flex items-center gap-1">
                    {onPrev && (
                        <button onClick={onPrev} className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    {onNext && (
                        <button onClick={onNext} className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-8">
                    {/* Candidate Details */}
                    <div className="w-full">
                        <div className="flex flex-col items-center text-center">
                            {candidate.photoUrl ? (
                                <img
                                    src={candidate.photoUrl}
                                    alt={candidate.name}
                                    className="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-slate-100 dark:border-slate-800 mb-4"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 font-bold text-3xl">
                                    {candidate.name.charAt(0)}
                                </div>
                            )}
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{candidate.name}</h2>
                            <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-1">{candidate.domain}</p>
                            <p className="text-sm text-slate-500 flex items-center justify-center gap-1">
                                <GraduationCap className="w-4 h-4" /> {candidate.college}
                            </p>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Links &amp; Docs</h4>
                            <ul className="space-y-3">
                                {(candidate as any).portfolioUrl ? (
                                    <li>
                                        <a
                                            href={(candidate as any).portfolioUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                                        >
                                            <FileText className="w-4 h-4 shrink-0" />
                                            {(candidate as any).portfolioUrl.replace(/^https?:\/\//, '')}
                                        </a>
                                    </li>
                                ) : (
                                    <li className="text-sm text-slate-400 italic">No portfolio link submitted.</li>
                                )}
                                {(candidate as any).linkedinUrl && (
                                    <li>
                                        <a href={(candidate as any).linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                            <Linkedin className="w-4 h-4" /> LinkedIn Profile
                                        </a>
                                    </li>
                                )}
                                {(candidate as any).githubUrl && (
                                    <li>
                                        <a href={(candidate as any).githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                            <Github className="w-4 h-4" /> GitHub Profile
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Application Info / Cover Letter */}
                    <div className="w-full border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Cover Letter</h4>
                                <button
                                    onClick={() => openAssistant({ entity: 'candidate_review', data: { candidateName: candidate.name, candidateId: candidate.id } })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-400 text-xs font-bold rounded-lg transition-colors border border-brand-200 dark:border-brand-800"
                                >
                                    <SquareTerminal className="w-3.5 h-3.5" /> AI Review
                                </button>
                            </div>
                            <div className="prose-reading bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 max-w-none shadow-sm whitespace-pre-line mb-6 text-slate-700 dark:text-slate-300">
                                {(candidate as any).coverLetter
                                    ? (candidate as any).coverLetter
                                    : <span className="italic text-slate-400">No cover letter was submitted with this application.</span>
                                }
                            </div>
                            {(candidate as any).availability && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Availability</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">
                                        {(candidate as any).availability === 'immediate' ? 'Immediately Available' :
                                         (candidate as any).availability === 'notice_2_weeks' ? 'Available in 2 Weeks' :
                                         (candidate as any).availability === 'notice_1_month' ? 'Available in 1 Month' :
                                         (candidate as any).availability}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pipeline Stage Select Panel */}
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Recruitment Funnel Stage</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { status: 'pending', label: 'New', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' },
                                    { status: 'reviewing', label: 'Reviewing', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
                                    { status: 'shortlisted', label: 'Shortlisted', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
                                    { status: 'interview', label: 'Interview', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
                                    { status: 'final_review', label: 'Final Review', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
                                    { status: 'accepted', label: 'Hired', color: 'bg-green-600 text-white border-green-600' },
                                    { status: 'rejected', label: 'Declined', color: 'bg-red-655 text-white border-red-655' }
                                ].map(item => {
                                    const currentStatus = (candidate as any).applicationStatus || 'pending';
                                    const isCurrent = currentStatus === item.status;
                                    
                                    if (item.status === 'rejected' && showDeclineConfirm) {
                                        return (
                                            <div key="confirm-reject" className="col-span-full flex items-center justify-between p-2 mt-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold px-2">
                                                    <AlertTriangle className="w-4 h-4" /> Sure you want to decline?
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => setShowDeclineConfirm(false)}
                                                        className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setShowDeclineConfirm(false);
                                                            if (onUpdateStage) onUpdateStage(candidate.id, 'rejected');
                                                            else onDecline(candidate.id);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                                    >
                                                        Yes, Decline
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={item.status}
                                            onClick={() => {
                                                if (item.status === 'rejected') {
                                                    setShowDeclineConfirm(true);
                                                    return;
                                                }
                                                if (onUpdateStage) {
                                                    onUpdateStage(candidate.id, item.status);
                                                } else {
                                                    if (item.status === 'accepted') onAccept(candidate.id);
                                                }
                                            }}
                                            className={`px-3 py-2 border rounded-xl text-xs font-bold text-center transition-all ${
                                                isCurrent 
                                                    ? `${item.color} shadow-sm ring-2 ring-brand-500/20`
                                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                                            } ${showDeclineConfirm ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default ApplicantReviewView;
