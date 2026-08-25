import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type AIContextType = {
    entity: 'global' | 'project_dashboard' | 'candidate_review' | 'student_application';
    data?: any;
};

interface AIContextValue {
    currentAIContext: AIContextType;
    setAIContext: (context: AIContextType) => void;
    isAssistantOpen: boolean;
    openAssistant: (context?: AIContextType) => void;
    closeAssistant: () => void;
}

const AIContext = createContext<AIContextValue | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
    const [currentAIContext, setAIContext] = useState<AIContextType>({ entity: 'global' });
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);

    const openAssistant = (context?: AIContextType) => {
        if (context) {
            setAIContext(context);
        }
        setIsAssistantOpen(true);
    };

    const closeAssistant = () => {
        setIsAssistantOpen(false);
    };

    return (
        <AIContext.Provider value={{ currentAIContext, setAIContext, isAssistantOpen, openAssistant, closeAssistant }}>
            {children}
        </AIContext.Provider>
    );
}

export function useAIContext() {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error('useAIContext must be used within an AIProvider');
    }
    return context;
}
