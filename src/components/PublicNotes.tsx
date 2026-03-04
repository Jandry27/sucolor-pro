import { motion } from 'framer-motion';
import { StickyNote } from 'lucide-react';

interface PublicNotesProps { notes?: string | null; }

export function PublicNotes({ notes }: PublicNotesProps) {
    if (!notes) return null;

    return (
        <motion.div className="card" style={{ padding: '20px' }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.10 }}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(255,81,0,0.08)' }}>
                    <StickyNote className="w-3.5 h-3.5 text-[#FF5100]" />
                </div>
                <div>
                    <p className="text-xs font-semibold text-[rgba(11,18,32,0.45)] uppercase tracking-wider mb-1.5">
                        Nota del taller
                    </p>
                    <p className="text-sm text-[rgba(11,18,32,0.70)] leading-relaxed">{notes}</p>
                </div>
            </div>
        </motion.div>
    );
}
