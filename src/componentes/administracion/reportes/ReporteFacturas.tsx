import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader2, RefreshCw, Search } from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    compradorFactura,
    fechaFactura,
    filtroBusquedaFactura,
    htmlFacturaArchivada,
    leerComprobante,
    type FacturaHistorial,
} from '@/biblioteca/historialFacturas';
import { formatearMoneda } from '@/biblioteca/utilidadesReporte';

const TAMANO_PAGINA = 25;
const ESTADOS = ['CREADA', 'FIRMADA', 'RECIBIDA', 'AUTORIZADA', 'RECHAZADA'];
const CAMPOS =
    'id, orden_id, secuencial, clave_acceso, estado, ambiente, fecha_emision, importe_total, xml_generado, autorizacion_fecha';
const controles =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800';

export function ReporteFacturas() {
    const detalleRef = useRef<HTMLElement>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtros, setFiltros] = useState({
        busqueda: '',
        desde: '',
        hasta: '',
        estado: '',
        ambiente: '',
    });
    const [pagina, setPagina] = useState(0);
    const [revision, setRevision] = useState(0);
    const [facturas, setFacturas] = useState<FacturaHistorial[]>([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [seleccionada, setSeleccionada] = useState<FacturaHistorial | null>(null);
    useEffect(() => {
        if (seleccionada) {
            detalleRef.current?.focus({ preventScroll: true });
            detalleRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        }
    }, [seleccionada]);
    const fechasInvalidas = Boolean(
        filtros.desde && filtros.hasta && filtros.desde > filtros.hasta
    );

    useEffect(() => {
        const controlador = new AbortController();
        let vigente = true;
        setSeleccionada(null);
        setCargando(true);
        setError('');
        setFacturas([]);
        setTotal(0);
        async function cargar() {
            if (fechasInvalidas) {
                setCargando(false);
                return;
            }
            try {
                let consulta = supabase
                    .from('invoices')
                    .select(CAMPOS, { count: 'exact' })
                    .order('fecha_emision', { ascending: false })
                    .order('id', { ascending: false });
                if (filtros.busqueda)
                    consulta = consulta.or(filtroBusquedaFactura(filtros.busqueda));
                if (filtros.estado) consulta = consulta.eq('estado', filtros.estado);
                if (filtros.ambiente) consulta = consulta.eq('ambiente', Number(filtros.ambiente));
                if (filtros.desde)
                    consulta = consulta.gte('fecha_emision', `${filtros.desde}T00:00:00-05:00`);
                if (filtros.hasta) {
                    const siguienteDia = new Date(`${filtros.hasta}T00:00:00-05:00`);
                    siguienteDia.setUTCDate(siguienteDia.getUTCDate() + 1);
                    consulta = consulta.lt('fecha_emision', siguienteDia.toISOString());
                }
                const {
                    data,
                    error: fallo,
                    count,
                } = await consulta
                    .range(pagina * TAMANO_PAGINA, (pagina + 1) * TAMANO_PAGINA - 1)
                    .abortSignal(controlador.signal);
                if (fallo) throw fallo;
                if (vigente) {
                    setFacturas(data || []);
                    setTotal(count || 0);
                }
            } catch {
                if (vigente)
                    setError('No se pudo cargar el historial de facturas. Intenta nuevamente.');
            } finally {
                if (vigente) setCargando(false);
            }
        }
        void cargar();
        return () => {
            vigente = false;
            controlador.abort();
        };
    }, [filtros, pagina, revision, fechasInvalidas]);

    const filas = useMemo(
        () => facturas.map(factura => ({ factura, comprador: compradorFactura(factura) })),
        [facturas]
    );
    const vista = useMemo(
        () =>
            seleccionada?.estado === 'AUTORIZADA' && leerComprobante(seleccionada.xml_generado)
                ? htmlFacturaArchivada(seleccionada)
                : '',
        [seleccionada]
    );
    function filtrar(campo: keyof typeof filtros, valor: string) {
        setPagina(0);
        setFiltros(actual => ({ ...actual, [campo]: valor }));
    }
    function imprimir() {
        if (!seleccionada || !vista) return;
        const ventana = window.open('', '_blank');
        if (!ventana) {
            setError('Permite las ventanas emergentes para imprimir o guardar el PDF.');
            return;
        }
        ventana.opener = null;
        ventana.document.write(htmlFacturaArchivada(seleccionada, true));
        ventana.document.close();
    }
    function descargarXml() {
        if (!seleccionada?.xml_generado) return;
        const url = URL.createObjectURL(
            new Blob([seleccionada.xml_generado], { type: 'application/xml;charset=utf-8' })
        );
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `factura-${(seleccionada.secuencial || seleccionada.id).replace(/[^\w-]/g, '')}.xml`;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    return (
        <section className="space-y-5" aria-label="Historial de facturas">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Historial de facturas</h2>
                    <p className="text-sm text-slate-500">
                        Consulta los comprobantes guardados, del más reciente al más antiguo.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setRevision(r => r + 1)}
                    disabled={cargando}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw size={16} /> Actualizar
                </button>
            </div>
            <form
                className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4"
                onSubmit={evento => {
                    evento.preventDefault();
                    filtrar('busqueda', busqueda.trim());
                }}
            >
                <div className="text-sm font-medium text-slate-700">
                    <label htmlFor="buscar-factura">Buscar comprobante</label>
                    <div className="mt-1 flex gap-2">
                        <input
                            className={controles}
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            id="buscar-factura"
                            placeholder="Número, nombre, cédula/RUC o clave de acceso"
                        />
                        <button
                            type="submit"
                            aria-label="Buscar"
                            className="btn-primary flex items-center gap-2"
                        >
                            <Search size={18} />
                            <span className="hidden sm:inline">Buscar</span>
                            <span className="sr-only sm:hidden">Buscar</span>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className="text-sm text-slate-700">
                        Desde
                        <input
                            type="date"
                            className={controles}
                            value={filtros.desde}
                            onChange={e => filtrar('desde', e.target.value)}
                        />
                    </label>
                    <label className="text-sm text-slate-700">
                        Hasta
                        <input
                            type="date"
                            className={controles}
                            value={filtros.hasta}
                            onChange={e => filtrar('hasta', e.target.value)}
                        />
                    </label>
                    <label className="text-sm text-slate-700">
                        Estado
                        <select
                            className={controles}
                            value={filtros.estado}
                            onChange={e => filtrar('estado', e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            {ESTADOS.map(estado => (
                                <option key={estado}>{estado}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm text-slate-700">
                        Ambiente
                        <select
                            className={controles}
                            value={filtros.ambiente}
                            onChange={e => filtrar('ambiente', e.target.value)}
                        >
                            <option value="">Todos los ambientes</option>
                            <option value="2">Producción</option>
                            <option value="1">Pruebas</option>
                        </select>
                    </label>
                </div>
                <button
                    type="button"
                    className="text-sm font-medium text-orange-700"
                    onClick={() => {
                        setBusqueda('');
                        setPagina(0);
                        setFiltros({
                            busqueda: '',
                            desde: '',
                            hasta: '',
                            estado: '',
                            ambiente: '',
                        });
                    }}
                >
                    Limpiar filtros
                </button>
            </form>
            {fechasInvalidas && (
                <p role="alert" className="text-red-700">
                    La fecha inicial no puede ser posterior a la final.
                </p>
            )}
            {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
                    {error}
                </p>
            )}
            {cargando ? (
                <p role="status" className="flex items-center gap-2 p-6">
                    <Loader2 className="animate-spin" size={20} /> Cargando facturas…
                </p>
            ) : (
                !error &&
                !fechasInvalidas && (
                    <>
                        <p role="status" className="text-sm text-slate-500">
                            {total} comprobante{total === 1 ? '' : 's'} encontrado
                            {total === 1 ? '' : 's'}
                        </p>
                        {!filas.length && (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                                <FileText className="mx-auto mb-3" />
                                No hay facturas para estos filtros.
                            </div>
                        )}
                        <div className="grid gap-3">
                            {filas.map(({ factura, comprador }) => (
                                <article
                                    key={factura.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row gap-4 sm:items-center"
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-slate-900 break-words">
                                            {factura.secuencial || 'Sin número asignado'}
                                        </h3>
                                        <p className="text-sm text-slate-800 break-words">
                                            {comprador.nombre}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {comprador.identificacion} ·{' '}
                                            {fechaFactura(factura.fecha_emision)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-semibold ${factura.estado === 'AUTORIZADA' ? 'bg-green-50 text-green-700' : factura.estado === 'RECHAZADA' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}
                                        >
                                            {factura.estado}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {factura.ambiente === 2 ? 'Producción' : 'Pruebas'}
                                        </span>
                                        <strong>
                                            {formatearMoneda(Number(factura.importe_total))}
                                        </strong>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setSeleccionada(factura)}
                                            aria-label={`Ver factura ${factura.secuencial || factura.id}`}
                                        >
                                            Ver factura
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                        {total > 0 && (
                            <nav
                                aria-label="Páginas de facturas"
                                className="flex items-center justify-between gap-2"
                            >
                                <button
                                    className="btn-secondary"
                                    disabled={pagina === 0}
                                    onClick={() => setPagina(p => p - 1)}
                                >
                                    Anterior
                                </button>
                                <span className="text-sm">
                                    Página {pagina + 1} de{' '}
                                    {Math.max(1, Math.ceil(total / TAMANO_PAGINA))}
                                </span>
                                <button
                                    className="btn-secondary"
                                    disabled={(pagina + 1) * TAMANO_PAGINA >= total}
                                    onClick={() => setPagina(p => p + 1)}
                                >
                                    Siguiente
                                </button>
                            </nav>
                        )}
                    </>
                )
            )}
            {seleccionada && (
                <section
                    aria-label="Detalle de factura"
                    ref={detalleRef}
                    tabIndex={-1}
                    className="rounded-2xl border border-orange-200 bg-orange-50 p-4 space-y-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-bold">Factura {seleccionada.secuencial}</h3>
                        <button className="btn-secondary" onClick={() => setSeleccionada(null)}>
                            Cerrar detalle
                        </button>
                    </div>
                    <p className="text-sm break-all">
                        Clave de acceso: {seleccionada.clave_acceso || 'No disponible'}
                    </p>
                    {seleccionada.estado !== 'AUTORIZADA' && (
                        <p className="text-sm text-amber-900">
                            Este comprobante está {seleccionada.estado.toLowerCase()} y no consta
                            como autorizado.
                        </p>
                    )}
                    {!leerComprobante(seleccionada.xml_generado) && (
                        <p className="text-sm">
                            No hay un XML válido guardado para reconstruir este comprobante.
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {vista && (
                            <button className="btn-primary" onClick={imprimir}>
                                Imprimir / Guardar PDF
                            </button>
                        )}
                        {seleccionada.xml_generado && (
                            <button className="btn-secondary" onClick={descargarXml}>
                                Descargar XML
                            </button>
                        )}
                        {seleccionada.orden_id && (
                            <Link
                                className="btn-secondary"
                                to={`/administracion/orders/${seleccionada.orden_id}`}
                            >
                                Ver orden
                            </Link>
                        )}
                    </div>
                    {vista && (
                        <iframe
                            title={`Comprobante ${seleccionada.secuencial}`}
                            srcDoc={vista}
                            sandbox=""
                            className="h-[650px] w-full rounded-xl border border-slate-200 bg-white"
                        />
                    )}
                </section>
            )}
        </section>
    );
}
