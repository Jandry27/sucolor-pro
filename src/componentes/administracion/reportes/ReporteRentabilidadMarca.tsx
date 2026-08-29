import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Printer,
    Download,
    Loader2,
    BarChart3,
    TrendingUp,
    Calendar,
} from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    exportarCSV,
    imprimirReporte,
    formatearMoneda,
    MESES,
} from '@/biblioteca/utilidadesReporte';
import { EncabezadoImpresion } from '@/componentes/administracion/reportes/EncabezadoImpresion';

interface MarcaStats {
    marca: string;
    totalOrdenes: number;
    totalIngresos: number;
    promedioPorOrden: number;
    porcentaje: number; // del total de ingresos (para barra)
}

export function ReporteRentabilidadMarca() {
    const [data, setData] = useState<MarcaStats[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros de fecha
    const [mesDesde, setMesDesde] = useState(0); // Enero
    const [mesHasta, setMesHasta] = useState(new Date().getMonth());
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);

    useEffect(() => {
        (async () => {
            setLoading(true);

            // Obtener órdenes entregadas
            const { data: ordenes } = await supabase
                .from('ordenes')
                .select('id, precio_total, monto_pagado, updated_at, vehiculo_id')
                .eq('estado', 'ENTREGADO');

            if (!ordenes || ordenes.length === 0) {
                setData([]);
                setLoading(false);
                return;
            }

            // Calcular años disponibles
            const years = new Set(ordenes.map(o => new Date(o.updated_at).getFullYear()));
            setAvailableYears(Array.from(years).sort((a, b) => b - a));

            // Obtener vehículos
            const vehiculoIds = [...new Set(ordenes.map(o => o.vehiculo_id).filter(Boolean))];
            const { data: vehiculos } = vehiculoIds.length > 0
                ? await supabase.from('vehiculos').select('id, marca').in('id', vehiculoIds)
                : { data: [] };

            const vehiculoMap = Object.fromEntries(
                (vehiculos ?? []).map(v => [v.id, v.marca || 'Sin Marca'])
            );

            // Filtrar por rango de fechas
            const filtradas = ordenes.filter(o => {
                const d = new Date(o.updated_at);
                return d.getFullYear() === anio && d.getMonth() >= mesDesde && d.getMonth() <= mesHasta;
            });

            // Agrupar por marca
            const grouped: Record<string, { total: number; ingresos: number }> = {};
            filtradas.forEach(o => {
                const marca = vehiculoMap[o.vehiculo_id] || 'Sin Marca';
                if (!grouped[marca]) grouped[marca] = { total: 0, ingresos: 0 };
                grouped[marca].total++;
                grouped[marca].ingresos += o.precio_total || o.monto_pagado || 0;
            });

            const totalGlobal = Object.values(grouped).reduce((s, g) => s + g.ingresos, 0);

            const stats: MarcaStats[] = Object.entries(grouped)
                .map(([marca, g]) => ({
                    marca,
                    totalOrdenes: g.total,
                    totalIngresos: g.ingresos,
                    promedioPorOrden: g.total > 0 ? g.ingresos / g.total : 0,
                    porcentaje: totalGlobal > 0 ? (g.ingresos / totalGlobal) * 100 : 0,
                }))
                .sort((a, b) => b.totalIngresos - a.totalIngresos);

            setData(stats);
            setLoading(false);
        })();
    }, [mesDesde, mesHasta, anio]);

    const totales = useMemo(() => {
        return {
            ordenes: data.reduce((s, d) => s + d.totalOrdenes, 0),
            ingresos: data.reduce((s, d) => s + d.totalIngresos, 0),
            marcas: data.length,
        };
    }, [data]);

    const maxIngresos = useMemo(() => {
        return data.length > 0 ? Math.max(...data.map(d => d.totalIngresos)) : 1;
    }, [data]);

    // Colores para las barras — paleta vibrante
    const barColors = [
        '#F97316', '#6366F1', '#16A34A', '#EAB308', '#EC4899',
        '#14B8A6', '#8B5CF6', '#F43F5E', '#0EA5E9', '#D97706',
    ];

    const handleCSV = () => {
        exportarCSV(
            ['Marca', 'Total Órdenes', 'Ingresos Totales', 'Promedio por Orden', '% del Total'],
            data.map(d => [
                d.marca,
                d.totalOrdenes,
                d.totalIngresos.toFixed(2),
                d.promedioPorOrden.toFixed(2),
                d.porcentaje.toFixed(1) + '%',
            ]),
            `Rentabilidad_Marca_${anio}_${MESES[mesDesde]}-${MESES[mesHasta]}`
        );
    };

    const rangoLabel = mesDesde === mesHasta
        ? `${MESES[mesDesde]} ${anio}`
        : `${MESES[mesDesde]} - ${MESES[mesHasta]} ${anio}`;

    return (
        <div className="space-y-6 animate-fade-in print:space-y-4">
            {/* Print Header Profesional */}
            <EncabezadoImpresion
                titulo="Rentabilidad por Marca"
                subtitulo={rangoLabel}
                infoExtra={[
                    `${totales.marcas} marcas · ${totales.ordenes} órdenes · ${formatearMoneda(totales.ingresos)} total`,
                ]}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <p className="text-sm text-[rgba(15,23,42,0.60)]">
                    Ingresos agrupados por marca de vehículo en órdenes entregadas.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={imprimirReporte} className="btn-secondary text-sm">
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    <button
                        onClick={handleCSV}
                        className="btn-primary text-sm"
                        disabled={data.length === 0}
                    >
                        <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="glass-card flex flex-col sm:flex-row gap-4 items-end print:hidden !p-5">
                <div className="w-full sm:w-auto">
                    <label className="form-label">Desde</label>
                    <select
                        value={mesDesde}
                        onChange={e => {
                            const v = Number(e.target.value);
                            setMesDesde(v);
                            if (v > mesHasta) setMesHasta(v);
                        }}
                        className="input-field"
                    >
                        {MESES.map((m, i) => (
                            <option key={m} value={i}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full sm:w-auto">
                    <label className="form-label">Hasta</label>
                    <select
                        value={mesHasta}
                        onChange={e => setMesHasta(Number(e.target.value))}
                        className="input-field"
                    >
                        {MESES.map((m, i) => (
                            <option key={m} value={i} disabled={i < mesDesde}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full sm:w-auto">
                    <label className="form-label">Año</label>
                    <select
                        value={anio}
                        onChange={e => setAnio(Number(e.target.value))}
                        className="input-field"
                    >
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
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
                        <BarChart3 className="w-5 h-5 text-[#F97316]" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider">
                            Marcas
                        </p>
                        <p className="text-2xl font-black text-[#0F172A] leading-none mt-1">
                            {totales.marcas}
                        </p>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="glass-card flex items-center gap-4 !p-5"
                >
                    <div className="w-11 h-11 rounded-xl bg-[rgba(99,102,241,0.10)] flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#6366F1]" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider">
                            Total Órdenes
                        </p>
                        <p className="text-2xl font-black text-[#6366F1] leading-none mt-1">
                            {totales.ordenes}
                        </p>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card flex items-center gap-4 bg-[rgba(22,163,74,0.04)] border-[rgba(22,163,74,0.15)] !p-5"
                >
                    <div className="w-11 h-11 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                            Ingresos Período
                        </p>
                        <p className="text-2xl font-black text-[#16A34A] leading-none mt-1">
                            {formatearMoneda(totales.ingresos)}
                        </p>
                    </div>
                </motion.div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
                </div>
            ) : data.length === 0 ? (
                <div className="glass-card flex flex-col items-center py-14 gap-3">
                    <BarChart3 className="w-8 h-8 text-[rgba(11,18,32,0.20)]" />
                    <p className="text-sm text-[rgba(11,18,32,0.40)]">
                        No hay datos para el período seleccionado
                    </p>
                </div>
            ) : (
                <>
                    {/* Gráfico de barras horizontal */}
                    <div className="glass-card !p-6 print:border-none print:shadow-none">
                        <h3 className="text-sm font-bold text-[#0F172A] mb-5 uppercase tracking-wider">
                            Ingresos por Marca
                        </h3>
                        <div className="space-y-4">
                            {data.map((d, i) => (
                                <motion.div
                                    key={d.marca}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ background: barColors[i % barColors.length] }}
                                            />
                                            <span className="text-sm font-semibold text-[#0F172A]">
                                                {d.marca}
                                            </span>
                                            <span className="text-xs text-[rgba(11,18,32,0.40)]">
                                                ({d.totalOrdenes} {d.totalOrdenes === 1 ? 'orden' : 'órdenes'})
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-[#16A34A]">
                                            {formatearMoneda(d.totalIngresos)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-[rgba(15,23,42,0.05)] rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(d.totalIngresos / maxIngresos) * 100}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{
                                                background: `linear-gradient(90deg, ${barColors[i % barColors.length]}, ${barColors[i % barColors.length]}dd)`,
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Tabla detallada */}
                    <div className="glass-card overflow-hidden p-0 print:border-none print:shadow-none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-[#F8FAFC] border-b border-slate-200/50 print:bg-transparent">
                                    <tr>
                                        <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">
                                            Marca
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)] text-center">
                                            Órdenes
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)] text-right">
                                            Ingresos
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)] text-right">
                                            Promedio/Orden
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)] text-right">
                                            % del Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((d, i) => (
                                        <tr
                                            key={d.marca}
                                            className="border-b border-[rgba(15,23,42,0.04)] hover:bg-[rgba(249,115,22,0.02)] transition-colors print:border-b-gray-200"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ background: barColors[i % barColors.length] }}
                                                    />
                                                    <span className="font-semibold text-[#0F172A]">
                                                        {d.marca}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center font-bold text-[#0F172A]">
                                                {d.totalOrdenes}
                                            </td>
                                            <td className="px-5 py-3 text-right font-black text-[#16A34A]">
                                                {formatearMoneda(d.totalIngresos)}
                                            </td>
                                            <td className="px-5 py-3 text-right font-semibold text-[rgba(11,18,32,0.70)]">
                                                {formatearMoneda(d.promedioPorOrden)}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[rgba(99,102,241,0.08)] text-[#6366F1] text-xs font-bold">
                                                    {d.porcentaje.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-[#F8FAFC] border-t-2 border-[rgba(15,23,42,0.07)] print:bg-transparent print:border-t-2 print:border-gray-800">
                                    <tr>
                                        <td className="px-5 py-4 font-bold text-[#0F172A] uppercase tracking-wider text-xs">
                                            Totales
                                        </td>
                                        <td className="px-5 py-4 text-center font-bold text-[#0F172A]">
                                            {totales.ordenes}
                                        </td>
                                        <td className="px-5 py-4 text-right font-black text-xl text-[#16A34A]">
                                            {formatearMoneda(totales.ingresos)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold text-[rgba(11,18,32,0.60)]">
                                            {totales.ordenes > 0
                                                ? formatearMoneda(totales.ingresos / totales.ordenes)
                                                : '—'}
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold text-[#6366F1]">
                                            100%
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
