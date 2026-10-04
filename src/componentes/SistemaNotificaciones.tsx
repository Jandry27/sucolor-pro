/**
 * SistemaNotificaciones.tsx
 * Sistema centralizado de toasts y modales de confirmación.
 * Reemplaza completamente alert() y window.confirm().
 */
import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Trash2, AlertCircle } from 'lucide-react';

// ─── Tipos ──────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
}

interface NotifContextValue {
    toast: (type: ToastType, title: string, message?: string) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const NotifContext = createContext<NotifContextValue | null>(null);

export function useNotif() {
    const ctx = useContext(NotifContext);
    if (!ctx) throw new Error('useNotif debe usarse dentro de <ProveedorNotificaciones>');
    return ctx;
}

// ─── Config visual de toasts ──────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { icon: React.ReactNode; bg: string; border: string; color: string }> = {
    success: {
        icon: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
        bg: 'rgba(22,163,74,0.08)',
        border: 'rgba(22,163,74,0.25)',
        color: '#16A34A',
    },
    error: {
        icon: <XCircle className="w-4 h-4 flex-shrink-0" />,
        bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.25)',
        color: '#EF4444',
    },
    warning: {
        icon: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
        color: '#D97706',
    },
    info: {
        icon: <Info className="w-4 h-4 flex-shrink-0" />,
        bg: 'rgba(14,165,233,0.08)',
        border: 'rgba(14,165,233,0.25)',
        color: '#0EA5E9',
    },
};

// ─── Config visual de confirm ─────────────────────────────────────────────────
const CONFIRM_VARIANT: Record<string, { icon: React.ReactNode; confirmClass: string }> = {
    danger: {
        icon: <Trash2 className="w-5 h-5 text-red-500" />,
        confirmClass: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
        icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
        confirmClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    info: {
        icon: <Info className="w-5 h-5 text-[#0EA5E9]" />,
        confirmClass: 'btn-primary',
    },
};

// ─── Componente Toast individual ──────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const cfg = TOAST_CONFIG[toast.type];

    useEffect(() => {
        const t = setTimeout(() => onRemove(toast.id), 4000);
        return () => clearTimeout(t);
    }, [toast.id, onRemove]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg border max-w-sm w-full backdrop-blur-md"
            style={{
                background: cfg.bg,
                borderColor: cfg.border,
                boxShadow: `0 8px 32px -8px ${cfg.color}30, 0 2px 8px rgba(0,0,0,0.06)`,
            }}
        >
            <span style={{ color: cfg.color }} className="mt-0.5">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A]">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-[rgba(15,23,42,0.55)] mt-0.5 leading-relaxed">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 text-[rgba(15,23,42,0.30)] hover:text-[rgba(15,23,42,0.60)] transition-colors mt-0.5"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
}

// ─── Modal de Confirmación ────────────────────────────────────────────────────
interface ConfirmState extends ConfirmOptions {
    resolve: (val: boolean) => void;
}

function ModalConfirmacion({ state, onClose }: { state: ConfirmState; onClose: (val: boolean) => void }) {
    const variant = state.variant ?? 'danger';
    const vcfg = CONFIRM_VARIANT[variant] ?? CONFIRM_VARIANT.danger;

    // Cerrar con Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => onClose(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />

            {/* Dialog */}
            <motion.div
                className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-6 max-w-sm w-full"
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{ boxShadow: '0 24px 64px -12px rgba(0,0,0,0.18)' }}
            >
                {/* Icono */}
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                    {vcfg.icon}
                </div>

                <h3 className="text-base font-bold text-[#0F172A] mb-1.5">{state.title}</h3>
                <p className="text-sm text-[rgba(15,23,42,0.55)] leading-relaxed mb-5">{state.message}</p>

                <div className="flex gap-2.5">
                    <button
                        onClick={() => onClose(false)}
                        className="flex-1 btn-secondary text-sm py-2.5"
                    >
                        {state.cancelLabel ?? 'Cancelar'}
                    </button>
                    <button
                        onClick={() => onClose(true)}
                        className={`flex-1 text-sm py-2.5 rounded-xl font-semibold transition-all duration-150 ${vcfg.confirmClass}`}
                    >
                        {state.confirmLabel ?? 'Confirmar'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Proveedor principal ──────────────────────────────────────────────────────
export function ProveedorNotificaciones({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
    const idRef = useRef(0);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = String(++idRef.current);
        setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
    }, []);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setConfirmState({ ...options, resolve });
        });
    }, []);

    const handleConfirmClose = (val: boolean) => {
        confirmState?.resolve(val);
        setConfirmState(null);
    };

    return (
        <NotifContext.Provider value={{ toast, confirm }}>
            {children}

            {/* Toasts — esquina inferior derecha */}
            <div className="fixed bottom-5 right-5 z-[9998] flex flex-col gap-2.5 items-end pointer-events-none">
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div layout key={t.id} className="pointer-events-auto">
                            <ToastItem toast={t} onRemove={removeToast} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal de confirmación */}
            <AnimatePresence>
                {confirmState && (
                    <ModalConfirmacion state={confirmState} onClose={handleConfirmClose} />
                )}
            </AnimatePresence>
        </NotifContext.Provider>
    );
}
