import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2 } from 'lucide-react';

interface NotasPublicasProps {
    notes?: string | null;
}

export function NotasPublicas({ notes }: NotasPublicasProps) {
    const lines = notes ? notes.split('\n').filter(line => line.trim().length > 0) : [];

    return (
        <motion.div
            className="glass-card h-full flex flex-col"
            style={{ padding: '24px' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
        >
            <div className="flex items-center gap-2.5 mb-5">
                <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(249, 115, 22,0.08)' }}
                >
                    <ClipboardList className="w-4 h-4 text-[#F97316]" />
                </div>
                <h3 className="text-sm font-bold text-[#0B1220] dark:text-slate-200">
                    Bitácora y Notas del Taller
                </h3>
            </div>

            {lines.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-[rgba(11,18,32,0.35)] dark:text-slate-500 font-medium italic py-8">
                    No hay notas registradas aún.
                </div>
            ) : (
                <div className="space-y-3 pl-1 flex-1">
                    {lines.map((line, i) => {
                        const isDated = /^• \[[^\]]+\]/.test(line);
                        return (
                            <div key={i} className="flex items-start gap-3 relative pb-2 last:pb-0">
                                {/* Line connecting the dots */}
                                {i !== lines.length - 1 && (
                                    <div className="absolute left-[9px] top-[18px] bottom-0 w-px bg-[rgba(15,23,42,0.08)] dark:bg-slate-700 pointer-events-none" />
                                )}
                                <CheckCircle2 className="w-5 h-5 text-[#F97316] flex-shrink-0 mt-0.5 relative z-10" strokeWidth={2.5} />
                                <p className="text-sm text-[rgba(15,23,42,0.75)] dark:text-slate-300 leading-relaxed font-medium">
                                    {isDated ? (
                                        <>
                                            <span className="font-bold text-[#F97316] mr-1">
                                                {line.match(/^• (\[[^\]]+\])/)?.[1]}
                                            </span>
                                            {line.replace(/^• \[[^\]]+\]\s*/, '')}
                                        </>
                                    ) : (
                                        line.replace(/^• /, '')
                                    )}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
