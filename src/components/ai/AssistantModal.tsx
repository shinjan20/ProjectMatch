import React, { useState, useEffect, useRef } from 'react';
import { X, CornerDownLeft, Search } from 'lucide-react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { askProjectMatch } from '../../services/ai';
import type { AIResponse } from '../../services/ai';
import StructuredResponses from './StructuredResponses';
import { useAIContext } from '../../contexts/AIContext';

interface AssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content?: string | React.ReactNode;
    structuredData?: AIResponse;
    loading?: boolean;
}

export default function AssistantModal({ isOpen, onClose }: AssistantModalProps) {
    const { currentAIContext } = useAIContext();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useKeyboardShortcut('Escape', onClose, { enabled: isOpen });

    // Focus input when modal opens and set contextual initial message
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            
            // Generate contextual welcome message
            let title = "What do you want to figure out?";
            let subtitle = "Find opportunities, evaluate candidates, or get help with your next decision.";
            let chips = ["Find the right project", "Prioritize candidates", "Explain a match"];
            
            if (currentAIContext.entity === 'project_dashboard') {
                title = `Analyzing ${currentAIContext.data?.projectName || 'Project'}`;
                subtitle = "Ask me to summarize the applicant pool or find skill gaps.";
                chips = ["Summarize top applicants", "Identify skill gaps", "Compare fit"];
            } else if (currentAIContext.entity === 'candidate_review') {
                title = `Reviewing ${currentAIContext.data?.candidateName || 'Candidate'}`;
                subtitle = "I can compare their skills against your project requirements.";
                chips = ["Compare against requirements", "Draft rejection letter", "Draft interview invite"];
            } else if (currentAIContext.entity === 'student_application') {
                title = `Applying to ${currentAIContext.data?.projectName || 'Project'}`;
                subtitle = "Need help highlighting your strengths?";
                chips = ["Draft cover letter bullets", "Am I a good fit?"];
            }

            setMessages([
                {
                    id: '1',
                    role: 'assistant',
                    content: (
                        <div className="space-y-3 mt-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                            <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>
                            <div className="flex flex-wrap gap-2 pt-3">
                                {chips.map((chip, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => submitMessage(chip)}
                                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                }
            ]);
        }
    }, [isOpen, currentAIContext]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isOpen) return null;

    const submitMessage = async (msgToSubmit: string) => {
        if (!msgToSubmit.trim() || isThinking) return;

        const userMsg = msgToSubmit.trim();
        setInput('');
        
        // Add user message
        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsg };
        setMessages(prev => [...prev, newUserMsg]);

        // Add loading state
        const loadingId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: loadingId, role: 'assistant', loading: true }]);
        setIsThinking(true);
        setLoadingStage('Classifying intent...');
        
        const stageInterval = setInterval(() => {
            setLoadingStage(prev => {
                if (prev === 'Classifying intent...') return 'Searching database...';
                if (prev === 'Searching database...') return 'Synthesizing results...';
                return prev;
            });
        }, 800);

        try {
            // Pass the active context directly to the AI service
            const contextPayload = { 
                current_url: window.location.pathname,
                active_entity: currentAIContext.entity,
                entity_data: currentAIContext.data
            };
            
            const aiData = await askProjectMatch(userMsg, contextPayload);
            
            // Replace loading state with real response
            setMessages(prev => prev.map(m => m.id === loadingId ? {
                id: loadingId,
                role: 'assistant',
                structuredData: aiData
            } : m));
            
        } catch (error) {
            // Replace loading state with error
            setMessages(prev => prev.map(m => m.id === loadingId ? {
                id: loadingId,
                role: 'assistant',
                content: "We couldn't complete that search. Try again in a moment."
            } : m));
        } finally {
            clearInterval(stageInterval);
            setIsThinking(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitMessage(input);
    };

    return (
        <div className={`fixed inset-0 z-[100] flex sm:flex-col items-center justify-end sm:justify-start sm:p-6 bg-transparent transition-all duration-300 ease-out sm:pt-[15vh]`}>
            {/* Backdrop - Glassmorphism */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Box - Premium glass surfaces */}
            <div className={`relative z-10 w-full sm:max-w-3xl bg-white/95 dark:bg-[#0a0f1c]/95 backdrop-blur-xl sm:rounded-xl rounded-t-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all duration-300 ease-out flex flex-col font-sans animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 h-auto max-h-[95dvh] sm:max-h-[70vh]`}>
                
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <h2 className="text-sm font-semibold tracking-wide">
                            <span className="text-brand-600 dark:text-brand-500 mr-2">→</span>Ask ProjectMatch
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
                    >
                        Esc <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Persistent Context Bar */}
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#0a0f1c]/50 shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Context</p>
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 w-fit px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                        <Search className="w-3.5 h-3.5 text-slate-500" />
                        <span className="capitalize">{currentAIContext.entity.replace('_', ' ')}</span>
                    </div>
                </div>

                {/* Workspace Area */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8 bg-white dark:bg-[#0a0f1c]">
                    {messages.map((msg, index) => {
                        // Group user and assistant messages for a cleaner workspace flow
                        if (msg.role === 'user') {
                            return (
                                <div key={msg.id} className="w-full">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">YOU ASKED</p>
                                    <p className="text-base font-medium text-slate-900 dark:text-white border-l-2 border-slate-300 dark:border-slate-700 pl-4 py-1">
                                        {msg.content}
                                    </p>
                                </div>
                            );
                        } else {
                            // Assistant message
                            const isFirstMessage = index === 0;
                            return (
                                <div key={msg.id} className="w-full">
                                    {!isFirstMessage && (
                                        <div className="flex items-center gap-2 mb-3 mt-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROJECTMATCH FOUND</p>
                                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800/50"></div>
                                        </div>
                                    )}
                                    {msg.loading ? (
                                        <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 py-2">
                                            <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium">{loadingStage}</span>
                                        </div>
                                    ) : msg.structuredData ? (
                                        <StructuredResponses response={msg.structuredData} />
                                    ) : (
                                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                            <p>{msg.content}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 max-w-4xl mx-auto">
                        <div className="relative flex-1 bg-white dark:bg-[#0a0f1c] border border-slate-300 dark:border-slate-700 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 rounded-lg overflow-hidden transition-all shadow-sm">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Search projects, compare candidates, or ask about your work..."
                                className="w-full bg-transparent text-slate-900 dark:text-white pl-4 pr-12 py-3.5 outline-none text-sm font-medium"
                                disabled={isThinking}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isThinking}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:opacity-50 text-white dark:disabled:text-slate-500 rounded-md transition-colors shadow-sm"
                                title="Send"
                            >
                                <CornerDownLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
