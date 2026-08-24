import { useState, useRef } from 'react';
import { Clock, MessageSquare, Briefcase, ChevronLeft, FileText, Download, X, Paperclip, AlertCircle, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import { checkTextForProfanityAsync } from '../../utils/profanityFilter';
import ProfanityWarningModal from '../ProfanityWarningModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import EmptyState from '../ui/EmptyState';

interface StudentMessagingHubProps {
    threads: any[];
}

const StudentMessagingHub = ({ threads }: StudentMessagingHubProps) => {

    const { userId } = useAuth();
    const [activeThreadId, setActiveThreadId] = useState<string | null>(threads[0]?.id || null);
    const [showMobileChat, setShowMobileChat] = useState(false);

    // Message input state
    const [newMessage, setNewMessage] = useState('');
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeThread = threads.find(t => t.id === activeThreadId);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if ((!newMessage.trim() && !attachedFile) || !activeThreadId || !userId) return;

        setIsSending(true);
        const hasProfanity = await checkTextForProfanityAsync(newMessage);

        if (hasProfanity) {
            setErrorMessage('Please use professional language. Unprofessional or inappropriate terms are strictly prohibited.');
            setIsSending(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    thread_id: activeThreadId,
                    sender_id: userId,
                    content: newMessage,
                    attached_file_name: attachedFile?.name || null
                }]);

            if (error) throw error;

            // Note: The UI will automatically update due to the Realtime subscription in StudentDashboard.tsx

            setNewMessage('');
            setAttachedFile(null);
        } catch (err: any) {
            console.error('Error sending message:', err);
            setErrorMessage('Failed to send message: ' + err.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachedFile(e.target.files[0]);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const generatePDF = (
        recruiterName: string,
        companyName: string,
        _projectName: string,
        messageText: string,
        letterType: 'completion' | 'joining'
    ) => {

        const doc = new jsPDF();

        const dateStr = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        doc.setFontSize(24);
        doc.setTextColor(59, 130, 246);
        doc.text('projectMatch', 20, 30);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Official Project ${letterType === 'completion' ? 'Completion' : 'Joining'} Letter`, 20, 38);

        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`Date: ${dateStr}`, 20, 60);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Letter of ${letterType === 'completion' ? 'Completion' : 'Joining'}`, 105, 80, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);

        let bodyToRender = messageText;
        const bestRegardsIndex = bodyToRender.toLowerCase().lastIndexOf('best regards');
        if (bestRegardsIndex !== -1) {
            bodyToRender = bodyToRender.substring(0, bestRegardsIndex).trim();
        }

        const wrappedBody = doc.splitTextToSize(bodyToRender, 170);

        let yPos = 100;
        doc.text(wrappedBody, 20, yPos);

        yPos += wrappedBody.length * 7 + 10;

        doc.setFont('helvetica', 'normal');
        doc.text('Best Regards,', 20, yPos);

        yPos += 10;

        // Recruiter Name (BOLD)
        doc.setFont('helvetica', 'bold');
        doc.text(recruiterName, 20, yPos);

        yPos += 8;

        doc.setFont('helvetica', 'bold');
        doc.text(companyName, 20, yPos);

        const safeType = letterType === 'completion' ? 'completion' : 'joining';
        doc.save(`${safeType}_letter.pdf`);
    };

    if (threads.length === 0) {
        return (
            <div className="mt-4">
                <EmptyState
                    icon={MessageSquare}
                    title="No Messages Yet"
                    description="When a recruiter contacts you about an application, it will appear here."
                />
            </div>
        );
    }

    return (

        <div className="flex h-[calc(100vh-16rem)] min-h-[500px] border rounded-3xl bg-white shadow-xl overflow-hidden mt-4 relative">

            {/* LEFT THREAD PANEL */}

            <div className={`w-full md:w-1/3 flex flex-col border-r bg-slate-50 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>

                <div className="p-4 border-b bg-white">
                    <h2 className="font-bold text-lg text-slate-900">Conversations</h2>
                </div>

                <div className="flex-1 overflow-y-auto">

                    {threads.map(thread => {

                        const lastMessage = thread.messages[thread.messages.length - 1];
                        const isActive = thread.id === activeThreadId;

                        return (

                            <button
                                key={thread.id}
                                onClick={() => {
                                    setActiveThreadId(thread.id);
                                    setShowMobileChat(true);
                                }}
                                className={`w-full text-left p-4 border-b hover:bg-slate-100 flex gap-3 ${isActive ? 'bg-brand-50 border-l-4 border-l-brand-500' : ''}`}
                            >

                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold">
                                    {thread.companyName?.charAt(0) || 'R'}
                                </div>

                                <div className="flex-1 min-w-0">

                                    <div className="flex justify-between">

                                        <h4 className="font-bold truncate">
                                            {thread.companyName || 'Recruiter'}
                                        </h4>

                                        <span className="text-xs text-slate-500">
                                            {lastMessage ? formatDate(lastMessage.timestamp) : ''}
                                        </span>

                                    </div>

                                    <p className="text-xs text-brand-600 truncate">
                                        {thread.projectName || 'Project'}
                                    </p>

                                    <p className={`text-sm truncate ${isActive ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                        {lastMessage?.senderId === 'student' ? 'You: ' : ''}
                                        {lastMessage?.text || 'No messages yet'}
                                    </p>

                                </div>

                            </button>

                        );

                    })}

                </div>

            </div>

            {/* CHAT PANEL */}

            {activeThread && (

                <div className={`flex-1 flex flex-col ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>

                    <div className="p-4 border-b flex items-center gap-3">

                        <button onClick={() => setShowMobileChat(false)} className="md:hidden">
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">
                            {activeThread.companyName?.charAt(0) || 'R'}
                        </div>

                        <div>
                            <h3 className="font-bold">{activeThread.companyName || 'Recruiter'}</h3>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {activeThread.projectName}
                            </p>
                        </div>

                    </div>

                    <div className="flex-1 p-6 overflow-y-auto space-y-6">

                        {activeThread.messages.map((msg: any) => {

                            const isStudent = msg.senderId === 'student';

                            return (

                                <div key={msg.id} className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}>

                                    <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${isStudent ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>

                                        {msg.attachedFileName && (

                                            <div className="flex items-center gap-2 mb-2">

                                                <FileText className="w-5 h-5" />
                                                <span>{msg.attachedFileName}</span>

                                                {msg.attachedFileName.toLowerCase().includes('letter') && (

                                                    <button
                                                        onClick={() => {

                                                            const letterType =
                                                                msg.attachedFileName.toLowerCase().includes('joining')
                                                                    ? 'joining'
                                                                    : 'completion';

                                                            generatePDF(
                                                                activeThread.recruiterName || 'Recruiter',
                                                                activeThread.companyName || 'Company',
                                                                activeThread.projectName,
                                                                msg.text,
                                                                letterType
                                                            );

                                                        }}
                                                    >

                                                        <Download className="w-4 h-4" />

                                                    </button>

                                                )}

                                            </div>

                                        )}

                                        <p>{msg.text}</p>

                                    </div>

                                    <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(msg.timestamp)} • {isStudent ? 'You' : 'Recruiter'}
                                    </span>

                                </div>

                            );

                        })}

                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                        <ProfanityWarningModal error={errorMessage} onClose={() => setErrorMessage('')} />
                        {errorMessage && (
                            <div className={`mb-3 bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl items-start gap-2 text-sm animate-in fade-in slide-in-from-bottom-2 ${(errorMessage.toLowerCase().includes('inappropriate') || errorMessage.toLowerCase().includes('professional')) ? 'hidden md:flex' : 'flex'}`}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>{errorMessage}</p>
                            </div>
                        )}
                        {['active', 'accepted', 'working'].includes(activeThread.status || 'active') ? (
                            <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                            {attachedFile && (
                                <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm max-w-sm self-start mb-1 animation-in fade-in">
                                    <FileText className="w-4 h-4 text-slate-500" />
                                    <span className="truncate flex-1 text-slate-700 dark:text-slate-200 font-medium">
                                        {attachedFile.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setAttachedFile(null)}
                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2 items-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-colors"
                                    title="Attach file"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={attachedFile ? "Add a message (optional)..." : "Type your message..."}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-slate-900 transition-shadow"
                                />
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !attachedFile) || isSending}
                                    className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 text-white p-3 rounded-xl transition-colors shadow-sm flex items-center justify-center"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                        ) : (
                            <div className="text-center py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium border border-slate-200 dark:border-slate-800">
                                This conversation is closed because your application was {activeThread.status}.
                            </div>
                        )}
                    </div>

                </div>

            )}

        </div>

    );

};

export default StudentMessagingHub;