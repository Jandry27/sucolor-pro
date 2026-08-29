import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Printer,
    Download,
    Loader2,
    Car,
    AlertTriangle,
    Clock,
    ExternalLink,
} from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    formatearFecha,
    calcularDiasEntre,
    exportarCSV,
    imprimirReporte,
    ESTADO_LABELS,
    ESTADO_COLORS,
} from '@/biblioteca/utilidadesReporte';
import { EncabezadoImpresion } from '@/componentes/administracion/reportes/EncabezadoImpresion';
import type { OrderStatus } from '@/tipos';

interface OrdenEnTaller {
    id: string;
    codigo: string;
    estado: OrderStatus;
    prioridad: string;
    fecha_ingreso: string;
    fecha_estimada: string | null;
    cliente_nombre: string;
    vehiculo_placa: string;
    vehiculo_marca: string;
    vehiculo_modelo: string;
    dias_en_taller: number;
}

export function ReporteVehiculosTaller() {
    const [ordenes, setOrdenes] = useState<OrdenEnTaller[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            // Obtener órdenes activas (no ENTREGADO)
            const { data: ordenesData } = await supabase
                .from('ordenes')
                .select('id, codigo, estado, prioridad, fecha_ingreso, fecha_estimada, cliente_id, vehiculo_id')
                .neq('estado', 'ENTREGADO')
                .order('fecha_ingreso', { ascending: true });

            if (!ordenesData || ordenesData.length === 0) {
                setOrdenes([]);
                setLoading(false);
                return;
            }

            // Batch fetch clientes y vehículos
            const clienteIds = [...new Set(ordenesData.map(o => o.cliente_id).filter(Boolean))];
            const vehiculoIds = [...new Set(ordenesData.map(o => o.vehiculo_id).filter(Boolean))];

            const [{ data: clientes }, { data: vehiculos }] = await Promise.all([
                clienteIds.length > 0
                    ? supabase.from('clientes').select('id, nombres').in('id', clienteIds)
                    : { data: [] },
                vehiculoIds.length > 0
                    ? supabase.from('vehiculos').select('id, placa, marca, modelo').in('id', vehiculoIds)
                    : { data: [] },
            ]);

            const clienteMap = Object.fromEntries((clientes ?? []).map(c => [c.id, c.nombres]));
            const vehiculoMap = Object.fromEntries((vehiculos ?? []).map(v => [v.id, v]));

            const merged: OrdenEnTaller[] = ordenesData.map(o => {
                const v = vehiculoMap[o.vehiculo_id] || {};
                return {
                    id: o.id,
                    codigo: o.codigo,
                    estado: o.estado,
                    prioridad: o.prioridad,
                    fecha_ingreso: o.fecha_ingreso,
                    fecha_estimada: o.fecha_estimada,
                    cliente_nombre: clienteMap[o.cliente_id] || '—',
                    vehiculo_placa: v.placa || '—',
                    vehiculo_marca: v.marca || '—',
                    vehiculo_modelo: v.modelo || '',
                    dias_en_taller: calcularDiasEntre(o.fecha_ingreso),
                };
            });

            // Ordenar por más días en taller primero
            merged.sort((a, b) => b.dias_en_taller - a.dias_en_taller);
            setOrdenes(merged);
            setLoading(false);
        })();
    }, []);

    const stats = useMemo(() => {
        const total = ordenes.length;
        const urgentes = ordenes.filter(o => o.prioridad === 'URGENTE').length;
        const promDias = total > 0 ? Math.round(ordenes.reduce((s, o) => s + o.dias_en_taller, 0) / total) : 0;
        return { total, urgentes, promDias };
    }, [ordenes]);

    const handleCSV = () => {
        exportarCSV(
            ['Placa', 'Vehículo', 'Cliente', 'Estado', 'Prioridad', 'Fecha Ingreso', 'Días en Taller'],
            ordenes.map(o => [
                o.vehiculo_placa,
                `${o.vehiculo_marca} ${o.vehiculo_modelo}`,
                o.cliente_nombre,
                ESTADO_LABELS[o.estado] || o.estado,
                o.prioridad,
                formatearFecha(o.fecha_ingreso),
                o.dias_en_taller,
            ]),
            `Vehiculos_En_Taller_${new Date().toISOString().slice(0, 10)}`
        );
    };

    return (
        <div className="space-y-6 animate-fade-in print:space-y-4">
            {/* Print Header Profesional */}
            <EncabezadoImpresion
                titulo="Vehículos en Taller"
                subtitulo={`${ordenes.length} vehículos activos`}
                infoExtra={[
                    `${stats.urgentes} urgentes · Promedio ${stats.promDias} días`,
                ]}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <p className="text-sm text-[rgba(15,23,42,0.60)]">
                    Todos los vehículos con órdenes activas en las instalaciones.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={imprimirReporte} className="btn-secondary text-sm">
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    <button
                        onClick={handleCSV}
                        className="btn-primary text-sm"
                        disabled={ordenes.length === 0}
                    >
                        <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card flex items-center gap-4 !p-5"
                >
                    <div className="w-11 h-11 rounded-xl bg-[rgba(249,115,22,0.10)] flex items-center justify-center">
                        <Car className="w-5 h-5 text-[#F97316]" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider">
                            En Taller
                        </p>
                        <p className="text-2xl font-black text-[#0F172A] leading-none mt-1">
                            {stats.total}
                        </p>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className={`glass-card flex items-center gap-4 !p-5 ${stats.urgentes > 0 ? 'bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.15)]' : ''}`}
                >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stats.urgentes > 0 ? 'bg-[#EF4444] text-white shadow-lg shadow-red-500/20' : 'bg-slate-200/50'}`}>
                        <AlertTriangle className={`w-5 h-5 ${stats.urgentes > 0 ? '' : 'text-[rgba(11,18,32,0.40)]'}`} />
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${stats.urgentes > 0 ? 'text-[#EF4444]' : 'text-[rgba(15,23,42,0.50)]'}`}>
                            Urgentes
                        </p>
                        <p className={`text-2xl font-black leading-none mt-1 ${stats.urgentes > 0 ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
                            {stats.urgentes}
                        </p>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card flex items-center gap-4 !p-5"
                >
                    <div className="w-11 h-11 rounded-xl bg-[rgba(99,102,241,0.10)] flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[#6366F1]" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider">
                            Promedio Días
                        </p>
                        <p className="text-2xl font-black text-[#6366F1] leading-none mt-1">
                            {stats.promDias}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Tabla */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
                </div>
            ) : ordenes.length === 0 ? (
                <div className="glass-card flex flex-col items-center py-14 gap-3">
                    <Car className="w-8 h-8 text-[rgba(11,18,32,0.20)]" />
                    <p className="text-sm text-[rgba(11,18,32,0.40)]">
                        No hay vehículos en taller actualmente 🎉
                    </p>
                </div>
            ) : (
                <div className="glass-card overflow-hidden p-0 print:border-none print:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#F8FAFC] border-b border-slate-200/50 print:bg-transparent">
                                <tr>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">
                                        Placa
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">
                                        Vehículo
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">
                                        Cliente
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">
                                        Estado
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">
                                        Ingreso
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)] text-center">
                                        Días
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)] text-center">
                                        Prioridad
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenes.map(o => {
                                    const colors = ESTADO_COLORS[o.estado] || {
                                        bg: 'bg-gray-100',
                                        text: 'text-gray-600',
                                    };
                                    const diasAlerta = o.dias_en_taller >= 15;
                                    return (
                                        <tr
                                            key={o.id}
                                            className={`border-b border-[rgba(15,23,42,0.04)] hover:bg-[rgba(249,115,22,0.02)] transition-colors print:border-b-gray-200 group ${diasAlerta ? 'bg-[rgba(239,68,68,0.02)]' : ''}`}
                                        >
                                            <td className="px-5 py-3">
                                                <Link
                                                    to={`/administracion/orders/${o.id}`}
                                                    className="inline-flex items-center gap-1.5 group/link"
                                                >
                                                    <Car className="w-3.5 h-3.5 text-[#F97316]" />
                                                    <span className="font-mono-code font-bold text-[#F97316] hover:text-[#C2550D] transition-colors">
                                                        {o.vehiculo_placa}
                                                    </span>
                                                    <ExternalLink className="w-3 h-3 text-[rgba(11,18,32,0.20)] opacity-0 group-hover/link:opacity-100 transition-opacity print:hidden" />
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3 text-[rgba(11,18,32,0.70)]">
                                                {o.vehiculo_marca}{' '}
                                                <span className="text-[rgba(11,18,32,0.40)]">
                                                    {o.vehiculo_modelo}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-medium text-[#0F172A]">
                                                {o.cliente_nombre}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}
                                                >
                                                    {ESTADO_LABELS[o.estado] || o.estado}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-[rgba(11,18,32,0.60)]">
                                                {formatearFecha(o.fecha_ingreso)}
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                                        diasAlerta
                                                            ? 'bg-red-100 text-red-700'
                                                            : o.dias_en_taller >= 7
                                                              ? 'bg-yellow-100 text-yellow-700'
                                                              : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    <Clock className="w-3 h-3" />
                                                    {o.dias_en_taller}d
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                {o.prioridad === 'URGENTE' ? (
                                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 animate-pulse">
                                                        🔥 URGENTE
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-[rgba(11,18,32,0.40)]">
                                                        Normal
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
