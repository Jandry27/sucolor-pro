import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle, ClipboardList, ArrowRight, Car, Calendar, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { OrderStatus } from '@/types';

interface VehicleRow {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    anio: number;
    color: string;
}

interface OrdenRow {
    id: string;
    codigo: string;
    estado: OrderStatus;
    fecha_ingreso: string;
    fecha_estimada: string | null;
    notas_publicas: string | null;
}

interface Props {
    vehiculo: VehicleRow | null;
    onClose: () => void;
}

const ESTADO_LABELS: Record<OrderStatus, string> = {
    RECIBIDO: 'Recibido',
    LATONERIA: 'Latonería',
    PREPARACION: 'Preparación',
    PINTURA: 'Pintura',
    SECADO: 'Secado',
    PULIDO_DETALLES: 'Pulido',
    TERMINADO: 'Terminado',
    ENTREGADO: 'Entregado',
};

const ESTADO_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
    RECIBIDO: { bg: 'bg-blue-100', text: 'text-blue-700' },
    LATONERIA: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    PREPARACION: { bg: 'bg-orange-100', text: 'text-orange-700' },
    PINTURA: { bg: 'bg-purple-100', text: 'text-purple-700' },
    SECADO: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    PULIDO_DETALLES: { bg: 'bg-pink-100', text: 'text-pink-700' },
    TERMINADO: { bg: 'bg-green-100', text: 'text-green-700' },
    ENTREGADO: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

function fmt(dateStr: string | null) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function VehicleHistoryDrawer({ vehiculo, onClose }: Props) {
    const navigate = useNavigate();
    const [ordenes, setOrdenes] = useState<OrdenRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!vehiculo) return;
        setLoading(true);
        setError(null);
        setOrdenes([]);

        supabase
            .from('ordenes')
            .select('id, codigo, estado, fecha_ingreso, fecha_estimada, notas_publicas')
            .eq('vehiculo_id', vehiculo.id)
            .order('fecha_ingreso', { ascending: false })
            .then(({ data, error: err }) => {
                if (err) setError('No se pudo cargar el historial.');
                else setOrdenes(data ?? []);
                setLoading(false);
            });
    }, [vehiculo]);

    return (
        <AnimatePresence>
            {vehiculo && (
                <>
                    {/* Overlay */}
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        key="drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-5 border-b border-[rgba(15,23,42,0.07)]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[rgba(255,81,0,0.10)] flex items-center justify-center flex-shrink-0">
                                    <Car className="w-4.5 h-4.5 text-[#FF5100]" style={{ width: 18, height: 18 }} />
                                </div>
                                <div>
                                    <p className="font-mono text-xs font-bold text-[#FF5100] uppercase tracking-widest">{vehiculo.placa}</p>
                                    <h2 className="text-base font-bold text-[#0B1220] leading-tight">
                                        {vehiculo.marca} {vehiculo.modelo}
                                    </h2>
                                    <p className="text-xs text-[rgba(11,18,32,0.45)]">{vehiculo.anio} · {vehiculo.color}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg hover:bg-[rgba(15,23,42,0.06)] flex items-center justify-center text-[rgba(11,18,32,0.40)] hover:text-[#0B1220] transition-all flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Sub-header label */}
                        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-[rgba(11,18,32,0.35)]" />
                            <span className="text-xs font-semibold text-[rgba(11,18,32,0.45)] uppercase tracking-wider">
                                Historial de visitas
                            </span>
                            {!loading && !error && (
                                <span className="ml-auto text-xs text-[rgba(11,18,32,0.35)]">
                                    {ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'}
                                </span>
                            )}
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
                            {loading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="w-6 h-6 text-[#FF5100] animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center gap-2 py-12">
                                    <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
                                    <p className="text-sm text-[rgba(11,18,32,0.50)]">{error}</p>
                                </div>
                            ) : ordenes.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-14">
                                    <div className="w-12 h-12 rounded-2xl bg-[rgba(15,23,42,0.04)] flex items-center justify-center">
                                        <ClipboardList className="w-5 h-5 text-[rgba(11,18,32,0.25)]" />
                                    </div>
                                    <p className="text-sm text-[rgba(11,18,32,0.40)] text-center">
                                        Este vehículo aún no tiene órdenes registradas
                                    </p>
                                </div>
                            ) : (
                                ordenes.map((orden, i) => {
                                    const colors = ESTADO_COLORS[orden.estado] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
                                    return (
                                        <motion.div
                                            key={orden.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white border border-[rgba(15,23,42,0.08)] rounded-2xl p-4 hover:border-[rgba(255,81,0,0.25)] hover:shadow-sm transition-all group"
                                        >
                                            {/* Top row: código + badge estado */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-mono text-xs font-bold text-[#0B1220] tracking-widest">
                                                    {orden.codigo}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                                                    {ESTADO_LABELS[orden.estado] ?? orden.estado}
                                                </span>
                                            </div>

                                            {/* Fechas */}
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-[rgba(11,18,32,0.35)]" />
                                                    <span className="text-xs text-[rgba(11,18,32,0.55)]">
                                                        Ingreso: <strong className="text-[#0B1220]">{fmt(orden.fecha_ingreso)}</strong>
                                                    </span>
                                                </div>
                                                {orden.fecha_estimada && (
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarCheck className="w-3.5 h-3.5 text-[rgba(11,18,32,0.35)]" />
                                                        <span className="text-xs text-[rgba(11,18,32,0.55)]">
                                                            Salida: <strong className="text-[#0B1220]">{fmt(orden.fecha_estimada)}</strong>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Notas */}
                                            {orden.notas_publicas && (
                                                <p className="text-xs text-[rgba(11,18,32,0.50)] leading-relaxed mb-3 line-clamp-2">
                                                    {orden.notas_publicas}
                                                </p>
                                            )}

                                            {/* CTA */}
                                            <button
                                                onClick={() => { onClose(); navigate(`/admin/orders/${orden.id}`); }}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-[#FF5100] hover:text-[#e54800] transition-colors group-hover:gap-2.5"
                                            >
                                                Ver detalle
                                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                            </button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
