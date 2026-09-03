import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CornerDownLeft, Sparkles, RotateCcw, Layers, Search, ArrowRight, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { askProjectMatch } from '../../services/ai';
import type { AIResponse } from '../../services/ai';
import StructuredResponses from './StructuredResponses';
import { useAIContext } from '../../contexts/AIContext';
import { useAuth } from '../../contexts/AuthContext';

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
    const { currentAIContext, setAIContext } = useAIContext();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useKeyboardShortcut('Escape', onClose, { enabled: isOpen });

    const getWelcomeMessage = useCallback(() => {
        let title = "What would you like to explore?";
        let subtitle = "Find relevant live projects, evaluate student candidates, or get tailored recommendations.";
        let chips: { label: string; desc: string }[] = [
            { label: "Find the right project", desc: "Discover live projects matching your skills" },
            { label: "Prioritize candidates", desc: "Rank applicants based on verified track record" },
            { label: "Explain a match", desc: "Understand why a candidate fits your project" }
        ];
        
        if (currentAIContext.entity === 'project_dashboard') {
            const name = currentAIContext.data?.projectName || 'your project';
            title = `Analyzing ${name}`;
            subtitle = "Ask Atlas to summarize applicant pools, detect skill gaps, or shortlist candidates.";
            chips = [
                { label: "Summarize top applicants", desc: "Quick overview of the strongest applicants" },
                { label: "Identify skill gaps", desc: "Highlight missing skills in current pool" },
                { label: "Compare candidate fit", desc: "Rank candidates against requirements" }
            ];
        } else if (currentAIContext.entity === 'candidate_review') {
            const name = currentAIContext.data?.candidateName || 'this candidate';
            title = `Reviewing ${name}`;
            subtitle = "Compare their verified profile and GitHub track record against project specifications.";
            chips = [
                { label: "Compare against requirements", desc: "Detailed breakdown of technical alignment" },
                { label: "Draft interview questions", desc: "Generate role-tailored technical questions" },
                { label: "Draft feedback notes", desc: "Create a constructive review summary" }
            ];
        } else if (currentAIContext.entity === 'student_application') {
            const name = currentAIContext.data?.projectName || 'this project';
            title = `Applying to ${name}`;
            subtitle = "Get suggestions on tailoring your pitch and highlighting your most relevant projects.";
            chips = [
                { label: "Draft cover letter bullets", desc: "Highlight relevant hands-on projects" },
                { label: "Check my skill alignment", desc: "See where your experience overlaps" },
                { label: "Application tips", desc: "Increase your chances of being selected" }
            ];
        }

        return {
            id: 'welcome-1',
            role: 'assistant' as const,
            content: (
                <div className="space-y-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-2.5">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Assistant Ready</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 dark:text-white">
                            {title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {subtitle}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-1 gap-2 pt-1">
                        {chips.map((chip, idx) => (
                            <button 
                                key={idx}
                                onClick={() => submitMessage(chip.label)}
                                className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-all flex items-center justify-between group shadow-xs"
                            >
                                <div className="min-w-0 pr-3">
                                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                        {chip.label}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {chip.desc}
                                    </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                        ))}
                    </div>

                    {!isAuthenticated && (
                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                <span className="font-semibold text-slate-900 dark:text-white">Guest preview:</span> Sign in to access full candidate ranking and live project search.
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/login');
                                }}
                                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                    )}
                </div>
            )
        };
    }, [currentAIContext, isAuthenticated, navigate, onClose]);

    // Initialize messages on open or context change
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 80);
            setMessages([getWelcomeMessage()]);
        }
    }, [isOpen, getWelcomeMessage]);

    // Auto-scroll on new message
    useEffect(() => {
        if (messages.length > 1) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [messages, isThinking]);

    const resetConversation = () => {
        setMessages([getWelcomeMessage()]);
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const submitMessage = async (msgToSubmit: string) => {
        if (!msgToSubmit.trim() || isThinking) return;

        const userMsg = msgToSubmit.trim();
        setInput('');
        
        // Add user message
        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsg };
        setMessages(prev => [...prev, newUserMsg]);

        if (!isAuthenticated) {
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: (
                        <div className="space-y-2.5">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                Authentication Required
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                To run live semantic matching and access candidate evaluations, please sign in to your student or recruiter account.
                            </p>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/login');
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors mt-1"
                            >
                                Go to Sign In <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )
                }
            ]);
            return;
        }

        // Add loading state
        const loadingId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: loadingId, role: 'assistant', loading: true }]);
        setIsThinking(true);
        setLoadingStage('Classifying intent...');
        
        const stageInterval = setInterval(() => {
            setLoadingStage(prev => {
                if (prev === 'Classifying intent...') return 'Searching knowledge base...';
                if (prev === 'Searching knowledge base...') return 'Synthesizing recommendations...';
                return prev;
            });
        }, 750);

        try {
            const contextPayload = { 
                current_url: window.location.pathname,
                active_entity: currentAIContext.entity,
                entity_data: currentAIContext.data
            };
            
            const aiData = await askProjectMatch(userMsg, contextPayload);
            
            setMessages(prev => prev.map(m => m.id === loadingId ? {
                id: loadingId,
                role: 'assistant',
                structuredData: aiData
            } : m));
            
        } catch (error) {
            setMessages(prev => prev.map(m => m.id === loadingId ? {
                id: loadingId,
                role: 'assistant',
                content: "Unable to complete search request right now. Please try rephrasing or retry in a moment."
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

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                role="dialog" 
                aria-modal="true" 
                aria-labelledby="assistant-modal-title" 
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col font-sans h-[85vh] sm:h-[620px] max-h-[90vh] animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-600 dark:bg-brand-500 text-white flex items-center justify-center shadow-xs">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 id="assistant-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                                Atlas Assistant
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                ProjectMatch AI Intelligence
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={resetConversation}
                            disabled={isThinking || messages.length <= 1}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Reset conversation"
                            aria-label="Reset conversation"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
                            aria-label="Close Assistant (Esc)"
                        >
                            <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500 mr-0.5">Esc</span>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Persistent Context Bar */}
                {currentAIContext.entity !== 'global' && (
                    <div className="px-5 py-2.5 bg-brand-50/60 dark:bg-brand-950/20 border-b border-brand-100 dark:border-brand-900/30 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 shrink-0">
                        <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-semibold text-brand-700 dark:text-brand-300 flex items-center gap-1 shrink-0">
                                <Layers className="w-3.5 h-3.5" /> Scope:
                            </span>
                            <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                                {currentAIContext.entity === 'project_dashboard' && (currentAIContext.data?.projectName ? `Project: ${currentAIContext.data.projectName}` : 'Project Workspace')}
                                {currentAIContext.entity === 'candidate_review' && (currentAIContext.data?.candidateName ? `Candidate: ${currentAIContext.data.candidateName}` : 'Candidate Review')}
                                {currentAIContext.entity === 'student_application' && (currentAIContext.data?.projectName ? `Application: ${currentAIContext.data.projectName}` : 'Student Application')}
                            </span>
                        </div>
                        <button
                            onClick={() => setAIContext({ entity: 'global' })}
                            className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-medium shrink-0"
                        >
                            Clear scope
                        </button>
                    </div>
                )}

                {/* Messages Stream */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-[#080d1a]/50">
                    {messages.map((msg) => {
                        if (msg.role === 'user') {
                            return (
                                <div key={msg.id} className="flex justify-end">
                                    <div className="bg-brand-600 dark:bg-brand-500 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 sm:py-3 text-sm max-w-[85%] sm:max-w-[75%] shadow-xs leading-relaxed font-normal break-words">
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id} className="flex items-start gap-3 max-w-[95%] sm:max-w-[90%]">
                                <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800/60 mt-0.5 shadow-xs">
                                    <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs p-4 sm:p-5 text-sm text-slate-800 dark:text-slate-200 shadow-xs">
                                    {msg.loading ? (
                                        <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400 py-1" role="status">
                                            <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-600 dark:border-t-brand-400 rounded-full animate-spin" />
                                            <span className="text-xs sm:text-sm font-medium">{loadingStage}</span>
                                        </div>
                                    ) : msg.structuredData ? (
                                        <StructuredResponses response={msg.structuredData} />
                                    ) : (
                                        <div className="leading-relaxed">
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 max-w-4xl mx-auto">
                        <div className="relative flex items-center">
                            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about projects, compare candidates, or request advice..."
                                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white pl-10 pr-12 py-3 rounded-xl outline-none text-sm font-medium transition-all shadow-2xs"
                                disabled={isThinking}
                                aria-label="Ask Atlas a question"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isThinking}
                                className="absolute right-1.5 p-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white dark:disabled:text-slate-500 rounded-lg transition-colors shadow-2xs disabled:cursor-not-allowed flex items-center justify-center min-w-[36px] min-h-[36px]"
                                title="Send query"
                                aria-label="Send query"
                            >
                                <CornerDownLeft className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="hidden sm:flex items-center justify-between px-1 text-[11px] text-slate-400 dark:text-slate-500">
                            <span>Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">↵</kbd> to send</span>
                            <span>Powered by ProjectMatch AI</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}

