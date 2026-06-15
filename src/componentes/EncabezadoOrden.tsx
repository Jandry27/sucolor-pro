import { motion } from 'framer-motion';
import { Calendar, Clock, User } from 'lucide-react';
import type { Order, MediaItem } from '@/tipos';
import { STATUS_CONFIG, formatDate } from '@/biblioteca/constantes';

interface EncabezadoOrdenProps {
    order: Order;
    media?: MediaItem[];
}

function getColorHex(colorName: string): string {
    const map: Record<string, string> = {
        rojo: '#ef4444', azul: '#3b82f6', blanco: '#e5e7eb',
        negro: '#111827', gris: '#9ca3af', plateado: '#d1d5db',
        verde: '#22c55e', amarillo: '#eab308', naranja: '#f97316',
        violeta: '#8b5cf6', café: '#92400e', marron: '#92400e',
    };
    return map[colorName.toLowerCase()] ?? '#9ca3af';
}

export function EncabezadoOrden({ order, media }: EncabezadoOrdenProps) {
    const config = STATUS_CONFIG[order.estado] ?? STATUS_CONFIG['RECIBIDO'];

    // Use the FIRST "ANTES" photo for cover, so the client sees their vehicle as it arrived
    const antesPhotos = media?.filter(m => m.categoria === 'ANTES') ?? [];
    const mainImage = antesPhotos.length > 0 ? antesPhotos[0].signed_url : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card overflow-hidden !p-0"
        >
            {/* Top Section: Image + Info */}
            <div className="flex flex-col md:flex-row">
                {/* Left: Main Image */}
                <div className="relative w-full md:w-[45%] overflow-hidden bg-slate-900 group">
                    {/* Fixed height on mobile, fill height on desktop */}
                    <div className="relative h-56 sm:h-72 md:h-full md:min-h-[420px]">
                        {mainImage ? (
                            <img
                                src={mainImage}
                                alt="Vehículo"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-800">
                                <span className="text-sm font-medium">Sin imagen disponible</span>
                            </div>
                        )}
                        {/* Gradient fade at bottom on mobile */}
                        <div className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
                    </div>
                </div>

                {/* Right: Order Info */}
                <div className="w-full md:w-[55%] p-6 sm:p-8 md:p-10 flex flex-col justify-center">
                    {/* Order Code + Status */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                        <div>
                            <p className="text-[10px] font-bold text-[rgba(11,18,32,0.35)] uppercase tracking-[0.15em] mb-1">
                                Orden de Trabajo
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#FF5100] tracking-tight">
                                {order.codigo}
                            </h2>
                        </div>
                        {/* Status Badge */}
                        <motion.div
                            key={order.estado}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                        >
                            <div
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold"
                                style={{
                                    color: config.color,
                                    background: config.bgColor,
                                    border: `1px solid ${config.borderColor}`,
                                }}
                            >
                                <span className="relative flex h-2 w-2">
                                    <span
                                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                                        style={{ backgroundColor: config.dotColor }}
                                    />
                                    <span
                                        className="relative inline-flex rounded-full h-2 w-2"
                                        style={{ backgroundColor: config.dotColor }}
                                    />
                                </span>
                                {config.label}
                            </div>
                        </motion.div>
                    </div>

                    {/* Client */}
                    {order.cliente && (
                        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[rgba(15,23,42,0.06)]">
                            <div className="w-10 h-10 rounded-full bg-[rgba(249,115,22,0.08)] flex items-center justify-center text-[#FF5100] flex-shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-[rgba(11,18,32,0.35)] uppercase tracking-[0.12em]">
                                    Cliente
                                </p>
                                <p className="text-base sm:text-lg font-bold text-[#0F172A]">
                                    {order.cliente}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Vehicle Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                        <VehicleField label="Marca" value={order.vehiculo.marca} />
                        <VehicleField label="Modelo" value={order.vehiculo.modelo} />
                        <VehicleField label="Año" value={String(order.vehiculo.anio)} />

                        <div>
                            <p className="section-title mb-1">Color</p>
                            <div className="flex items-center gap-2">
                                <span
                                    className="inline-block w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                                    style={{ backgroundColor: getColorHex(order.vehiculo.color) }}
                                ></span>
                                <p className="text-sm font-semibold text-[#0F172A] capitalize">
                                    {order.vehiculo.color}
                                </p>
                            </div>
                        </div>

                        <VehicleField label="Placa" value={order.vehiculo.placa} mono />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Dates Banner */}
            <div className="bg-[#0B1220] flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 py-5 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none"></div>
                <DateItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Ingreso"
                    value={formatDate(order.fecha_ingreso)}
                />
                <div className="hidden sm:block w-px h-10 bg-white/10"></div>
                <DateItem
                    icon={<Clock className="w-4 h-4" />}
                    label="Entrega estimada"
                    value={order.fecha_estimada ? formatDate(order.fecha_estimada) : 'Por confirmar'}
                    highlight
                />
            </div>
        </motion.div>
    );
}

function VehicleField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p className="section-title mb-1">{label}</p>
            <div className="flex items-center gap-1.5">
                <p className={`text-sm font-semibold text-[#0F172A] ${mono ? 'font-mono-code' : ''}`}>
                    {value || '—'}
                </p>
            </div>
        </div>
    );
}

function DateItem({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center gap-3 z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlight ? 'bg-[#FF5100]/10 text-[#FF5100]' : 'bg-white/5 text-slate-400'}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-0.5">{label}</p>
                <p className={`text-sm font-bold tracking-wide ${highlight ? 'text-[#FF5100]' : 'text-white'}`}>{value}</p>
            </div>
        </div>
    );
}
