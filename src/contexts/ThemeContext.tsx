import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (mode: ThemeMode) => void;
    currentActiveTheme: 'light' | 'dark'; // The actual resolved theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('projectmatch-theme');
            return (saved as ThemeMode) || 'auto';
        }
        return 'auto';
    });

    const [currentActiveTheme, setCurrentActiveTheme] = useState<'light' | 'dark'>('light');

    const resolveTheme = useCallback((mode: ThemeMode): 'light' | 'dark' => {
        if (mode === 'light' || mode === 'dark') return mode;

        // Auto mode
        if (typeof window !== 'undefined') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
            const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)');
            
            // Respect system preference if explicit
            if (systemPrefersDark.matches) return 'dark';
            if (systemPrefersLight.matches) return 'light';
        }

        // Time-based fallback
        const hour = new Date().getHours();
        // Light: 6:00 AM (6) - 6:59 PM (18). So >= 6 and < 19
        if (hour >= 6 && hour < 19) {
            return 'light';
        }
        return 'dark';
    }, []);

    const setTheme = (mode: ThemeMode) => {
        setThemeState(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('projectmatch-theme', mode);
            // We manually dispatch a custom event to sync across tabs if needed
            window.dispatchEvent(new Event('storage')); 
        }
    };

    useEffect(() => {
        const applyTheme = () => {
            const resolved = resolveTheme(theme);
            setCurrentActiveTheme(resolved);
            
            if (resolved === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        applyTheme();

        // Listen for system preference changes if in auto mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = () => {
            if (theme === 'auto') applyTheme();
        };
        
        mediaQuery.addEventListener('change', handleSystemChange);
        
        // Listen to storage changes (e.g. from other tabs)
        const handleStorageChange = () => {
            const saved = localStorage.getItem('projectmatch-theme');
            if (saved && ['light', 'dark', 'auto'].includes(saved)) {
                setThemeState(saved as ThemeMode);
            }
        };
        window.addEventListener('storage', handleStorageChange);

        // Time checker for auto mode (check every minute)
        const interval = setInterval(() => {
            if (theme === 'auto') applyTheme();
        }, 60000);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemChange);
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [theme, resolveTheme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, currentActiveTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
