import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle, Loader2, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import { AdminLayout } from '@/components/admin/AdminLayout';

const STATUS_STATS = [
    { estado: 'EN_PROCESO', label: 'En Proceso', color: '#F59E0B' },
    { estado: 'LISTO', label: 'Listos', color: '#16A34A' },
    { estado: 'RECIBIDO', label: 'Recibidos', color: '#6B7280' },
] as const;

export function DashboardPage() {
    const { orders, loading, error, refetch, deleteOrder } = useOrders();
    const now = new Date();

    // Filtrar órdenes activas: no están ENTREGADO o fueron entregadas hace menos de 5 minutos
    const activeOrders = orders.filter(o => {
        if (o.estado !== 'ENTREGADO') return true;
        const updatedAt = new Date(o.updated_at);
        const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
        return diffMinutes <= 5;
    });

    const urgentes = activeOrders.filter(o => o.prioridad === 'URGENTE').length;
    const statsData = STATUS_STATS.map(s => ({
        ...s,
        count: activeOrders.filter(o => o.estado === s.estado).length,
    }));

    // Calcular ganancias del mes actual (basado en órdenes ENTREGADO este mes)
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyRevenue = orders
        .filter(o => {
            if (o.estado !== 'ENTREGADO') return false;
            const oDate = new Date(o.updated_at);
            return oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear;
        })
        .reduce((sum, o) => sum + (o.precio_total || o.monto_pagado || 0), 0);

    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(now);

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Dashboard</h1>
                        <p className="text-sm text-[rgba(15,23,42,0.60)] mt-0.5">
                            {activeOrders.length} órdenes activas
                            {urgentes > 0 && (
                                <span className="ml-2 inline-flex items-center gap-1 text-[#EF4444] font-medium">
                                    <AlertTriangle className="w-3 h-3" /> {urgentes} urgentes
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Reporte de ganancias del mes */}
                    <div className="hidden md:flex flex-col items-end mr-auto ml-8 px-5 py-2 rounded-xl bg-[rgba(22,163,74,0.08)] border border-[rgba(22,163,74,0.15)]">
                        <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-0.5">Ingresos {monthName}</span>
                        <span className="text-lg font-black text-[#16A34A] leading-none">${monthlyRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/admin/orders/nueva" className="btn-primary text-sm">
                            <PlusCircle className="w-4 h-4" /> Nueva Orden
                        </Link>
                        <button onClick={refetch} className="btn-secondary text-sm">
                            <RefreshCw className="w-4 h-4" /> Actualizar
                        </button>
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-card text-center !p-5">
                        <p className="text-3xl font-bold text-[#0F172A]">{activeOrders.length}</p>
                        <p className="text-xs text-[rgba(15,23,42,0.60)] mt-1 font-medium">Total Activas</p>
                    </motion.div>
                    {statsData.map((s, i) => (
                        <motion.div key={s.estado}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (i + 1) * 0.05 }}
                            className="glass-card text-center !p-5">
                            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.count}</p>
                            <p className="text-xs text-[rgba(15,23,42,0.60)] mt-1 font-medium">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Kanban */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-7 h-7 text-[#FF5100] animate-spin" />
                    </div>
                ) : error ? (
                    <div className="glass-card flex flex-col items-center justify-center py-12 gap-3">
                        <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
                        <p className="text-sm text-[rgba(15,23,42,0.60)]">{error}</p>
                        <button onClick={refetch} className="btn-secondary text-sm">Reintentar</button>
                    </div>
                ) : (
                    <>
                        <div className="md:hidden flex flex-col items-center justify-center p-4 mb-4 rounded-xl bg-[rgba(22,163,74,0.08)] border border-[rgba(22,163,74,0.15)]">
                            <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-1">Ingresos {monthName}</span>
                            <span className="text-2xl font-black text-[#16A34A] leading-none">${monthlyRevenue.toFixed(2)}</span>
                        </div>
                        <KanbanBoard orders={activeOrders} onDelete={deleteOrder} />
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
