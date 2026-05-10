import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system_auto';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentMode: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('sucolor-theme', 'light');
    }, []);

    const theme: Theme = 'light';
    const currentMode: 'dark' | 'light' = 'light';
    const setTheme = () => {};

    return (
        <ThemeContext.Provider value={{ theme, setTheme, currentMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
