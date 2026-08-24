import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { askProjectMatch } from '../../services/ai';
import type { AIResponse } from '../../services/ai';
import StructuredResponses from './StructuredResponses';

interface AssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content?: string;
    structuredData?: AIResponse;
    loading?: boolean;
}

export default function AssistantModal({ isOpen, onClose }: AssistantModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your ProjectMatch Assistant. I can help you find candidates, search for projects, or analyze profiles. What are you looking for?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useKeyboardShortcut('Escape', onClose, { enabled: isOpen });

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMsg = input.trim();
        setInput('');
        
        // Add user message
        const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userMsg };
        setMessages(prev => [...prev, newUserMsg]);

        // Add loading state
        const loadingId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: loadingId, role: 'assistant', loading: true }]);
        setIsThinking(true);

        try {
            // Get page context (mocked for now, normally derived from location or selected items)
            const context = { current_url: window.location.pathname };
            
            const aiData = await askProjectMatch(userMsg, context);
            
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
                content: "I'm having trouble connecting right now. Please try again later."
            } : m));
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-transparent">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full sm:max-w-2xl h-[95dvh] sm:h-[80vh] bg-slate-50 dark:bg-[#0a0f1c] sm:rounded-[2rem] rounded-t-3xl shadow-2xl shadow-brand-500/10 border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 flex flex-col">
                
                {/* Mobile Drag Handle */}
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={onClose}>
                    <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-tr from-brand-500 to-purple-500 p-2 rounded-xl text-white shadow-md shadow-brand-500/20">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white leading-tight">
                                AI Assistant
                            </h2>
                            <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Powered by Gemini</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'user' ? (
                                <div className="max-w-[85%] bg-brand-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm">
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            ) : (
                                <div className="max-w-[95%] sm:max-w-[85%]">
                                    {msg.loading ? (
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-3 text-slate-500">
                                            <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium animate-pulse">Thinking...</span>
                                        </div>
                                    ) : msg.structuredData ? (
                                        <StructuredResponses response={msg.structuredData} />
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe-bottom shrink-0">
                    <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-4xl mx-auto">
                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-[#030712] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white rounded-2xl pl-5 pr-12 py-3.5 sm:py-4 outline-none transition-all"
                                disabled={isThinking}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || isThinking}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-xl transition-colors shrink-0"
                        >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </form>
                    <div className="text-center mt-3 hidden sm:block">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">ProjectMatch AI • Verify important info</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
