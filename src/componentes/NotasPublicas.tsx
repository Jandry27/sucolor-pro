import { motion } from 'framer-motion';
import { StickyNote } from 'lucide-react';

interface NotasPublicasProps { notes?: string | null; }

export function NotasPublicas({ notes }: NotasPublicasProps) {
    if (!notes) return null;

    const lines = notes.split('\n').filter(line => line.trim().length > 0);

    return (
        <motion.div className="glass-card" style={{ padding: '20px' }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.10 }}>
            <div className="flex items-center gap-2.5 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(249, 115, 22,0.08)' }}>
                    <StickyNote className="w-4 h-4 text-[#F97316]" />
                </div>
                <h3 className="text-sm font-bold text-[#0B1220] dark:text-slate-200">
                    Bitácora y Notas del Taller
                </h3>
            </div>
            
            <div className="space-y-3 pl-1">
                {lines.map((line, i) => {
                    // Try to highlight dates if they match the [DD MMM] format we will inject
                    const isDated = /^• \[[^\]]+\]/.test(line);
                    return (
                        <div key={i} className="flex items-start gap-3 relative pb-2 last:pb-0">
                            {/* Line connecting the dots */}
                            {i !== lines.length - 1 && (
                                <div className="absolute left-[3px] top-4 bottom-0 w-px bg-[rgba(15,23,42,0.08)] dark:bg-slate-700 pointer-events-none" />
                            )}
                            <div className="w-2 h-2 rounded-full bg-[#F97316] mt-[6px] flex-shrink-0 shadow-[0_0_0_4px_rgba(249,115,22,0.15)] z-10" />
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
        </motion.div>
    );
}
