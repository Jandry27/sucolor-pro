import { motion } from 'framer-motion';
import {
    Share2,
    ToggleLeft,
    ToggleRight,
    Copy,
    Check,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdminOrder, OrderStatus } from '@/types';

const ESTADOS: { value: OrderStatus; label: string }[] = [
    { value: 'RECIBIDO', label: 'Recibido' },
    { value: 'LATONERIA', label: 'Latonería' },
    { value: 'PREPARACION', label: 'Preparación' },
    { value: 'PINTURA', label: 'Pintura' },
    { value: 'SECADO', label: 'Secado' },
    { value: 'PULIDO_DETALLES', label: 'Pulido' },
    { value: 'TERMINADO', label: 'Terminado' },
    { value: 'ENTREGADO', label: 'Entregado' },
];

interface OrderDetailStatusCardProps {
    orden: AdminOrder;
    saving: boolean;
    onUpdateEstado: (estado: OrderStatus) => Promise<void>;
    onToggleShare: () => Promise<void>;
    onCopyLink: () => void;
    copied: boolean;
    trackUrl: string | null;
}

export function OrderDetailStatusCard({
    orden,
    saving,
    onUpdateEstado,
    onToggleShare,
    onCopyLink,
    copied,
    trackUrl,
}: OrderDetailStatusCardProps) {
    return (
        <>
            {/* Estado de la orden */}
            <motion.div
                className="glass-card"
                style={{ padding: '20px' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
            >
                <h2 className="text-sm font-semibold text-[#0B1220] dark:text-white mb-3">
                    Estado de la orden
                </h2>
                <div className="flex flex-wrap gap-2">
                    {ESTADOS.map(st => (
                        <button
                            key={st.value}
                            onClick={() => onUpdateEstado(st.value)}
                            disabled={saving}
                            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                orden.estado === st.value
                                    ? 'text-white'
                                    : 'text-[rgba(11,18,32,0.55)] bg-[rgba(15,23,42,0.05)] hover:bg-[rgba(15,23,42,0.08)] border border-[rgba(15,23,42,0.08)]'
                            }`}
                            style={
                                orden.estado === st.value
                                    ? {
                                          background: '#FF5100',
                                          boxShadow: '0 2px 8px rgba(255,81,0,0.25)',
                                      }
                                    : {}
                            }
                        >
                            {st.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Portal del cliente */}
            <motion.div
                className="glass-card"
                style={{ padding: '20px' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-[#FF5100]" />
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                            Portal cliente
                        </p>
                    </div>
                    <button
                        onClick={onToggleShare}
                        disabled={saving}
                        className="flex items-center gap-2 text-sm transition-colors"
                    >
                        {orden.share_enabled ? (
                            <ToggleRight className="w-5 h-5 text-[#FF5100]" />
                        ) : (
                            <ToggleLeft className="w-5 h-5 text-[rgba(11,18,32,0.35)]" />
                        )}
                        <span
                            className={
                                orden.share_enabled
                                    ? 'text-[#FF5100] font-medium text-xs'
                                    : 'text-[rgba(11,18,32,0.45)] text-xs'
                            }
                        >
                            {orden.share_enabled ? 'Activo' : 'Inactivo'}
                        </span>
                    </button>
                </div>

                {orden.share_token && trackUrl ? (
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2 p-3 bg-[#F7F8FA] border border-[rgba(15,23,42,0.07)] rounded-xl">
                            <p className="flex-1 text-xs font-mono-code text-[rgba(11,18,32,0.55)] truncate">
                                {trackUrl}
                            </p>
                            <button
                                onClick={onCopyLink}
                                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.05)] text-[rgba(11,18,32,0.40)] hover:text-[#0B1220] transition-all"
                            >
                                {copied ? (
                                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                )}
                            </button>
                            <Link
                                to={`/track/${orden.codigo}?token=${orden.share_token}`}
                                target="_blank"
                                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.05)] text-[rgba(11,18,32,0.40)] hover:text-[#0B1220] transition-all"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        {!orden.share_enabled && (
                            <p className="text-xs text-[#F59E0B] font-medium flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" /> El portal está desactivado
                                — el cliente no puede acceder con el enlace
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-[rgba(11,18,32,0.45)]">
                        Esta orden aún no tiene token de seguimiento.
                    </p>
                )}
            </motion.div>
        </>
    );
}
