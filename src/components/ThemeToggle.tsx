import { useTheme } from './ThemeProvider';
import { Moon, Sun, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const icons = {
        light: <Sun className="w-4 h-4" />,
        dark: <Moon className="w-4 h-4" />,
        system_auto: <Monitor className="w-4 h-4" />
    };

    return (
        <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-inner">
            {(['light', 'system_auto', 'dark'] as const).map((t) => (
                <button
                    key={t}
                    onClick={() => setTheme(t)}
                    title={`Tema: ${t === 'system_auto' ? 'Automático (Ecuador)' : t === 'light' ? 'Claro' : 'Oscuro'}`}
                    className={`relative p-1.5 rounded-full flex items-center justify-center transition-colors ${theme === t
                            ? 'text-[#FF6A00] dark:text-[#FF8A33]'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                >
                    {theme === t && (
                        <motion.div
                            layoutId="theme-bubble"
                            className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-sm"
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                    )}
                    <span className="relative z-10">{icons[t]}</span>
                </button>
            ))}
        </div>
    );
}
