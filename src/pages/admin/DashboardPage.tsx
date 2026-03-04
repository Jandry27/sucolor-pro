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
    const { orders, loading, error, refetch } = useOrders();
    const urgentes = orders.filter(o => o.prioridad === 'URGENTE' && o.estado !== 'ENTREGADO').length;
    const statsData = STATUS_STATS.map(s => ({
        ...s,
        count: orders.filter(o => o.estado === s.estado).length,
    }));

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in">
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0B1220] tracking-tight">Dashboard</h1>
                        <p className="text-sm text-[rgba(11,18,32,0.50)] mt-0.5">
                            {orders.length} órdenes activas
                            {urgentes > 0 && (
                                <span className="ml-2 inline-flex items-center gap-1 text-[#EF4444] font-medium">
                                    <AlertTriangle className="w-3 h-3" /> {urgentes} urgentes
                                </span>
                            )}
                        </p>
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
                        className="card-sm text-center">
                        <p className="text-3xl font-bold text-[#0B1220]">{orders.length}</p>
                        <p className="text-xs text-[rgba(11,18,32,0.45)] mt-1 font-medium">Total Activas</p>
                    </motion.div>
                    {statsData.map((s, i) => (
                        <motion.div key={s.estado}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (i + 1) * 0.05 }}
                            className="card-sm text-center">
                            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.count}</p>
                            <p className="text-xs text-[rgba(11,18,32,0.45)] mt-1 font-medium">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Kanban */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-7 h-7 text-[#FF5100] animate-spin" />
                    </div>
                ) : error ? (
                    <div className="card flex flex-col items-center justify-center py-12 gap-3">
                        <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
                        <p className="text-sm text-[rgba(11,18,32,0.55)]">{error}</p>
                        <button onClick={refetch} className="btn-secondary text-sm">Reintentar</button>
                    </div>
                ) : (
                    <KanbanBoard orders={orders} />
                )}
            </div>
        </AdminLayout>
    );
}
