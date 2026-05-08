import { motion } from 'framer-motion';
import { Clock, Activity } from 'lucide-react';
import type { TimelineEvent } from '@/types';
import { formatDateTime } from '@/lib/constants';

interface TimelineProps { events: TimelineEvent[]; }

export function Timeline({ events }: TimelineProps) {
    return (
        <motion.div className="glass-card" style={{ padding: '24px' }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24, ease: 'easeOut' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#F97316]" />
                    <h3 className="font-semibold text-[#0F172A] text-sm">Historial de actividad</h3>
                </div>
                {events.length > 0 && (
                    <span className="chip-orange">{events.length} evento{events.length !== 1 ? 's' : ''}</span>
                )}
            </div>

            {events.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center gap-3 py-12">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(15,23,42,0.05)' }}>
                        <Clock className="w-5 h-5 text-[rgba(11,18,32,0.25)]" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-[rgba(15,23,42,0.55)]">Sin actividad registrada</p>
                        <p className="text-xs text-[rgba(15,23,42,0.35)] mt-0.5">
                            Los eventos aparecerán aquí a medida que avance el trabajo
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    {/* Left line */}
                    <div className="absolute left-[15px] top-3 bottom-3 w-px"
                        style={{ background: 'linear-gradient(to bottom, rgba(249, 115, 22,0.35), rgba(249, 115, 22,0.04))' }} />

                    <div className="space-y-5">
                        {events.map((event, i) => (
                            <motion.div key={event.id ?? i}
                                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06, duration: 0.3 }}
                                className="relative flex gap-4 pl-1">
                                {/* Dot */}
                                <div className="flex-shrink-0 z-10">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white"
                                        style={{
                                            background: i === 0 ? 'rgba(249, 115, 22,0.10)' : 'rgba(255,255,255,0.6)',
                                            border: i === 0 ? '1.5px solid rgba(249, 115, 22,0.25)' : '1px solid rgba(15,23,42,0.10)',
                                        }}>
                                        <Clock className="w-3.5 h-3.5"
                                            style={{ color: i === 0 ? '#F97316' : 'rgba(15,23,42,0.35)' }} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1 pb-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 mb-1">
                                        <span className="font-semibold text-[#0F172A] text-sm">{event.tipo}</span>
                                        <span className="text-xs text-[rgba(15,23,42,0.40)]">
                                            {formatDateTime(event.created_at)}
                                        </span>
                                    </div>
                                    {event.descripcion && (
                                        <p className="text-sm text-[rgba(15,23,42,0.55)] leading-relaxed">
                                            {event.descripcion}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
