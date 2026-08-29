import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Printer,
    Download,
    Loader2,
    RefreshCw,
    Car,
    AlertTriangle,
    ExternalLink,
    Clock,
    CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    formatearFecha,
    calcularDiasEntre,
    exportarCSV,
    imprimirReporte,
    ESTADO_LABELS,
} from '@/biblioteca/utilidadesReporte';
import { EncabezadoImpresion } from '@/componentes/administracion/reportes/EncabezadoImpresion';
import type { OrderStatus } from '@/tipos';

interface OrdenBasica {
    id: string;
    codigo: string;
    estado: OrderStatus;
    fecha_ingreso: string;
    updated_at: string;
    notas_publicas: string | null;
    precio_total: number | null;
    monto_pagado: number | null;
}

interface VehiculoConRetrabajos {
    vehiculo_id: string;
    placa: string;
    marca: string;
    modelo: string;
    anio: number;
    cliente_nombre: string;
    ordenes: OrdenBasica[];
    totalVisitas: number;
    tieneRetrabajo: boolean;
    diasEntreRetorno: number | null; // Días entre la última entrega y el último reingreso
}

const UMBRAL_RETRABAJO_DIAS = 90;

export function ReporteGarantiasRetrabajos() {
    const [data, setData] = useState<VehiculoConRetrabajos[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroRetrabajo, setFiltroRetrabajo] = useState<'todos' | 'solo_retrabajos'>('todos');

    useEffect(() => {
        (async () => {
            setLoading(true);

            // Paso 1: Obtener todas las órdenes
            const { data: ordenes } = await supabase
                .from('ordenes')
                .select('id, codigo, estado, fecha_ingreso, updated_at, notas_publicas, precio_total, monto_pagado, vehiculo_id, cliente_id')
                .order('fecha_ingreso', { ascending: true });

            if (!ordenes || ordenes.length === 0) {
                setData([]);
                setLoading(false);
                return;
            }

            // Agrupar por vehiculo_id
            const porVehiculo: Record<string, typeof ordenes> = {};
            ordenes.forEach(o => {
                if (!o.vehiculo_id) return;
                if (!porVehiculo[o.vehiculo_id]) porVehiculo[o.vehiculo_id] = [];
                porVehiculo[o.vehiculo_id].push(o);
            });

            // Filtrar solo los que tienen más de 1 orden
            const vehiculosConMultiples = Object.entries(porVehiculo).filter(
                ([, ords]) => ords.length > 1
            );

            if (vehiculosConMultiples.length === 0) {
                setData([]);
                setLoading(false);
                return;
            }

            // Obtener info de vehículos y clientes
            const vehiculoIds = vehiculosConMultiples.map(([id]) => id);
            const allClienteIds = [
                ...new Set(ordenes.filter(o => vehiculoIds.includes(o.vehiculo_id)).map(o => o.cliente_id).filter(Boolean)),
            ];

            const [{ data: vehiculos }, { data: clientes }] = await Promise.all([
                supabase.from('vehiculos').select('id, placa, marca, modelo, anio').in('id', vehiculoIds),
                allClienteIds.length > 0
                    ? supabase.from('clientes').select('id, nombres').in('id', allClienteIds)
                    : { data: [] },
            ]);

            const vehiculoMap = Object.fromEntries((vehiculos ?? []).map(v => [v.id, v]));
            const clienteMap = Object.fromEntries((clientes ?? []).map(c => [c.id, c.nombres]));

            // Construir datos
            const resultado: VehiculoConRetrabajos[] = vehiculosConMultiples.map(([vId, ords]) => {
                const v = vehiculoMap[vId] || {};
                // Ordenar por fecha de ingreso (ascendente)
                const sortedOrds = [...ords].sort(
                    (a, b) => new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime()
                );

                // Buscar retrabajos: pares consecutivos donde la entrega de la anterior
                // y el ingreso de la siguiente son <= 90 días
                let tieneRetrabajo = false;
                let diasEntreRetorno: number | null = null;

                for (let i = 1; i < sortedOrds.length; i++) {
                    const anterior = sortedOrds[i - 1];
                    const actual = sortedOrds[i];

                    // Solo se puede calcular si la anterior fue entregada
                    if (anterior.estado === 'ENTREGADO') {
                        const dias = calcularDiasEntre(anterior.updated_at, actual.fecha_ingreso);
                        if (dias <= UMBRAL_RETRABAJO_DIAS && dias >= 0) {
                            tieneRetrabajo = true;
                            diasEntreRetorno = dias;
                        }
                    }
                }

                // Si no hay retrabajo, calcular los días entre la última entrega y el último ingreso para referencia
                if (!tieneRetrabajo && sortedOrds.length >= 2) {
                    const ultimaEntregada = [...sortedOrds]
                        .reverse()
                        .find(o => o.estado === 'ENTREGADO');
                    const ultimaOrden = sortedOrds[sortedOrds.length - 1];
                    if (ultimaEntregada && ultimaOrden.id !== ultimaEntregada.id) {
                        diasEntreRetorno = calcularDiasEntre(
                            ultimaEntregada.updated_at,
                            ultimaOrden.fecha_ingreso
                        );
                    }
                }

                // Tomar el nombre del cliente de la orden más reciente
                const ultimaOrden = sortedOrds[sortedOrds.length - 1];
                const clienteNombre = clienteMap[ultimaOrden.cliente_id] || '—';

                return {
                    vehiculo_id: vId,
                    placa: v.placa || '—',
                    marca: v.marca || '—',
                    modelo: v.modelo || '',
                    anio: v.anio || 0,
                    cliente_nombre: clienteNombre,
                    ordenes: sortedOrds.map(o => ({
                        id: o.id,
                        codigo: o.codigo,
                        estado: o.estado,
                        fecha_ingreso: o.fecha_ingreso,
                        updated_at: o.updated_at,
                        notas_publicas: o.notas_publicas,
                        precio_total: o.precio_total,
                        monto_pagado: o.monto_pagado,
                    })),
                    totalVisitas: sortedOrds.length,
                    tieneRetrabajo,
                    diasEntreRetorno,
                };
            });

            // Ordenar: retrabajos primero, luego por más visitas
            resultado.sort((a, b) => {
                if (a.tieneRetrabajo !== b.tieneRetrabajo) return a.tieneRetrabajo ? -1 : 1;
                return b.totalVisitas - a.totalVisitas;
            });

            setData(resultado);
            setLoading(false);
        })();
    }, []);

    const filtered = useMemo(() => {
        if (filtroRetrabajo === 'solo_retrabajos') return data.filter(d => d.tieneRetrabajo);
        return data;
    }, [data, filtroRetrabajo]);

    const stats = useMemo(() => {
        return {
            total: data.length,
            conRetrabajo: data.filter(d => d.tieneRetrabajo).length,
            sinRetrabajo: data.filter(d => !d.tieneRetrabajo).length,
        };
    }, [data]);

    const handleCSV = () => {
        exportarCSV(
            ['Placa', 'Marca', 'Modelo', 'Cliente', 'Total Visitas', 'Posible Retrabajo', 'Días entre Retorno'],
            filtered.map(d => [
                d.placa,
                d.marca,
                d.modelo,
                d.cliente_nombre,
                d.totalVisitas,
                d.tieneRetrabajo ? 'SÍ' : 'NO',
                d.diasEntreRetorno !== null ? d.diasEntreRetorno : '—',
            ]),
            `Garantias_Retrabajos_${new Date().toISOString().slice(0, 10)}`
        );
    };

    // Expandable row state
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
        <div className="space-y-6 animate-fade-in print:space-y-4">
            {/* Print Header Profesional */}
            <EncabezadoImpresion
                titulo="Garantías / Retrabajos"
                subtitulo={`Umbral: ${UMBRAL_RETRABAJO_DIAS} días`}
                infoExtra={[
                    `${stats.total} vehículos recurrentes · ${stats.conRetrabajo} posibles retrabajos`,
                ]}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <p className="text-sm text-[rgba(15,23,42,0.60)]">
                    Vehículos con múltiples visitas. Se marca como <strong className="text-[#EF4444]">posible retrabajo</strong> si
                    regresó en menos de {UMBRAL_RETRABAJO_DIAS} días.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={imprimirReporte} className="btn-secondary text-sm">
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    <button
                        onClick={handleCSV}
                        className="btn-primary text-sm"
                        disabled={filtered.length === 0}
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
                        <RefreshCw className="w-5 h-5 text-[#F97316]" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider">
                            Vehículos Recurrentes
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
                    className={`glass-card flex items-center gap-4 !p-5 ${stats.conRetrabajo > 0 ? 'bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.15)]' : ''}`}
                >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stats.conRetrabajo > 0 ? 'bg-[#EF4444] text-white shadow-lg shadow-red-500/20' : 'bg-slate-200/50'}`}>
                        <AlertTriangle className={`w-5 h-5 ${stats.conRetrabajo > 0 ? '' : 'text-[rgba(11,18,32,0.40)]'}`} />
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${stats.conRetrabajo > 0 ? 'text-[#EF4444]' : 'text-[rgba(15,23,42,0.50)]'}`}>
                            Posibles Retrabajos
                        </p>
                        <p className={`text-2xl font-black leading-none mt-1 ${stats.conRetrabajo > 0 ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
                            {stats.conRetrabajo}
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
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                            Clientes Fieles
                        </p>
                        <p className="text-2xl font-black text-[#16A34A] leading-none mt-1">
                            {stats.sinRetrabajo}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Filtro rápido */}
            <div className="flex gap-2 print:hidden">
                <button
                    onClick={() => setFiltroRetrabajo('todos')}
                    className={`text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                        filtroRetrabajo === 'todos'
                            ? 'bg-[#F97316] text-white shadow-lg shadow-orange-500/20'
                            : 'bg-[rgba(15,23,42,0.05)] text-[rgba(11,18,32,0.55)] hover:bg-[rgba(15,23,42,0.08)]'
                    }`}
                >
                    Todos ({stats.total})
                </button>
                <button
                    onClick={() => setFiltroRetrabajo('solo_retrabajos')}
                    className={`text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                        filtroRetrabajo === 'solo_retrabajos'
                            ? 'bg-[#EF4444] text-white shadow-lg shadow-red-500/20'
                            : 'bg-[rgba(15,23,42,0.05)] text-[rgba(11,18,32,0.55)] hover:bg-[rgba(15,23,42,0.08)]'
                    }`}
                >
                    Solo Retrabajos ({stats.conRetrabajo})
                </button>
            </div>

            {/* Tabla */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card flex flex-col items-center py-14 gap-3">
                    <CheckCircle2 className="w-8 h-8 text-[#16A34A]" />
                    <p className="text-sm text-[rgba(11,18,32,0.40)]">
                        {filtroRetrabajo === 'solo_retrabajos'
                            ? 'No se detectaron posibles retrabajos 🎉'
                            : 'No hay vehículos con múltiples visitas'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((d, i) => (
                        <motion.div
                            key={d.vehiculo_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`glass-card !p-0 overflow-hidden transition-all ${
                                d.tieneRetrabajo ? 'border-[rgba(239,68,68,0.20)]' : ''
                            }`}
                        >
                            {/* Row principal */}
                            <button
                                onClick={() => setExpanded(expanded === d.vehiculo_id ? null : d.vehiculo_id)}
                                className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 px-5 py-4 text-left hover:bg-[rgba(15,23,42,0.02)] transition-colors"
                            >
                                {/* Vehículo */}
                                <div className="flex items-center gap-3 sm:w-[35%]">
                                    <Car className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                                    <div>
                                        <span className="font-mono-code font-bold text-[#F97316] text-xs">
                                            {d.placa}
                                        </span>
                                        <p className="text-sm font-medium text-[#0F172A]">
                                            {d.marca} {d.modelo}
                                            <span className="text-[rgba(11,18,32,0.40)] font-normal"> ({d.anio})</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Cliente */}
                                <div className="sm:w-[20%]">
                                    <span className="text-sm text-[rgba(11,18,32,0.70)]">{d.cliente_nombre}</span>
                                </div>

                                {/* Visitas */}
                                <div className="sm:w-[12%] sm:text-center">
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[rgba(99,102,241,0.08)] text-[#6366F1]">
                                        {d.totalVisitas} visitas
                                    </span>
                                </div>

                                {/* Días entre retorno */}
                                <div className="sm:w-[15%] sm:text-center">
                                    {d.diasEntreRetorno !== null ? (
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                            d.tieneRetrabajo
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            <Clock className="w-3 h-3" />
                                            {d.diasEntreRetorno}d
                                        </span>
                                    ) : (
                                        <span className="text-xs text-[rgba(11,18,32,0.30)]">—</span>
                                    )}
                                </div>

                                {/* Badge retrabajo */}
                                <div className="sm:w-[18%] sm:text-right">
                                    {d.tieneRetrabajo ? (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-700">
                                            <AlertTriangle className="w-3 h-3" />
                                            POSIBLE RETRABAJO
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                                            <CheckCircle2 className="w-3 h-3" />
                                            CLIENTE FIEL
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Detalle expandible */}
                            {expanded === d.vehiculo_id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-[rgba(15,23,42,0.06)] bg-[rgba(15,23,42,0.01)]"
                                >
                                    <div className="px-5 py-4">
                                        <p className="text-xs font-bold text-[rgba(11,18,32,0.40)] uppercase tracking-wider mb-3">
                                            Historial de órdenes
                                        </p>
                                        <div className="space-y-2">
                                            {d.ordenes.map((o, idx) => (
                                                <div
                                                    key={o.id}
                                                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 px-3 rounded-lg bg-white/50 border border-[rgba(15,23,42,0.04)]"
                                                >
                                                    <span className="text-xs font-bold text-[rgba(11,18,32,0.30)] w-5">
                                                        {idx + 1}
                                                    </span>
                                                    <Link
                                                        to={`/administracion/orders/${o.id}`}
                                                        className="inline-flex items-center gap-1 font-mono-code text-xs font-bold text-[#F97316] hover:text-[#C2550D]"
                                                    >
                                                        {o.codigo}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                    <span className="text-xs text-[rgba(11,18,32,0.55)]">
                                                        Ingreso: {formatearFecha(o.fecha_ingreso)}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                        {ESTADO_LABELS[o.estado] || o.estado}
                                                    </span>
                                                    {(o.precio_total || o.monto_pagado) ? (
                                                        <span className="text-xs font-bold text-[#16A34A] ml-auto">
                                                            ${(o.precio_total || o.monto_pagado || 0).toFixed(2)}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
