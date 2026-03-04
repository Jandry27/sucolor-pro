import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Share2, ChevronRight } from 'lucide-react';
import type { AdminOrder } from '@/types';

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
    BAJA: { color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
    NORMAL: { color: '#16A34A', bg: 'rgba(22,163,74,0.10)' },
    ALTA: { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
    URGENTE: { color: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
};

interface OrderCardProps { order: AdminOrder; }

export function OrderCard({ order }: OrderCardProps) {
    const pStyle = PRIORITY_STYLE[order.prioridad] ?? PRIORITY_STYLE.NORMAL;
    const fecha = new Date(order.fecha_ingreso).toLocaleDateString('es', { day: '2-digit', month: 'short' });

    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-white border border-[rgba(15,23,42,0.07)] rounded-xl overflow-hidden transition-all duration-150 hover:border-[rgba(255,81,0,0.20)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 cursor-pointer"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <Link to={`/admin/orders/${order.id}`} className="block p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                        <p className="font-mono-code text-xs text-[#FF5100] font-bold">{order.codigo}</p>
                        <p className="font-semibold text-[#0B1220] text-sm mt-0.5 leading-tight truncate">
                            {(order.cliente as any).nombres}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ color: pStyle.color, background: pStyle.bg }}>
                            {order.prioridad}
                        </span>
                        {order.share_enabled && (
                            <Share2 className="w-3 h-3 text-[#FF5100]" />
                        )}
                    </div>
                </div>

                {/* Vehicle */}
                <div className="flex items-center gap-2 text-xs text-[rgba(11,18,32,0.50)] mb-3">
                    <span className="font-mono-code bg-[rgba(15,23,42,0.06)] px-2 py-0.5 rounded-md text-[rgba(11,18,32,0.65)]">
                        {order.vehiculo.placa}
                    </span>
                    <span className="truncate">{order.vehiculo.marca} {order.vehiculo.modelo}</span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(15,23,42,0.06)]">
                    <div className="flex items-center gap-1 text-xs text-[rgba(11,18,32,0.40)]">
                        {order.prioridad === 'URGENTE' && <AlertTriangle className="w-3 h-3 text-[#EF4444]" />}
                        <Clock className="w-3 h-3" />
                        {fecha}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[rgba(11,18,32,0.25)]" />
                </div>
            </Link>
        </motion.div>
    );
}
