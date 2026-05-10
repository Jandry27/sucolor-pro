import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import type { Order } from '@/tipos';
import { STATUS_CONFIG } from '@/biblioteca/constantes';
import { formatDate } from '@/biblioteca/constantes';

interface EncabezadoOrdenProps { order: Order; }

function getColorHex(colorName: string): string {
    const map: Record<string, string> = {
        rojo: '#ef4444', azul: '#3b82f6', blanco: '#e5e7eb', negro: '#111827',
        gris: '#9ca3af', plateado: '#d1d5db', verde: '#22c55e', amarillo: '#eab308',
        naranja: '#f97316', violeta: '#8b5cf6', café: '#92400e', marron: '#92400e',
    };
    return map[colorName.toLowerCase()] ?? '#9ca3af';
}

export function EncabezadoOrden({ order }: EncabezadoOrdenProps) {
    const config = STATUS_CONFIG[order.estado] ?? STATUS_CONFIG['RECIBIDO'];

    return (
        <motion.div className="glass-card"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}>
            {/* Top: code + status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <p className="section-title mb-1">Código de seguimiento</p>
                    <h2 className="text-2xl font-bold text-[#0F172A] dark:text-slate-100 font-mono-code tracking-tight">
                        {order.codigo}
                    </h2>
                    {order.cliente && (
                        <p className="mt-1 text-sm text-[rgba(11,18,32,0.55)] dark:text-slate-400">{order.cliente}</p>
                    )}
                </div>

                {/* Status badge */}
                <motion.div key={order.estado} initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold"
                        style={{
                            color: config.color,
                            background: config.bgColor,
                            border: `1px solid ${config.borderColor}`,
                        }}>
                        {/* Pulse dot */}
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                                style={{ backgroundColor: config.dotColor }} />
                            <span className="relative inline-flex rounded-full h-2 w-2"
                                style={{ backgroundColor: config.dotColor }} />
                        </span>
                        {config.label}
                    </div>
                </motion.div>
            </div>

            {/* Divider */}
            <div className="divider mb-5" />

            {/* Vehicle info */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-5">
                <Field label="Marca" value={order.vehiculo.marca} />
                <Field label="Modelo" value={order.vehiculo.modelo} />
                <Field label="Año" value={String(order.vehiculo.anio)} />
                <Field label="Color" value={order.vehiculo.color}
                    prefix={<span className="inline-block w-3 h-3 rounded-full flex-shrink-0 border border-black/10"
                        style={{ backgroundColor: getColorHex(order.vehiculo.color) }} />} />
                <Field label="Placa" value={order.vehiculo.placa} mono />
            </div>

            {/* Divider */}
            <div className="divider mb-5" />

            {/* Dates */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                <DateRow icon={<Calendar className="w-3.5 h-3.5" />} label="Ingreso"
                    value={formatDate(order.fecha_ingreso)} />
                {order.fecha_estimada && (
                    <DateRow icon={<Clock className="w-3.5 h-3.5" />} label="Entrega estimada"
                        value={formatDate(order.fecha_estimada)} highlight />
                )}
            </div>
        </motion.div>
    );
}

function Field({ label, value, mono = false, prefix }: {
    label: string; value: string; mono?: boolean; prefix?: React.ReactNode;
}) {
    return (
        <div>
            <p className="section-title mb-1">{label}</p>
            <div className="flex items-center gap-1.5">
                {prefix}
                <p className={`text-sm font-semibold text-[#0F172A] dark:text-slate-200 ${mono ? 'font-mono-code' : ''}`}>
                    {value || '—'}
                </p>
            </div>
        </div>
    );
}

function DateRow({ icon, label, value, highlight = false }: {
    icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[rgba(11,18,32,0.35)] dark:text-slate-500">{icon}</span>
            <div>
                <p className="text-xs text-[rgba(11,18,32,0.40)] dark:text-slate-400 mb-0.5">{label}</p>
                <p className={`text-sm font-semibold ${highlight ? 'text-[#F97316] dark:text-[#FB923C]' : 'text-[#0F172A] dark:text-slate-200'}`}>
                    {value || 'Por confirmar'}
                </p>
            </div>
        </div>
    );
}
