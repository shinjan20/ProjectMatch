import { Mail, MessageSquare, FileText, X, CheckCircle, GraduationCap, Briefcase } from 'lucide-react';
import { useState } from 'react';
import type { StudentProfile } from './StudentProfileCard';
import AlertModal from '../AlertModal';
import { useAuth } from '../../contexts/AuthContext';

interface WorkingCandidateViewProps {
    candidate: StudentProfile;
    onClose: () => void;
    onMessage: (candidateId: string) => void;
    onSendLetter: (candidateId: string, letterType: 'joining' | 'completion', content: string) => void;
    onCompleteProject?: (candidateId: string) => void;
}

const WorkingCandidateView = ({ candidate, onMessage, onSendLetter, onCompleteProject }: WorkingCandidateViewProps) => {
    const { userName } = useAuth();
    const [letterModalOpen, setLetterModalOpen] = useState<'joining' | 'completion' | null>(null);
    const [letterContent, setLetterContent] = useState('');
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    const defaultJoiningLetter = `Dear ${candidate.name},\n\nWe are thrilled to officially welcome you to the team for this live project! We were very impressed with your background and believe your skills will be a great addition to our efforts.\n\nPlease find attached the necessary onboarding documents and your initial task assignments.\n\nBest regards,\n${userName}`;

    const defaultCompletionLetter = `Dear ${candidate.name},\n\nCongratulations on successfully completing the live project! We greatly appreciate the hard work, dedication, and valuable contributions you have made during your time with us.\n\nThis letter serves as an official confirmation of your project completion. We wish you the best in your future endeavors.\n\nBest regards,\n${userName}`;

    const openLetterModal = (type: 'joining' | 'completion') => {
        setLetterContent(type === 'joining' ? defaultJoiningLetter : defaultCompletionLetter);
        setLetterModalOpen(type);
    };

    const handleSend = () => {
        if (letterModalOpen && letterContent.trim()) {
            onSendLetter(candidate.id, letterModalOpen, letterContent);

            const isJoining = letterModalOpen === 'joining';
            setLetterModalOpen(null);
            setAlertConfig({
                isOpen: true,
                title: 'Letter Sent successfully',
                message: `${isJoining ? 'Joining' : 'Completion'} letter sent directly to their Messages!`,
                type: 'success'
            });
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in duration-300">
            {/* Header Area */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-6 sm:p-8 text-slate-900 dark:text-white relative border-b border-slate-200 dark:border-slate-700/80">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <CheckCircle className="w-48 h-48 text-slate-400" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    {candidate.photoUrl ? (
                        <img src={candidate.photoUrl} alt={candidate.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-750 shadow-sm bg-white shrink-0" />
                    ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm flex items-center justify-center font-bold text-3xl sm:text-4xl text-slate-700 dark:text-slate-300 shrink-0">
                            {candidate.name.charAt(0)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0 w-full pt-1 sm:pt-2">
                        <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 truncate text-slate-900 dark:text-white">{candidate.name}</h2>
                        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1.5 min-w-0"><Briefcase className="w-4 h-4 shrink-0 text-slate-400" /> <span className="truncate">{candidate.domain}</span></span>
                            <span className="flex items-center gap-1.5 min-w-0"><GraduationCap className="w-4 h-4 shrink-0 text-slate-400" /> <span className="truncate">{candidate.college}</span></span>
                        </div>
                        <div className="mt-4 flex flex-row items-center gap-2 sm:gap-3 w-full overflow-x-auto pb-1 no-scrollbar">
                            <span className="inline-flex items-center justify-center gap-1.5 bg-green-500/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border border-green-500/20 text-green-700 dark:text-green-400 whitespace-nowrap shrink-0">
                                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                                Currently Working
                            </span>
                            <button
                                onClick={() => {
                                    if (onCompleteProject) {
                                        onCompleteProject(candidate.id);
                                        openLetterModal('completion');
                                    }
                                }}
                                className="inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Complete Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons Hub */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => onMessage(candidate.id)}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 dark:hover:bg-brand-900/20 dark:hover:border-brand-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all group"
                >
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">Message Candidate</span>
                </button>
                <a
                    href={`mailto:dummy@example.com?subject=Regarding Live Project`}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all group"
                >
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform text-slate-700 dark:text-slate-300">
                        <Mail className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">Email Candidate</span>
                </a>

                <button
                    onClick={() => openLetterModal('joining')}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-5 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 hover:border-brand-300 dark:hover:bg-brand-900/40 border border-brand-200 dark:border-brand-800/50 rounded-2xl transition-all group text-brand-600 dark:text-brand-400"
                >
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">Send Joining Letter</span>
                </button>

                <button
                    onClick={() => openLetterModal('completion')}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-5 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 hover:border-purple-300 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/50 rounded-2xl transition-all group text-purple-600 dark:text-purple-400"
                >
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm">Send Completion Letter</span>
                </button>
            </div>

            {/* Sub-modal for Letters */}
            {letterModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setLetterModalOpen(null)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-brand-500" />
                                    {letterModalOpen === 'joining' ? 'Customize Joining Letter' : 'Customize Completion Letter'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">This will be sent directly to the candidate via ProjectMatch Messages.</p>
                            </div>
                            <button onClick={() => setLetterModalOpen(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-full shadow-sm transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            <textarea
                                value={letterContent}
                                onChange={(e) => setLetterContent(e.target.value)}
                                className="w-full h-64 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-500/50 focus:outline-none resize-none leading-relaxed"
                            />
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setLetterModalOpen(null)} className="px-6 py-2.5 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleSend} className="px-6 py-2.5 font-bold bg-brand-600 text-white rounded-xl shadow-md hover:bg-brand-500 flex items-center gap-2 transition-colors">
                                <MessageSquare className="w-4 h-4" /> Send via Messages
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertModal
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default WorkingCandidateView;
