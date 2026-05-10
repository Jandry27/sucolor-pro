import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertTriangle, PlusCircle, Trash2, Clock, ChevronRight, Share2, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrdenes } from '@/ganchos/useOrdenes';
import { DisenoAdministracion } from '@/componentes/administracion/DisenoAdministracion';

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
    BAJA: { color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
    NORMAL: { color: '#16A34A', bg: 'rgba(22,163,74,0.10)' },
    ALTA: { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
    URGENTE: { color: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
};

const ESTADOS: Record<string, { label: string; color: string }> = {
    RECIBIDO: { label: 'Recibido', color: '#6B7280' },
    LATONERIA: { label: 'Latonería', color: '#3B82F6' },
    PREPARACION: { label: 'Preparación', color: '#8B5CF6' },
    PINTURA: { label: 'Pintura', color: '#F59E0B' },
    SECADO: { label: 'Secado', color: '#FB923C' },
    PULIDO_DETALLES: { label: 'Pulido', color: '#EC4899' },
    TERMINADO: { label: 'Terminado', color: '#16A34A' },
    ENTREGADO: { label: 'Entregado', color: '#0EA5E9' },
};

export function PaginaListaOrdenes() {
    const { orders, loading, error, deleteOrder } = useOrdenes();
    const [q, setQ] = useState('');

    // Filtrar órdenes activas: no están ENTREGADO o fueron entregadas hace menos de 5 minutos
    const now = new Date();
    const activeOrders = orders.filter(o => {
        if (o.estado !== 'ENTREGADO') return true;
        const updatedAt = new Date(o.updated_at);
        const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
        return diffMinutes <= 5;
    });

    const filtered = activeOrders.filter(o => {
        const search = q.toLowerCase();
        const clienteNombres = ((o.cliente as any)?.nombres || '').toLowerCase();
        const codigo = (o.codigo || '').toLowerCase();
        const placa = (o.vehiculo?.placa || '').toLowerCase();
        const marca = (o.vehiculo?.marca || '').toLowerCase();

        return clienteNombres.includes(search) ||
            codigo.includes(search) ||
            placa.includes(search) ||
            marca.includes(search);
    });

    const handleDelete = async (e: React.MouseEvent, id: string, codigo: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`¿Estás seguro de que deseas eliminar la orden ${codigo}? Esta acción no se puede deshacer.`)) {
            await deleteOrder(id);
        }
    };

    return (
        <DisenoAdministracion>
            <div className="space-y-5 animate-fade-in">
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Órdenes Activas</h1>
                        <p className="text-sm text-[rgba(15,23,42,0.60)] mt-0.5">
                            {activeOrders.length} {activeOrders.length === 1 ? 'orden en proceso' : 'órdenes en proceso'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(11,18,32,0.30)] pointer-events-none" />
                            <input
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                placeholder="Buscar código, placa o cliente..."
                                className="input-field pl-9 text-sm w-full sm:w-64"
                            />
                        </div>
                        <Link to="/administracion/orders/nueva" className="btn-primary flex-shrink-0 w-full sm:w-auto justify-center text-sm">
                            <PlusCircle className="w-4 h-4" /> Nueva Orden
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center h-48 items-center">
                        <Loader2 className="w-7 h-7 text-[#FF5100] animate-spin" />
                    </div>
                ) : error ? (
                    <div className="glass-card flex flex-col items-center py-12 gap-3">
                        <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
                        <p className="text-sm text-[rgba(15,23,42,0.60)]">{error}</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((order, i) => {
                            const pStyle = PRIORITY_STYLE[order.prioridad] ?? PRIORITY_STYLE.NORMAL;
                            const eStyle = ESTADOS[order.estado] ?? { label: order.estado, color: '#6B7280' };
                            const fecha = new Date(order.fecha_ingreso).toLocaleDateString('es', { day: '2-digit', month: 'short' });

                            return (
                                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                    <Link to={`/administracion/orders/${order.id}`} className="block h-full">
                                        <div className="glass-card-hover h-full flex flex-col !p-4 !rounded-xl !border-slate-200/50">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex gap-3">
                                                    {/* Thumbnail */}
                                                    <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-[rgba(15,23,42,0.04)] border border-[rgba(15,23,42,0.08)] overflow-hidden flex items-center justify-center relative">
                                                        {(order as any).coverPhoto ? (
                                                            <img src={(order as any).coverPhoto as string} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Camera className="w-5 h-5 text-[rgba(11,18,32,0.20)]" />
                                                        )}
                                                    </div>
                                                    {/* Text content */}
                                                    <div className="min-w-0 flex-1 pl-1 pt-0.5">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono-code text-xs text-[#F72F42] font-bold">{order.codigo}</span>
                                                        </div>
                                                        <p className="font-semibold text-[#0F172A] text-sm mt-0.5 leading-tight truncate">
                                                            {(order.cliente as any).nombres}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 z-10">
                                                    <button
                                                        onClick={(e) => handleDelete(e, order.id, order.codigo)}
                                                        className="p-1 text-[rgba(11,18,32,0.30)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar orden"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Vehicle details */}
                                            <div className="flex items-center gap-2 text-xs text-[rgba(11,18,32,0.50)] mb-4 flex-1">
                                                <span className="font-mono-code bg-[rgba(15,23,42,0.06)] px-2 py-0.5 rounded-md text-[rgba(11,18,32,0.65)] whitespace-nowrap">
                                                    {order.vehiculo.placa}
                                                </span>
                                                <span className="truncate">{order.vehiculo.marca} {order.vehiculo.modelo}</span>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-[rgba(15,23,42,0.06)] mt-auto">
                                                <div className="flex items-center gap-1 text-xs text-[rgba(11,18,32,0.40)] font-medium">
                                                    {order.prioridad === 'URGENTE' && <AlertTriangle className="w-3 h-3 text-[#EF4444]" />}
                                                    <Clock className="w-3.5 h-3.5 opacity-80" />
                                                    {fecha}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-[rgba(11,18,32,0.25)]" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 glass-card flex flex-col items-center py-14 gap-3">
                                <Search className="w-8 h-8 text-[rgba(15,23,42,0.20)]" />
                                <p className="text-sm text-[rgba(15,23,42,0.50)]">No se encontraron órdenes</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DisenoAdministracion>
    );
}
