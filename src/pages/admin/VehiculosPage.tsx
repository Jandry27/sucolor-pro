import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertTriangle, Car, ChevronRight, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { VehicleHistoryDrawer } from '@/components/admin/VehicleHistoryDrawer';
import type { Vehiculo } from '@/types';

interface VehiculoRow extends Vehiculo { id: string; created_at?: string; }

export function VehiculosPage() {
    const [vehiculos, setVehiculos] = useState<VehiculoRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');
    const [selected, setSelected] = useState<VehiculoRow | null>(null);

    useEffect(() => {
        supabase.from('vehiculos').select('*').order('created_at', { ascending: false })
            .then(({ data, error: err }) => {
                if (err) setError('No se pudo cargar los vehículos.');
                else setVehiculos(data ?? []);
                setLoading(false);
            });
    }, []);

    const filtered = vehiculos.filter(v => {
        const s = q.toLowerCase();
        return v.placa?.toLowerCase().includes(s) || v.marca?.toLowerCase().includes(s) || v.modelo?.toLowerCase().includes(s);
    });

    const handleDelete = async (id: string, placa: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el vehículo con placa "${placa}"?\nEsta acción es irreversible y eliminará sus órdenes asociadas.`)) {
            return;
        }

        try {
            const { error } = await supabase.from('vehiculos').delete().eq('id', id);
            if (error) throw error;
            setVehiculos(prev => prev.filter(v => v.id !== id));
            if (selected?.id === id) setSelected(null);
        } catch (err: any) {
            alert('Error al eliminar vehículo: ' + (err.message || 'Error desconocido'));
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-5 animate-fade-in">
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0B1220] tracking-tight">Vehículos</h1>
                        <p className="text-sm text-[rgba(11,18,32,0.50)] mt-0.5">{vehiculos.length} registrados</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(11,18,32,0.30)] pointer-events-none" />
                        <input value={q} onChange={e => setQ(e.target.value)}
                            placeholder="Placa, marca, modelo..." className="input-field pl-9 text-sm w-full sm:w-64" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center h-48 items-center">
                        <Loader2 className="w-7 h-7 text-[#FF5100] animate-spin" />
                    </div>
                ) : error ? (
                    <div className="card flex flex-col items-center py-12 gap-3">
                        <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
                        <p className="text-sm text-[rgba(11,18,32,0.55)]">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* ── Vista Desktop (Tabla) ── */}
                        <div className="card hidden sm:block" style={{ padding: 0, overflow: 'hidden' }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[rgba(15,23,42,0.07)] bg-[#F7F8FA]">
                                        {['Placa', 'Marca', 'Modelo', 'Año', 'Color', ''].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-bold text-[rgba(11,18,32,0.45)] uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((v, i) => (
                                        <motion.tr
                                            key={v.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            onClick={() => setSelected(v)}
                                            className="border-b border-[rgba(15,23,42,0.05)] hover:bg-[rgba(255,81,0,0.04)] transition-colors last:border-0 cursor-pointer group"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Car className="w-3.5 h-3.5 text-[#FF5100]" />
                                                    <span className="font-mono-code font-semibold text-[#0B1220] text-xs">{v.placa}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-[rgba(11,18,32,0.70)]">{v.marca}</td>
                                            <td className="px-4 py-3 text-[rgba(11,18,32,0.55)]">{v.modelo}</td>
                                            <td className="px-4 py-3 text-[rgba(11,18,32,0.55)]">{v.anio}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full border border-[rgba(15,23,42,0.15)]"
                                                        style={{
                                                            background: v.color?.toLowerCase() === 'blanco' ? '#f9fafb'
                                                                : v.color?.toLowerCase() === 'negro' ? '#111827'
                                                                    : v.color?.toLowerCase() === 'rojo' ? '#ef4444'
                                                                        : v.color?.toLowerCase() === 'azul' ? '#3b82f6'
                                                                            : v.color?.toLowerCase() === 'verde' ? '#22c55e'
                                                                                : '#9ca3af'
                                                        }} />
                                                    <span className="text-[rgba(11,18,32,0.55)]">{v.color}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="inline-flex items-center gap-1 text-xs text-[rgba(11,18,32,0.30)] group-hover:text-[#FF5100] transition-colors font-medium">
                                                        Ver historial
                                                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(v.id, v.placa); }}
                                                        className="p-1.5 text-[rgba(11,18,32,0.30)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Eliminar Vehículo"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Vista Móvil (Tarjetas) ── */}
                        <div className="grid grid-cols-1 gap-3 sm:hidden">
                            {filtered.map((v, i) => (
                                <motion.div
                                    key={v.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => setSelected(v)}
                                    className="card-hover relative cursor-pointer group"
                                    style={{ padding: '16px' }}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <Car className="w-4 h-4 text-[#FF5100]" />
                                            <span className="font-mono-code font-bold text-[#FF5100] text-sm">{v.placa}</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(v.id, v.placa); }}
                                            className="p-1.5 text-[rgba(11,18,32,0.30)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar Vehículo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="mb-3">
                                        <p className="font-semibold text-[#0B1220] text-base leading-tight">
                                            {v.marca} <span className="text-[rgba(11,18,32,0.60)] font-medium">{v.modelo}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-[rgba(15,23,42,0.06)] mt-auto">
                                        <div className="flex items-center gap-3 text-xs text-[rgba(11,18,32,0.55)]">
                                            <span>{v.anio}</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full border border-[rgba(15,23,42,0.15)]"
                                                    style={{
                                                        background: v.color?.toLowerCase() === 'blanco' ? '#f9fafb'
                                                            : v.color?.toLowerCase() === 'negro' ? '#111827'
                                                                : v.color?.toLowerCase() === 'rojo' ? '#ef4444'
                                                                    : v.color?.toLowerCase() === 'azul' ? '#3b82f6'
                                                                        : v.color?.toLowerCase() === 'verde' ? '#22c55e'
                                                                            : '#9ca3af'
                                                    }} />
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-xs text-[#FF5100] font-medium">
                                            Ver historial
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* ── Empty State ── */}
                        {filtered.length === 0 && (
                            <div className="card flex flex-col items-center py-14 gap-3 border-0 shadow-none bg-transparent">
                                <Car className="w-8 h-8 text-[rgba(11,18,32,0.20)]" />
                                <p className="text-sm text-[rgba(11,18,32,0.40)]">No se encontraron vehículos</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Drawer de historial */}
            <VehicleHistoryDrawer
                vehiculo={selected}
                onClose={() => setSelected(null)}
            />
        </AdminLayout>
    );
}
