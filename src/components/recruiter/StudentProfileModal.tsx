import { useState } from 'react';
import { X, Lock, Briefcase, GraduationCap, Mail, Github, Linkedin, User, Clock, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { checkTextForProfanityAsync } from '../../utils/profanityFilter';
import ProfanityWarningModal from '../ProfanityWarningModal';
import type { StudentProfile } from './StudentProfileCard';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: StudentProfile | null;
    hasActiveProjects: boolean;
    activeProjects?: any[];
    onPostProjectClick: () => void;
    onMessageInitiated?: (projectId: string, candidateId: string, message: string) => void;
}

const StudentProfileModal = ({ isOpen, onClose, profile, hasActiveProjects, activeProjects = [], onPostProjectClick, onMessageInitiated }: StudentProfileModalProps) => {
    const [isMessaging, setIsMessaging] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [messageSent, setMessageSent] = useState(false);
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setError('');
        setMessageText(e.target.value);
    };

    if (!isOpen || !profile) return null;

    const handleSendMessage = async () => {
        if (!messageText.trim() || error || !selectedProjectId) return;

        setIsSending(true);
        const hasProfanity = await checkTextForProfanityAsync(messageText);

        if (hasProfanity) {
            setError('Please use professional language. Unprofessional or inappropriate terms are strictly prohibited.');
            setIsSending(false);
            return;
        }

        if (onMessageInitiated && profile) {
            onMessageInitiated(selectedProjectId, profile.id, messageText);
        }

        setMessageSent(true);
        setIsSending(false);
        setTimeout(() => {
            setIsMessaging(false);
            setMessageSent(false);
            setMessageText('');
            setSelectedProjectId('');
            onClose();
        }, 2500);
    };

    const handleClose = () => {
        setIsMessaging(false);
        setMessageSent(false);
        setMessageText('');
        setSelectedProjectId('');
        setError('');
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
            onClick={handleClose}
        >
            <div
                className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl shadow-2xl relative overflow-y-auto sm:overflow-hidden sm:mt-10 sm:mb-10 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile drag handle */}
                <div className="w-full flex sm:hidden justify-center pt-3 pb-1" onClick={handleClose}>
                    <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 sm:top-4 right-4 z-50 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-white/50 dark:bg-slate-900/50 backdrop-blur p-2 rounded-full transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {hasActiveProjects ? (
                    /* UNLOCKED FULL PROFILE */
                    <div>
                        {/* Header Banner */}
                        <div className="h-20 bg-gradient-to-r from-brand-500 to-purple-600 w-full relative">
                            {/* Decorative pattern overlays could go here */}
                        </div>

                        <div className="px-6 pb-6">
                            <div className="relative -mt-10 mb-4 flex justify-between items-end">
                                <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-lg overflow-hidden">
                                    {profile.photoUrl ? (
                                        <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-heading text-slate-300 dark:text-slate-600">
                                            {profile.name.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-500 transition-colors">
                                        <Github className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-500 transition-colors">
                                        <Linkedin className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h2 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white mb-1.5">{profile.name}</h2>
                                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-brand-500" /> {profile.domain}</span>
                                    <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-purple-500" /> {profile.college}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">About</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Passionate {(profile.domain || 'student').toLowerCase()} with a strong track record of delivering quality work.
                                        I am looking for challenging live projects to further hone my skills and contribute to real-world products.
                                    </p>
                                </div>

                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">Live Project Experience</h3>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">Total Completed</span>
                                        <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {profile.completedProjects} Projects
                                        </span>
                                    </div>
                                </div>

                                {/* Detailed Past Projects */}
                                {profile.pastProjects && profile.pastProjects.length > 0 && (
                                    <div className="space-y-2">
                                        {profile.pastProjects.map((project, idx) => (
                                            <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-lg shadow-sm">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{project.title}</h4>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {project.company}</span>
                                                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {project.domain}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {project.duration}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 mt-2 space-y-3">
                                {!isMessaging ? (
                                    <button
                                        onClick={() => setIsMessaging(!isMessaging)}
                                        className="w-full py-3 text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:-translate-y-0.5 transition-transform shadow-lg shadow-slate-900/20 dark:shadow-white/10 flex items-center justify-center gap-2"
                                    >
                                        <Mail className="w-4 h-4" /> Message Candidate
                                    </button>
                                ) : (
                                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {messageSent ? (
                                            <div className="flex flex-col items-center justify-center py-6 text-brand-600 dark:text-brand-400">
                                                <CheckCircle2 className="w-10 h-10 mb-3" />
                                                <p className="font-bold text-lg">Message Sent!</p>
                                                <p className="text-sm opacity-80 mt-1">They will get back to you soon.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-3 text-slate-800 dark:text-slate-200">
                                                    <h4 className="font-bold flex items-center gap-2"><Mail className="w-4 h-4" /> New Message</h4>
                                                    <button onClick={() => setIsMessaging(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <ProfanityWarningModal error={error} onClose={() => setError('')} />
                                                {error && (
                                                    <div className={`mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg items-start gap-3 animate-in fade-in zoom-in-95 duration-200 ${(error.toLowerCase().includes('inappropriate') || error.toLowerCase().includes('professional')) ? 'hidden md:flex' : 'flex'}`}>
                                                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs font-medium text-red-700 dark:text-red-400">
                                                            {error}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="mb-3">
                                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Select Project Context <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={selectedProjectId}
                                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                                    >
                                                        <option value="" disabled>-- Choose an active project --</option>
                                                        {activeProjects.map(p => (
                                                            <option key={p.id} value={p.id}>{p.role} ({p.domain})</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <textarea
                                                    value={messageText}
                                                    onChange={handleMessageChange}
                                                    placeholder="Hi, we'd love to discuss a potential project opportunity with you..."
                                                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none h-20 mb-2 input-interactive"
                                                    autoFocus
                                                ></textarea>
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={handleSendMessage}
                                                        disabled={!messageText.trim() || !!error || !selectedProjectId || isSending}
                                                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {isSending ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <><Send className="w-4 h-4" /> Send</>
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* LOCKED STATE */
                    <div className="p-8 pb-10 text-center relative overflow-hidden bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">

                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10">
                            <Lock className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                            {/* Small profile icon hint behind lock */}
                            <User className="absolute w-12 h-12 text-slate-200 dark:text-slate-700 -z-10 opacity-50 blur-[2px]" />
                        </div>

                        <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2 relative z-10">
                            Profile Locked
                        </h2>

                        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto relative z-10">
                            You must have at least one live project posted to view detailed candidate profiles and contact students directly.
                        </p>

                        <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-500/20 rounded-2xl p-6 relative z-10">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Unlock full access instantly</h3>
                            <button
                                onClick={() => {
                                    handleClose();
                                    onPostProjectClick();
                                }}
                                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-md shadow-brand-500/20 hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
                            >
                                <Briefcase className="w-5 h-5" /> Post a Project Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProfileModal;
