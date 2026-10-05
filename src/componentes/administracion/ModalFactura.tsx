import { useState, useEffect, useRef, useCallback } from 'react';
import { generarFacturaHtml } from '../../../supabase/functions/_shared/facturaHtml';
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
const FORMAS_PAGO: Record<string, string> = {
    '01': 'SIN UTILIZACIÓN DEL SISTEMA FINANCIERO',
    '15': 'COMPENSACIÓN DE DEUDAS',
    '16': 'TARJETA DE DÉBITO',
    '17': 'DINERO ELECTRÓNICO',
    '18': 'TARJETA PREPAGO',
    '19': 'TARJETA DE CRÉDITO',
    '20': 'OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO',
    '21': 'ENDOSO DE TÍTULOS',
};

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
    const [ivaManoObra, setIvaManoObra] = useState<number>(0);
    const [formaPago, setFormaPago] = useState('01');
    const [notasVenta, setNotasVenta] = useState('');

    useEffect(() => {
        if (isOpen) {
            checkExistingInvoice();
            loadGastos();
            setClienteFound(null);
            setMensajeBusqueda('');
            setSearchingCliente(false);
            setError(null);
            setAvisoCorreo(null);
            setExistingInvoice(null);
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
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('orden_id', order.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.warn(
                'Tabla invoices no existe localmente, asumiendo que no hay factura:',
                error.message
            );
        }
        if (data) setExistingInvoice(data);
        setLoading(false);
    };

    const loadGastos = async () => {
        const { data } = await supabase.from('orden_gastos').select('*').eq('orden_id', order.id);
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
    const handleDownloadRIDE = async () => {
        if (!existingInvoice) return;

        const { data: settings } = await supabase
            .from('company_settings')
            .select('*')
            .limit(1)
            .maybeSingle();
        const empresa = settings || {
            razon_social: 'Empresa',
            ruc: '',
            direccion_matriz: '',
            nombre_comercial: '',
        };
        const cliente = order.cliente;
        // El comprador del comprobante puede ser distinto al propietario de la orden.
        const xmlFactura = existingInvoice.xml_generado
            ? new DOMParser().parseFromString(existingInvoice.xml_generado, 'application/xml')
            : null;
        const datoComprador = (etiqueta: string) => xmlFactura?.querySelector(etiqueta)?.textContent || '';
        const datoAdicional = (nombre: string) => Array.from(xmlFactura?.querySelectorAll('campoAdicional') || [])
            .find(campo => campo.getAttribute('nombre')?.toLowerCase() === nombre)?.textContent || '';

        // Build items
        const totalMO = order.precio_total || 0;
        const invoiceItems: Array<{
            codigo: string;
            descripcion: string;
            cantidad: string;
            precioUnitario: string;
            descuento: string;
            precioTotal: string;
        }> = [];

        if (totalMO > 0) {
            invoiceItems.push({
                codigo: 'MANO_OBRA',
                descripcion: `Servicio automotriz reparación/pintura placa ${order.vehiculo?.placa || ''}`,
                cantidad: '1.00',
                precioUnitario: totalMO.toFixed(2),
                descuento: '0.00',
                precioTotal: totalMO.toFixed(2),
            });
        }
        for (const g of gastos) {
            invoiceItems.push({
                codigo: `REP`,
                descripcion: g.descripcion,
                cantidad: '1.00',
                precioUnitario: Number(g.monto).toFixed(2),
                descuento: '0.00',
                precioTotal: Number(g.monto).toFixed(2),
            });
        }

        // El documento emitido es la fuente; la orden puede cambiar después.
        const detallesXml = Array.from(xmlFactura?.querySelectorAll('detalles > detalle') || []);
        if (detallesXml.length) {
            invoiceItems.splice(0, invoiceItems.length, ...detallesXml.map(detalle => {
                const valor = (nombre: string) => detalle.querySelector(nombre)?.textContent || '';
                return {
                    codigo: valor('codigoPrincipal'), descripcion: valor('descripcion'),
                    cantidad: valor('cantidad'), precioUnitario: valor('precioUnitario'),
                    descuento: valor('descuento') || '0.00', precioTotal: valor('precioTotalSinImpuesto'),
                };
            }));
        }
        const sub0 = Number(existingInvoice.subtotal_0 || 0);
        const sub15 = Number(existingInvoice.subtotal_15 || 0);
        const ivaVal = Number(existingInvoice.valor_iva || 0);
        const subtotalVal = Number(datoComprador('totalSinImpuestos') ||
            sub0 + sub15 + Number(existingInvoice.subtotal_no_objeto || 0) + Number(existingInvoice.subtotal_exento || 0));
        const codigoPago = datoComprador('pagos > pago > formaPago') || '01';

        const fechaAuth = existingInvoice.autorizacion_fecha
            ? new Date(existingInvoice.autorizacion_fecha).toLocaleString('es-EC')
            : '';

        const html = generarFacturaHtml({
            empresa: {
                razon_social: empresa.razon_social,
                ruc: empresa.ruc,
                direccion_matriz: empresa.direccion_matriz,
                nombre_comercial: empresa.nombre_comercial,
                obligado_contabilidad: empresa.obligado_contabilidad,
                contribuyente_especial: empresa.contribuyente_especial,
                rimpe: empresa.rimpe,
            },
            comprador: {
                nombre: datoComprador('razonSocialComprador') || clienteNombre || cliente?.nombres || 'CONSUMIDOR FINAL',
                identificacion: datoComprador('identificacionComprador') || clienteDoc || cliente?.cedula || '9999999999999',
                direccion: datoComprador('direccionComprador') || clienteDireccion || cliente?.direccion || 'N/A',
                email: datoAdicional('email') || clienteEmail || cliente?.email || '',
                telefono: datoAdicional('telefono') || clienteTelefono || cliente?.telefono || '',
            },
            factura: {
                ambiente: existingInvoice.ambiente,
                secuencial: existingInvoice.secuencial || '',
                claveAcceso: existingInvoice.clave_acceso || '',
                fechaEmision: existingInvoice.fecha_emision
                    ? new Date(existingInvoice.fecha_emision).toLocaleDateString('es-EC')
                    : '',
                fechaAutorizacion: fechaAuth,
                numeroAutorizacion: existingInvoice.clave_acceso || '',
                items: invoiceItems,
                subtotal0: sub0.toFixed(2),
                subtotal15: sub15.toFixed(2),
                subtotalNoObjeto: Number(existingInvoice.subtotal_no_objeto || 0).toFixed(2),
                subtotalExento: Number(existingInvoice.subtotal_exento || 0).toFixed(2),
                subtotalSinImpuestos: subtotalVal.toFixed(2),
                totalDescuento: Number(datoComprador('totalDescuento') || existingInvoice.total_descuento || 0).toFixed(2),
                iva15: ivaVal.toFixed(2),
                propina: Number(datoComprador('propina') || 0).toFixed(2),
                importeTotal: Number(existingInvoice.importe_total).toFixed(2),
                formaPago: codigoPago,
                formaPagoDescripcion: FORMAS_PAGO[codigoPago] || codigoPago,
            },
            vehiculo: order.vehiculo
                ? {
                      placa: order.vehiculo.placa,
                      marca: order.vehiculo.marca,
                      modelo: order.vehiculo.modelo,
                  }
                : undefined,
            notas: notasVenta || undefined,
            logoUrl: new URL('/logo.png', window.location.origin).href,
        }, { imprimir: true });

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    };

    const handleGenerateInvoice = async () => {
        if (emisionBloqueada.current || searchingCliente) return;
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
                        descripcion: `Servicio automotriz reparación/pintura placa ${order.vehiculo.placa}`,
                        precio_total_sin_impuestos: order.precio_total || 0,
                        tarifa_iva: ivaManoObra,
                    },
                    ...gastos.map(g => ({
                        codigo_principal: `REP_${g.id.substring(0, 5)}`,
                        descripcion: g.descripcion,
                        precio_total_sin_impuestos: g.monto,
                        tarifa_iva: 0,
                    })),
                ],
                forma_pago: formaPago,
                notas: notasVenta,
            };

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
                                <div className="space-y-3">
                                    <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
                                        <span className="text-slate-600 dark:text-slate-300">
                                            Mano de Obra (Orden {order.codigo})
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <select
                                                aria-label="IVA de mano de obra" disabled={processing}
                                                value={ivaManoObra}
                                                onChange={e =>
                                                    setIvaManoObra(Number(e.target.value))
                                                }
                                                className="min-h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-base outline-none"
                                            >
                                                <option value={0}>IVA 0%</option>
                                                <option value={15}>IVA 15%</option>
                                            </select>
                                            <span className="font-medium dark:text-white">
                                                ${totalManoObra.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {gastos.length > 0 && (
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <span className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                                                Repuestos / Adicionales
                                            </span>
                                            {gastos.map(g => (
                                                <div
                                                    key={g.id}
                                                    className="flex justify-between items-center text-sm mb-1.5"
                                                >
                                                    <span className="text-slate-600 dark:text-slate-300 truncate pr-4">
                                                        {g.descripcion}
                                                    </span>
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
                                <div><p className="text-sm text-slate-500">Total a facturar</p><p className="mt-1 text-xs text-slate-500">IVA: ${(totalManoObra * ivaManoObra / 100).toFixed(2)}</p></div>
                                <p className="text-3xl font-semibold tracking-tight dark:text-white">${(subtotal + totalManoObra * ivaManoObra / 100).toFixed(2)}</p>
                            </div>
                            <button
                                onClick={handleGenerateInvoice}
                                disabled={processing || searchingCliente || loading}
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
