import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { STATUS_CONFIG, PROGRESS_STEPS } from '@/lib/constants';

interface OrderProgressProps { estado: OrderStatus; }

export function OrderProgress({ estado }: OrderProgressProps) {
    const config = STATUS_CONFIG[estado] ?? STATUS_CONFIG['RECIBIDO'];
    const currentStep = config.step;
    const totalSteps = PROGRESS_STEPS.length - 1;
    const pct = Math.round((currentStep / totalSteps) * 100);

    return (
        <motion.div className="glass-card"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-800 text-sm">Progreso del trabajo</h3>
                <span className="text-xs font-bold text-[#FF6A00] font-mono-code">{pct}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-100 mb-7 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: '#FF6A00', boxShadow: '0 0 10px rgba(255,106,0,0.5)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }} />
            </div>

            {/* Steps */}
            <div className="flex items-start justify-between gap-1">
                {PROGRESS_STEPS.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isPending = index > currentStep;

                    return (
                        <motion.div key={step.key} className="flex flex-col items-center gap-2 flex-1"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + index * 0.06, duration: 0.35 }}>
                            {/* Circle */}
                            <div className="relative">
                                {isCurrent && (
                                    <div className="absolute -inset-1.5 rounded-full animate-pulse-orange"
                                        style={{ background: 'rgba(255,106,0,0.15)' }} />
                                )}
                                <div className="relative w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300"
                                    style={
                                        isCompleted
                                            ? { background: 'rgba(22,163,74,0.10)', border: '1.5px solid #16A34A' }
                                            : isCurrent
                                                ? { background: 'rgba(255,106,0,0.10)', border: '1.5px solid #FF6A00', boxShadow: '0 4px 10px rgba(255,106,0,0.2)' }
                                                : { background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.08)' }
                                    }>
                                    {isCompleted ? (
                                        <Check className="w-3.5 h-3.5 text-[#16A34A]" strokeWidth={2.5} />
                                    ) : (
                                        <step.icon className={`w-4 h-4 ${isPending ? 'opacity-30' : 'opacity-80'}`} />
                                    )}
                                </div>
                            </div>

                            {/* Label */}
                            <span className="text-[9px] sm:text-[10px] font-semibold text-center leading-tight max-w-[48px] uppercase tracking-wide"
                                style={{
                                    color: isCompleted ? '#16A34A'
                                        : isCurrent ? '#FF6A00'
                                            : 'rgba(11,18,32,0.35)',
                                }}>
                                {step.label}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
