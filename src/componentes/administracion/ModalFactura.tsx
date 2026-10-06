import { useState, useEffect, useRef, useCallback } from 'react';
import { htmlFacturaArchivada } from '@/biblioteca/historialFacturas';
import { FORMAS_PAGO, validarEmision, calcularTotalesFactura } from '../../../supabase/functions/_shared/reglasFacturacion';
import { DatosCompradorFactura } from './DatosCompradorFactura';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    X,
    FileText,
    Loader2,
    Send,
    CheckCircle2,
    AlertTriangle,
    Download,
} from 'lucide-react';
import type { AdminOrder, Invoice, OrdenGasto } from '@/tipos';

interface ModalFacturaProps {
    isOpen: boolean;
    onClose: () => void;
    order: AdminOrder;
}

// ── RIDE HTML generator (Formato SRI Oficial) ──────────────────────────────────
// ── Formas de pago SRI ─────────────────────────────────────────────────────────
export function ModalFactura({ isOpen, onClose, order }: ModalFacturaProps) {
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null);
    const [gastos, setGastos] = useState<OrdenGasto[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [avisoCorreo, setAvisoCorreo] = useState<string | null>(null);

    const clienteInitial = order.cliente as any;
    const [clienteDocTipo, setClienteDocTipo] = useState(
        clienteInitial?.tipo_identificacion || '05'
    );
    const [clienteDoc, setClienteDoc] = useState(clienteInitial?.cedula || '');
    const [clienteNombre, setClienteNombre] = useState(
        clienteInitial?.nombres || clienteInitial?.nombre || ''
    );
    const [clienteDireccion, setClienteDireccion] = useState(clienteInitial?.direccion || '');
    const [clienteTelefono, setClienteTelefono] = useState(clienteInitial?.telefono || '');
    const [clienteEmail, setClienteEmail] = useState(clienteInitial?.email || '');

    // Auto-complete state
    const [searchingCliente, setSearchingCliente] = useState(false);
    const [clienteFound, setClienteFound] = useState<boolean | null>(null);
    const [mensajeBusqueda, setMensajeBusqueda] = useState('');
    const consultaActual = useRef(0);
    const emisionBloqueada = useRef(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Form state defaults
    const [ivaManoObra, setIvaManoObra] = useState<number | ''>('');
    const [formaPago, setFormaPago] = useState('');
    const [ivaGastos, setIvaGastos] = useState<Record<string, number | ''>>({});
    const [consultaFallida, setConsultaFallida] = useState(false);
    const [notasVenta, setNotasVenta] = useState('');
    const [trabajoRealizado, setTrabajoRealizado] = useState(order.notas_publicas || '');

    useEffect(() => {
        if (isOpen) {
            setIvaManoObra('');
            setIvaGastos({});
            setFormaPago('');
            checkExistingInvoice();
            loadGastos();
            setClienteFound(null);
            setMensajeBusqueda('');
            setSearchingCliente(false);
            setError(null);
            setAvisoCorreo(null);
            setExistingInvoice(null);
            setTrabajoRealizado(order.notas_publicas || '');
            setClienteDocTipo(order.cliente?.tipo_identificacion || '05');
            setClienteDoc(order.cliente?.cedula || '');
            setClienteNombre(order.cliente?.nombres || '');
            setClienteDireccion(order.cliente?.direccion || '');
            setClienteEmail(order.cliente?.email || '');
            setClienteTelefono(order.cliente?.telefono || '');
        }
        return () => {
            consultaActual.current += 1;
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [isOpen, order.id]);

    const checkExistingInvoice = async () => {
        setLoading(true);
        setConsultaFallida(false);
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('orden_id', order.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            setConsultaFallida(true);
            setError('No se pudo comprobar si la orden ya está facturada. Cierra y vuelve a abrir antes de emitir.');
        }
        if (data) setExistingInvoice(data);
        setLoading(false);
    };

    const loadGastos = async () => {
        const { data, error: fallo } = await supabase.from('orden_gastos').select('*').eq('orden_id', order.id);
        if (fallo) { setConsultaFallida(true); setError('No se pudieron cargar los repuestos. Cierra y vuelve a abrir la factura.'); }
        if (data) setGastos(data);
    };

    // Cada cambio invalida consultas pendientes para no mezclar compradores.
    const buscarClientePorCedula = useCallback(async (documento: string, revision: number) => {
        try {
            const { data, error: errorConsulta } = await supabase
                .from('clientes')
                .select('id, cedula, nombres, direccion, email, telefono, tipo_identificacion')
                .eq('cedula', documento)
                .abortSignal(AbortSignal.timeout(10000))
                .maybeSingle();
            if (revision !== consultaActual.current) return;
            if (errorConsulta) throw errorConsulta;
            if (data) {
                setClienteNombre(data.nombres || '');
                setClienteDireccion(data.direccion || '');
                setClienteEmail(data.email || '');
                setClienteTelefono(data.telefono || '');
                setClienteFound(true);
                setMensajeBusqueda('Datos recuperados de SuColor. Revisa que estén actualizados.');
            } else {
                setClienteFound(false);
                setMensajeBusqueda('Cliente nuevo. Completa sus datos para esta factura.');
            }
        } catch {
            if (revision !== consultaActual.current) return;
            setClienteFound(null);
            setMensajeBusqueda('No se pudo consultar los clientes. Puedes completar los datos manualmente.');
        } finally {
            if (revision === consultaActual.current) setSearchingCliente(false);
        }
    }, []);

    const handleCedulaChange = (value: string, tipo = clienteDocTipo) => {
        const documento = tipo === '06' ? value.trim().toUpperCase() : value.replace(/\D/g, '');
        setClienteDoc(documento);
        setClienteDocTipo(tipo);
        setClienteFound(null);
        setMensajeBusqueda('');
        setSearchingCliente(false);
        setClienteNombre('');
        setClienteDireccion('');
        setClienteEmail('');
        setClienteTelefono('');
        const revision = ++consultaActual.current;
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        const completo = tipo === '05' ? /^\d{10}$/.test(documento)
            : tipo === '04' ? /^\d{13}$/.test(documento) : documento.length >= 5;
        if (completo) {
            setSearchingCliente(true);
            searchTimeout.current = setTimeout(() => {
                buscarClientePorCedula(documento, revision);
            }, 500);
        }
    };

    // ── Descargar RIDE ─────────────────────────────────────────────────────────
    const handleDownloadRIDE = () => {
        if (!existingInvoice) return;
        try {
            const html = htmlFacturaArchivada(existingInvoice, true);
            const ventana = window.open('', '_blank');
            if (!ventana) throw new Error('Permite las ventanas emergentes para imprimir o guardar el PDF.');
            ventana.opener = null;
            ventana.document.write(html);
            ventana.document.close();
        } catch (fallo) {
            setError(fallo instanceof Error ? fallo.message : 'No se pudo abrir el comprobante.');
        }
    };

    const handleGenerateInvoice = async () => {
        if (emisionBloqueada.current || searchingCliente || loading || consultaFallida) return;
        if (ivaManoObra === '' || gastos.some(g => ivaGastos[g.id] === undefined || ivaGastos[g.id] === '') || !formaPago) {
            setError('Selecciona la forma de pago y el IVA de cada concepto según su tratamiento tributario.');
            return;
        }
        if ((clienteDocTipo === '05' && !/^\d{10}$/.test(clienteDoc)) ||
            (clienteDocTipo === '04' && !/^\d{13}$/.test(clienteDoc))) {
            setError('Revisa la identificación: cédula de 10 dígitos o RUC de 13 dígitos.');
            return;
        }
        if (!order.cliente_id) {
            setError('La orden debe tener un cliente asignado para poder facturar.');
            return;
        }
        if (!clienteDoc) {
            setError('Falta ingresar la identificación del cliente (Cédula/RUC).');
            return;
        }
        if (!clienteNombre.trim()) {
            setError('Falta ingresar la Razón Social / Nombre del cliente.');
            return;
        }
        if (!clienteDireccion.trim()) {
            setError('Falta ingresar la dirección del cliente.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail.trim())) {
            setError('Falta ingresar el correo electrónico del cliente para enviar la factura.');
            return;
        }

        if (!trabajoRealizado.trim() || trabajoRealizado.trim().length > 250) {
            setError('Describe el trabajo realizado en un máximo de 250 caracteres.');
            return;
        }

        emisionBloqueada.current = true;
        setProcessing(true);
        setError(null);

        try {
            // Solo actualizar el cliente de la orden cuando conserva su identidad.
            if (clienteDoc === order.cliente?.cedula && clienteDocTipo === (order.cliente?.tipo_identificacion || '05')) {
                const { error: errorGuardado } = await supabase
                    .from('clientes')
                    .update({
                        cedula: clienteDoc,
                        nombres: clienteNombre,
                        direccion: clienteDireccion,
                        email: clienteEmail,
                        telefono: clienteTelefono,
                        tipo_identificacion: clienteDocTipo,
                    })
                    .eq('id', order.cliente_id);
                if (errorGuardado) throw new Error('No se pudieron guardar los datos del cliente. Intenta nuevamente.');
            }

            const payload = {
                orden_id: order.id,
                comprador: {
                    tipo_identificacion: clienteDocTipo,
                    identificacion: clienteDoc,
                    razon_social: clienteNombre,
                    direccion: clienteDireccion,
                    telefono: clienteTelefono,
                    email: clienteEmail,
                },
                items: [
                    {
                        codigo_principal: 'MANO_OBRA',
                        descripcion: `Mano de obra: ${trabajoRealizado.trim().replace(/\s+/g, ' ')}`,
                        precio_total_sin_impuestos: order.precio_total || 0,
                        tarifa_iva: ivaManoObra,
                    },
                    ...gastos.map(g => ({
                        codigo_principal: `REP_${g.id.substring(0, 5)}`,
                        descripcion: g.descripcion,
                        precio_total_sin_impuestos: g.monto,
                        tarifa_iva: ivaGastos[g.id],
                    })),
                ],
                forma_pago: formaPago,
                notas: notasVenta,
            };

            validarEmision(payload.items, payload.forma_pago);
            const { data, error: functionError } = await supabase.functions.invoke('sri-invoice', {
                body: payload,
            });

            if (functionError) {
                console.error('Edge function call error:', functionError);
                throw new Error(
                    functionError.message || 'Error de conexión con el servidor de facturación'
                );
            }
            if (!data || !data.success) {
                throw new Error(data?.message || 'Error desconocido del SRI');
            }

            setAvisoCorreo(data.aviso_correo || (data.email_enviado === true ? 'La factura se envió al cliente con el PDF adjunto.' : null));
            await checkExistingInvoice();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocurrió un error al procesar la factura con el SRI');
        } finally {
            emisionBloqueada.current = false;
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    const totalManoObra = order.precio_total || 0;
    const totalGasto = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
    const subtotal = totalManoObra + totalGasto;
    const totalesVista = calcularTotalesFactura([
        { codigo_principal: 'MO', descripcion: 'Mano de obra', precio_total_sin_impuestos: totalManoObra, tarifa_iva: ivaManoObra === 15 ? 15 : 0 },
        ...gastos.map(g => ({ codigo_principal: g.id, descripcion: g.descripcion, precio_total_sin_impuestos: Number(g.monto), tarifa_iva: ivaGastos[g.id] === 15 ? 15 as const : 0 as const })),
    ]);
    const impuestosPendientes = ivaManoObra === '' || gastos.some(g => ivaGastos[g.id] === undefined || ivaGastos[g.id] === '');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { if (!emisionBloqueada.current) onClose(); }} />
            <div role="dialog" aria-modal="true" aria-label="Factura electrónica"
                className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-orange" />
                        Factura electrónica
                    </h2>
                    <button
                        onClick={() => { if (!emisionBloqueada.current) onClose(); }}
                        aria-label="Cerrar factura" disabled={processing}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 sm:p-7 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
                        </div>
                    ) : existingInvoice ? (
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                                {existingInvoice.estado === 'AUTORIZADA' ? (
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                ) : existingInvoice.estado === 'RECHAZADA' ? (
                                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                ) : (
                                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-3" />
                                )}
                                <h3 className="text-xl font-bold dark:text-white mb-1">
                                    Factura {existingInvoice.estado}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Secuencial: {existingInvoice.secuencial || 'En proceso...'}
                                </p>

                                {existingInvoice.estado === 'RECIBIDA' && (
                                    <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                                        El SRI recibió la factura y la está procesando. La
                                        autorización puede tardar unos minutos.
                                    </p>
                                )}

                                {existingInvoice.estado === 'AUTORIZADA' &&
                                    existingInvoice.autorizacion_fecha && (
                                        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                                            Autorizada:{' '}
                                            {new Date(
                                                existingInvoice.autorizacion_fecha
                                            ).toLocaleString('es-EC')}
                                        </p>
                                    )}

                                {existingInvoice.clave_acceso && (
                                    <div className="mt-4 break-all bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
                                        Clave Acceso: {existingInvoice.clave_acceso}
                                    </div>
                                )}

                                {existingInvoice.estado === 'RECHAZADA' &&
                                    existingInvoice.mensajes_sri && (
                                        <div className="mt-4 text-left bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">
                                            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                                                Detalle del SRI:
                                            </p>
                                            {(existingInvoice.mensajes_sri as any)?.mensajes?.map(
                                                (msg: any, i: number) => (
                                                    <p
                                                        key={i}
                                                        className="text-xs text-red-600 dark:text-red-300"
                                                    >
                                                        [{msg.tipo}] {msg.mensaje}{' '}
                                                        {msg.informacionAdicional
                                                            ? `— ${msg.informacionAdicional}`
                                                            : ''}
                                                    </p>
                                                )
                                            ) || (
                                                <p className="text-xs text-red-600 dark:text-red-300">
                                                    {(existingInvoice.mensajes_sri as any)?.error ||
                                                        JSON.stringify(
                                                            existingInvoice.mensajes_sri
                                                        )}
                                                </p>
                                            )}
                                        </div>
                                    )}
                            </div>

                            {avisoCorreo && <p role="status" className="rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">{avisoCorreo}</p>}
                            {existingInvoice.estado === 'AUTORIZADA' && (
                                <button
                                    onClick={() => handleDownloadRIDE()}
                                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar RIDE (PDF)
                                </button>
                            )}

                            {existingInvoice.estado === 'RECHAZADA' && (
                                <button
                                    onClick={() => {
                                        setExistingInvoice(null);
                                    }}
                                    className="w-full py-3 flex items-center justify-center gap-2 text-base font-medium rounded-xl border-2 border-brand-orange text-brand-orange hover:bg-brand-orange/10 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                    Reintentar Factura
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <DatosCompradorFactura
                                tipo={clienteDocTipo} documento={clienteDoc}
                                nombre={clienteNombre} direccion={clienteDireccion}
                                email={clienteEmail} telefono={clienteTelefono}
                                buscando={searchingCliente} encontrado={clienteFound}
                                mensaje={mensajeBusqueda} bloqueado={processing}
                                onDocumento={handleCedulaChange}
                                onTipo={tipo => handleCedulaChange('', tipo)}
                                onNombre={setClienteNombre} onDireccion={setClienteDireccion}
                                onEmail={setClienteEmail} onTelefono={setClienteTelefono}
                            />

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                                <h3 className="text-sm font-semibold mb-3 dark:text-white">
                                    Detalle de la factura
                                </h3>
                                <p id="factura-iva-ayuda" className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                                    Para servicios amparados por una calificación artesanal vigente, selecciona IVA 0%.
                                    Revisa por separado la tarifa de productos y servicios fuera de esa calificación.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
                                        <span className="text-slate-600 dark:text-slate-300">
                                            Mano de Obra (Orden {order.codigo})
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <select
                                                aria-label="IVA de mano de obra" aria-describedby="factura-iva-ayuda" disabled={processing}
                                                value={ivaManoObra}
                                                onChange={e =>
                                                    setIvaManoObra(e.target.value === '' ? '' : Number(e.target.value))
                                                }
                                                className="min-h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-base outline-none"
                                            >
                                                <option value="">Selecciona IVA</option>
                                                <option value={0}>IVA 0%</option>
                                                <option value={15}>IVA 15%</option>
                                            </select>
                                            <span className="font-medium dark:text-white">
                                                ${totalManoObra.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="factura-trabajo" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                            Trabajo realizado
                                        </label>
                                        <textarea
                                            id="factura-trabajo" value={trabajoRealizado}
                                            onChange={e => setTrabajoRealizado(e.target.value)}
                                            disabled={processing} maxLength={250} rows={3}
                                            aria-describedby="factura-trabajo-ayuda"
                                            placeholder="Ej. Enderezado y pintura del guardafango trasero derecho."
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 text-base dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        />
                                        <p id="factura-trabajo-ayuda" className="mt-1 text-xs text-slate-500">
                                            Revisa el texto de la bitácora. Este detalle aparecerá en la factura. {trabajoRealizado.length}/250
                                        </p>
                                    </div>

                                    {gastos.length > 0 && (
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <span className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                                                Repuestos / Adicionales
                                            </span>
                                            {gastos.map(g => (
                                                <div
                                                    key={g.id}
                                                    className="flex flex-wrap justify-between items-center gap-2 text-sm mb-1.5"
                                                >
                                                    <span className="text-slate-600 dark:text-slate-300 truncate pr-4">
                                                        {g.descripcion}
                                                    </span>
                                                    <select aria-label={`IVA de ${g.descripcion}`} disabled={processing}
                                                        value={ivaGastos[g.id] ?? ''}
                                                        onChange={e => setIvaGastos(actual => ({ ...actual, [g.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                                                        className="min-h-11 rounded-lg border px-2 text-base dark:bg-slate-900">
                                                        <option value="">Selecciona IVA</option><option value="0">IVA 0%</option><option value="15">IVA 15%</option>
                                                    </select>
                                                    <span className="font-medium dark:text-white flex-shrink-0">
                                                        ${Number(g.monto).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between font-semibold text-lg dark:text-white">
                                        <span>Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Forma de pago */}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                                <label className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
                                    Forma de pago
                                </label>
                                <select
                                    aria-label="Forma de pago" disabled={processing}
                                    value={formaPago}
                                    onChange={e => setFormaPago(e.target.value)}
                                    className="w-full text-base p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-brand-orange dark:text-white"
                                >
                                    <option value="">Selecciona la forma de pago</option>
                                    {Object.entries(FORMAS_PAGO).map(([code, desc]) => (
                                        <option key={code} value={code}>
                                            {desc.charAt(0) + desc.slice(1).toLowerCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <details className="text-sm text-slate-600 dark:text-slate-300">
                                <summary className="cursor-pointer py-2 font-medium">Añadir una nota · opcional</summary>
                                <textarea
                                    className="w-full text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 resize-none focus:ring-1 focus:ring-brand-orange outline-none dark:text-white"
                                    aria-label="Notas adicionales" disabled={processing}
                                    rows={2}
                                    placeholder="Ej. Pago con transferencia"
                                    value={notasVenta}
                                    onChange={e => setNotasVenta(e.target.value)}
                                />
                            </details>

                            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-slate-700">
                                <div><p className="text-sm text-slate-500">Total a facturar</p><p className="mt-1 text-xs text-slate-500">IVA: {impuestosPendientes ? 'Por seleccionar' : '$' + totalesVista.iva.toFixed(2)}</p></div>
                                <p className="text-3xl font-semibold tracking-tight dark:text-white">{impuestosPendientes ? 'Por confirmar' : '$' + totalesVista.total.toFixed(2)}</p>
                            </div>
                            <button
                                onClick={handleGenerateInvoice}
                                disabled={processing || searchingCliente || loading || consultaFallida}
                                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Generando XML y
                                        Firmando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" /> Emitir Factura al SRI
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
