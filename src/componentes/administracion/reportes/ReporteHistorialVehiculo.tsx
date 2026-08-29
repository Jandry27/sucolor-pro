import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Search,
    Loader2,
    Printer,
    Download,
    Car,
    Calendar,
    DollarSign,
    Hash,
    ClipboardList,
    ExternalLink,
    Wrench,
    FileText,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    formatearFecha,
    exportarCSV,
    imprimirReporte,
    ESTADO_LABELS,
    ESTADO_COLORS,
    formatearMoneda,
} from '@/biblioteca/utilidadesReporte';
import { EncabezadoImpresion } from '@/componentes/administracion/reportes/EncabezadoImpresion';
import type { OrderStatus, CompanySettings } from '@/tipos';

interface VehiculoRow {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    anio: number;
    color: string;
}

interface GastoDetalle {
    descripcion: string;
    monto: number;
}

interface OrdenConDetalles {
    id: string;
    codigo: string;
    estado: OrderStatus;
    fecha_ingreso: string;
    fecha_estimada: string | null;
    notas_publicas: string | null;
    notas_internas: string | null;
    precio_total: number | null;
    monto_pagado: number | null;
    updated_at: string;
    cliente_nombre: string;
    gastos: GastoDetalle[];
    total_gastos: number;
}

export function ReporteHistorialVehiculo() {
    const [vehiculos, setVehiculos] = useState<VehiculoRow[]>([]);
    const [loadingVehiculos, setLoadingVehiculos] = useState(true);
    const [selected, setSelected] = useState<VehiculoRow | null>(null);
    const [ordenes, setOrdenes] = useState<OrdenConDetalles[]>([]);
    const [loadingOrdenes, setLoadingOrdenes] = useState(false);
    const [q, setQ] = useState('');
    const [expandedOrden, setExpandedOrden] = useState<string | null>(null);
    const [empresa, setEmpresa] = useState<Partial<CompanySettings> | null>(null);

    // Cargar datos de la empresa para el encabezado de impresión
    useEffect(() => {
        supabase
            .from('company_settings')
            .select('ruc, razon_social, nombre_comercial, direccion_matriz')
            .limit(1)
            .maybeSingle()
            .then(({ data }) => {
                if (data) setEmpresa(data);
            });
    }, []);

    // Cargar lista de vehículos
    useEffect(() => {
        supabase
            .from('vehiculos')
            .select('id, placa, marca, modelo, anio, color')
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                setVehiculos(data ?? []);
                setLoadingVehiculos(false);
            });
    }, []);

    // Cargar órdenes + gastos + notas cuando se selecciona vehículo
    useEffect(() => {
        if (!selected) {
            setOrdenes([]);
            setExpandedOrden(null);
            return;
        }
        setLoadingOrdenes(true);

        (async () => {
            // Paso 1: Obtener órdenes del vehículo (incluye notas_internas)
            const { data: ordenesData } = await supabase
                .from('ordenes')
                .select('id, codigo, estado, fecha_ingreso, fecha_estimada, notas_publicas, notas_internas, precio_total, monto_pagado, updated_at, cliente_id')
                .eq('vehiculo_id', selected.id)
                .order('fecha_ingreso', { ascending: false });

            if (!ordenesData || ordenesData.length === 0) {
                setOrdenes([]);
                setLoadingOrdenes(false);
                return;
            }

            // Paso 2: Obtener clientes
            const clienteIds = [...new Set(ordenesData.map(o => o.cliente_id).filter(Boolean))];
            const { data: clientes } = clienteIds.length > 0
                ? await supabase.from('clientes').select('id, nombres').in('id', clienteIds)
                : { data: [] };
            const clienteMap = Object.fromEntries((clientes ?? []).map(c => [c.id, c.nombres]));

            // Paso 3: Obtener gastos/repuestos de todas las órdenes
            const ordenIds = ordenesData.map(o => o.id);
            const { data: gastosData } = await supabase
                .from('orden_gastos')
                .select('orden_id, descripcion, monto')
                .in('orden_id', ordenIds)
                .order('created_at', { ascending: true });

            const gastosMap: Record<string, GastoDetalle[]> = {};
            (gastosData ?? []).forEach(g => {
                if (!gastosMap[g.orden_id]) gastosMap[g.orden_id] = [];
                gastosMap[g.orden_id].push({ descripcion: g.descripcion, monto: g.monto });
            });

            // Paso 4: Merge
            const merged: OrdenConDetalles[] = ordenesData.map(o => {
                const gastos = gastosMap[o.id] || [];
                return {
                    ...o,
                    cliente_nombre: clienteMap[o.cliente_id] || '—',
                    gastos,
                    total_gastos: gastos.reduce((sum, g) => sum + g.monto, 0),
                };
            });

            setOrdenes(merged);
            setLoadingOrdenes(false);
        })();
    }, [selected]);

    const filteredVehiculos = useMemo(() => {
        if (!q) return vehiculos;
        const s = q.toLowerCase();
        return vehiculos.filter(
            v =>
                v.placa?.toLowerCase().includes(s) ||
                v.marca?.toLowerCase().includes(s) ||
                v.modelo?.toLowerCase().includes(s)
        );
    }, [vehiculos, q]);

    const resumen = useMemo(() => {
        if (ordenes.length === 0) return { totalVisitas: 0, totalGastado: 0, totalGastos: 0 };
        return {
            totalVisitas: ordenes.length,
            totalGastado: ordenes.reduce((s, o) => s + (o.precio_total || o.monto_pagado || 0), 0),
            totalGastos: ordenes.reduce((s, o) => s + o.total_gastos, 0),
        };
    }, [ordenes]);

    const handleCSV = () => {
        if (!selected || ordenes.length === 0) return;
        exportarCSV(
            ['Código', 'Estado', 'Fecha Ingreso', 'Fecha Estimada', 'Cliente', 'Trabajos Realizados', 'Repuestos/Gastos', 'Precio Total'],
            ordenes.map(o => [
                o.codigo,
                ESTADO_LABELS[o.estado] || o.estado,
                formatearFecha(o.fecha_ingreso),
                formatearFecha(o.fecha_estimada),
                o.cliente_nombre,
                (o.notas_publicas || '').replace(/\n/g, ' | '),
                o.gastos.map(g => `${g.descripcion} ($${g.monto.toFixed(2)})`).join('; ') || 'Sin gastos',
                (o.precio_total || o.monto_pagado || 0).toFixed(2),
            ]),
            `Historial_${selected.placa}_${new Date().toISOString().slice(0, 10)}`
        );
    };

    const toggleExpand = (id: string) => {
        setExpandedOrden(prev => (prev === id ? null : id));
    };

    return (
        <div className="space-y-6 animate-fade-in print:space-y-2">
            {/* ══════════════════════════════════════════════════════════════════
                ENCABEZADO PROFESIONAL DE IMPRESIÓN
                Solo visible al imprimir — incluye logo, RUC, dirección, etc.
               ══════════════════════════════════════════════════════════════════ */}
            <EncabezadoImpresion
                titulo="Historial de Servicios"
                subtitulo={`Vehículo: ${selected?.placa}`}
                infoExtra={[
                    `${selected?.marca} ${selected?.modelo} (${selected?.anio}) · ${selected?.color}`,
                    `Resumen: ${resumen.totalVisitas} visitas · ${formatearMoneda(resumen.totalGastos)} gastos · ${formatearMoneda(resumen.totalGastado)} cobrado`,
                ]}
            />

            {/* ══════════════════════════════════════════════════════════════════
                SELECTOR DE VEHÍCULO (solo pantalla, no impresión)
               ══════════════════════════════════════════════════════════════════ */}
            {!selected ? (
                <div className="print:hidden">
                    <p className="text-sm text-[rgba(15,23,42,0.60)] mb-4">
                        Selecciona un vehículo para ver su historial completo de servicios.
                    </p>

                    {/* Buscador */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(11,18,32,0.30)] pointer-events-none" />
                        <input
                            type="text"
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Buscar por placa, marca o modelo..."
                            className="input-field pl-10 w-full"
                        />
                    </div>

                    {loadingVehiculos ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
                        </div>
                    ) : filteredVehiculos.length === 0 ? (
                        <div className="glass-card flex flex-col items-center py-12 gap-3">
                            <Car className="w-8 h-8 text-[rgba(11,18,32,0.20)]" />
                            <p className="text-sm text-[rgba(11,18,32,0.40)]">
                                No se encontraron vehículos
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredVehiculos.map((v, i) => (
                                <motion.button
                                    key={v.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    onClick={() => setSelected(v)}
                                    className="glass-card text-left !p-4 hover:border-[rgba(249,115,22,0.30)] hover:shadow-premium transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Car className="w-4 h-4 text-[#F97316]" />
                                        <span className="font-mono-code font-bold text-[#F97316] text-sm">
                                            {v.placa}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-[#0F172A] text-sm">
                                        {v.marca}{' '}
                                        <span className="text-[rgba(11,18,32,0.55)] font-normal">
                                            {v.modelo}
                                        </span>
                                    </p>
                                    <p className="text-xs text-[rgba(11,18,32,0.40)] mt-0.5">
                                        {v.anio} · {v.color}
                                    </p>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* ══════════════════════════════════════════════════════════════
                        HEADER CON INFO DEL VEHÍCULO (solo pantalla)
                       ══════════════════════════════════════════════════════════════ */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelected(null)}
                                className="btn-ghost text-sm"
                            >
                                ← Cambiar vehículo
                            </button>
                            <div className="h-6 w-px bg-[rgba(15,23,42,0.10)]" />
                            <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-[#F97316]" />
                                <span className="font-mono-code font-bold text-[#F97316]">
                                    {selected.placa}
                                </span>
                                <span className="text-sm text-[rgba(11,18,32,0.60)]">
                                    {selected.marca} {selected.modelo} ({selected.anio})
                                </span>
                            </div>
                        </div>
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

                    {/* KPIs (pantalla y impresión — en impresión ya están en el header) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card flex items-center gap-4 !p-5"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[rgba(249,115,22,0.10)] flex items-center justify-center">
                                <Hash className="w-5 h-5 text-[#F97316]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider">
                                    Total Visitas
                                </p>
                                <p className="text-2xl font-black text-[#0F172A] leading-none mt-1">
                                    {resumen.totalVisitas}
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.05 }}
                            className="glass-card flex items-center gap-4 bg-[rgba(22,163,74,0.04)] border-[rgba(22,163,74,0.15)] !p-5"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                                    Total Cobrado
                                </p>
                                <p className="text-2xl font-black text-[#16A34A] leading-none mt-1">
                                    {formatearMoneda(resumen.totalGastado)}
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card flex items-center gap-4 !p-5"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[rgba(239,68,68,0.10)] flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-[#EF4444]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider">
                                    Total en Gastos/Repuestos
                                </p>
                                <p className="text-2xl font-black text-[#EF4444] leading-none mt-1">
                                    {formatearMoneda(resumen.totalGastos)}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════
                        DETALLE DE ÓRDENES — con trabajos realizados expandibles
                       ══════════════════════════════════════════════════════════════ */}
                    {loadingOrdenes ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
                        </div>
                    ) : ordenes.length === 0 ? (
                        <div className="glass-card flex flex-col items-center py-14 gap-3">
                            <ClipboardList className="w-8 h-8 text-[rgba(11,18,32,0.20)]" />
                            <p className="text-sm text-[rgba(11,18,32,0.40)]">
                                Este vehículo aún no tiene órdenes registradas
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 print:space-y-6">
                            {ordenes.map((o, i) => {
                                const colors = ESTADO_COLORS[o.estado] || {
                                    bg: 'bg-gray-100',
                                    text: 'text-gray-600',
                                };
                                const visitaNum = ordenes.length - i;
                                const isExpanded = expandedOrden === o.id;
                                const hasDetalles = o.notas_publicas || o.gastos.length > 0;

                                return (
                                    <motion.div
                                        key={o.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="glass-card !p-0 overflow-hidden print:break-inside-avoid print:border print:border-gray-200 print:shadow-none print:rounded-lg"
                                    >
                                        {/* Fila principal de la orden */}
                                        <div
                                            className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 ${hasDetalles ? 'cursor-pointer hover:bg-[rgba(15,23,42,0.015)] transition-colors' : ''} print:cursor-default`}
                                            onClick={() => hasDetalles && toggleExpand(o.id)}
                                        >
                                            {/* Número de visita + código */}
                                            <div className="flex items-center gap-3 sm:w-[25%]">
                                                <span
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0"
                                                    style={{ background: 'rgba(249,115,22,0.12)', color: '#C2550D' }}
                                                >
                                                    {visitaNum}
                                                </span>
                                                <div>
                                                    <Link
                                                        to={`/administracion/orders/${o.id}`}
                                                        onClick={e => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 font-mono-code font-bold text-[#F97316] hover:text-[#C2550D] transition-colors text-sm print:text-black"
                                                    >
                                                        {o.codigo}
                                                        <ExternalLink className="w-3 h-3 print:hidden" />
                                                    </Link>
                                                    <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} print:bg-transparent`}>
                                                        {ESTADO_LABELS[o.estado] || o.estado}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Fechas */}
                                            <div className="flex items-center gap-4 sm:w-[30%] text-xs text-[rgba(11,18,32,0.60)]">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 print:hidden" />
                                                    <span>Ingreso: <strong className="text-[#0F172A]">{formatearFecha(o.fecha_ingreso)}</strong></span>
                                                </div>
                                                {o.fecha_estimada && (
                                                    <span>Estimada: <strong className="text-[#0F172A]">{formatearFecha(o.fecha_estimada)}</strong></span>
                                                )}
                                            </div>

                                            {/* Cliente */}
                                            <div className="sm:w-[20%]">
                                                <span className="text-sm font-medium text-[#0F172A]">{o.cliente_nombre}</span>
                                            </div>

                                            {/* Monto */}
                                            <div className="sm:w-[15%] sm:text-right">
                                                <span className="text-sm font-black text-[#16A34A]">
                                                    {formatearMoneda(o.precio_total || o.monto_pagado || 0)}
                                                </span>
                                            </div>

                                            {/* Expand toggle */}
                                            <div className="sm:w-[10%] sm:text-right print:hidden">
                                                {hasDetalles && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-[rgba(11,18,32,0.35)] font-medium">
                                                        {isExpanded ? (
                                                            <>Menos <ChevronUp className="w-3.5 h-3.5" /></>
                                                        ) : (
                                                            <>Detalles <ChevronDown className="w-3.5 h-3.5" /></>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ── Panel de detalles expandible ── */}
                                        {/* En pantalla: expandible con click. En impresión: siempre visible */}
                                        <div className={`${isExpanded ? 'block' : 'hidden'} print:!block`}>
                                            <div className="border-t border-[rgba(15,23,42,0.06)] bg-[rgba(15,23,42,0.015)] px-5 py-4 print:bg-transparent print:py-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:gap-3">
                                                    {/* Columna 1: Trabajos realizados (Bitácora) */}
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <Wrench className="w-3.5 h-3.5 text-[#6366F1]" />
                                                            <h4 className="text-xs font-bold text-[rgba(15,23,42,0.55)] uppercase tracking-wider">
                                                                Trabajos Realizados
                                                            </h4>
                                                        </div>
                                                        {o.notas_publicas ? (
                                                            <div className="space-y-1 pl-5">
                                                                {o.notas_publicas
                                                                    .split('\n')
                                                                    .filter(l => l.trim().length > 0)
                                                                    .map((line, idx) => (
                                                                        <p
                                                                            key={idx}
                                                                            className="text-xs text-[rgba(11,18,32,0.70)] leading-relaxed print:text-[10px]"
                                                                        >
                                                                            <span className="text-[#F97316] mr-1.5">•</span>
                                                                            {line}
                                                                        </p>
                                                                    ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-[rgba(11,18,32,0.30)] italic pl-5">
                                                                Sin detalle de trabajos registrado
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Columna 2: Repuestos / Gastos */}
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <FileText className="w-3.5 h-3.5 text-[#EF4444]" />
                                                            <h4 className="text-xs font-bold text-[rgba(15,23,42,0.55)] uppercase tracking-wider">
                                                                Repuestos / Gastos
                                                            </h4>
                                                        </div>
                                                        {o.gastos.length > 0 ? (
                                                            <div className="space-y-1 pl-5">
                                                                {o.gastos.map((g, gIdx) => (
                                                                    <div
                                                                        key={gIdx}
                                                                        className="flex items-center justify-between text-xs"
                                                                    >
                                                                        <span className="text-[rgba(11,18,32,0.65)] print:text-[10px]">
                                                                            <span className="text-[#EF4444] mr-1.5">•</span>
                                                                            {g.descripcion}
                                                                        </span>
                                                                        <span className="font-semibold text-[#EF4444] tabular-nums ml-3 print:text-[10px]">
                                                                            {formatearMoneda(g.monto)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-dashed border-[rgba(15,23,42,0.10)] mt-1">
                                                                    <span className="text-[rgba(11,18,32,0.55)]">Subtotal gastos:</span>
                                                                    <span className="text-[#EF4444]">
                                                                        {formatearMoneda(o.total_gastos)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-[rgba(11,18,32,0.30)] italic pl-5">
                                                                Sin gastos registrados
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* ── Pie con totales ── */}
                            <div className="glass-card !p-5 print:border print:border-gray-300 print:shadow-none">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <span className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider">
                                        Resumen del Vehículo — {selected.placa}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <span className="text-[rgba(11,18,32,0.55)]">
                                            Visitas: <strong className="text-[#0F172A]">{resumen.totalVisitas}</strong>
                                        </span>
                                        <span className="text-[rgba(11,18,32,0.55)]">
                                            Gastos: <strong className="text-[#EF4444]">{formatearMoneda(resumen.totalGastos)}</strong>
                                        </span>
                                        <span className="text-[rgba(11,18,32,0.55)]">
                                            Total cobrado: <strong className="text-[#16A34A] text-lg">{formatearMoneda(resumen.totalGastado)}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
