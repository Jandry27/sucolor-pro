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
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Progreso del trabajo</h3>
                <span className="text-xs font-bold text-[#F97316] dark:text-[#FB923C] font-mono-code">{pct}%</span>
            </div>

            {/* Progress bar */}
            <div className="relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 mb-7 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: '#F97316', boxShadow: '0 0 10px rgba(249, 115, 22,0.5)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }} />
            </div>

            {/* Steps */}
            <div className="relative">
                <div className="flex items-start justify-between sm:justify-center gap-2 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
                    {PROGRESS_STEPS.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const isPending = index > currentStep;

                        return (
                            <motion.div key={step.key} className="flex flex-col items-center gap-2 min-w-[70px] sm:min-w-0 sm:flex-1 snap-center"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + index * 0.06, duration: 0.35 }}>
                                {/* Circle */}
                                <div className="relative">
                                    {isCurrent && (
                                        <div className="absolute -inset-1.5 rounded-full animate-pulse-orange"
                                            style={{ background: 'rgba(249, 115, 22,0.15)' }} />
                                    )}
                                    <div className={`relative w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${isCompleted ? 'bg-green-100/50 dark:bg-green-500/10 border-green-500 dark:border-green-400'
                                            : isCurrent ? 'bg-orange-100/50 dark:bg-orange-500/10 border-[#F97316] dark:border-[#FB923C] shadow-[0_4px_10px_rgba(249,115,22,0.2)]'
                                                : 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                        }`} style={{ borderWidth: isCompleted || isCurrent ? '1.5px' : '1px' }}>
                                        {isCompleted ? (
                                            <Check className="w-3.5 h-3.5 text-[#16A34A]" strokeWidth={2.5} />
                                        ) : (
                                            <step.icon className={`w-4 h-4 ${isPending ? 'opacity-30' : 'opacity-80'}`} />
                                        )}
                                    </div>
                                </div>

                                {/* Label */}
                                <span className={`text-[9px] sm:text-[10px] font-semibold text-center leading-[1.1] w-full max-w-[64px] uppercase tracking-wider break-words ${isCompleted ? 'text-green-600 dark:text-green-400'
                                        : isCurrent ? 'text-[#F97316] dark:text-[#FB923C]'
                                            : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                    {step.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
