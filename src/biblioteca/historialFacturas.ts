import type { Invoice } from '@/tipos';
import { generarFacturaHtml } from '../../supabase/functions/_shared/facturaHtml';

export type FacturaHistorial = Pick<
    Invoice,
    | 'id'
    | 'orden_id'
    | 'secuencial'
    | 'clave_acceso'
    | 'estado'
    | 'ambiente'
    | 'fecha_emision'
    | 'importe_total'
    | 'xml_generado'
    | 'autorizacion_fecha'
>;

export function leerComprobante(xml: string | null) {
    if (!xml) return null;
    const documento = new DOMParser().parseFromString(xml, 'application/xml');
    if (documento.querySelector('parsererror') || !documento.querySelector('factura')) return null;
    return documento;
}

export function compradorFactura(factura: FacturaHistorial) {
    const documento = leerComprobante(factura.xml_generado);
    return {
        nombre:
            documento?.querySelector('razonSocialComprador')?.textContent ||
            'Comprador no disponible',
        identificacion: documento?.querySelector('identificacionComprador')?.textContent || '—',
    };
}

// El filtro se aplica en el servidor a todo el historial, no solo a la página visible.
export function filtroBusquedaFactura(busqueda: string) {
    const texto = busqueda
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const patron = `%${texto.replace(/[\\%_]/g, '\\$&')}%`;
    const literal = JSON.stringify(patron);
    return `secuencial.ilike.${literal},clave_acceso.ilike.${literal},xml_generado.ilike.${literal}`;
}

export function fechaFactura(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function htmlFacturaArchivada(factura: FacturaHistorial, imprimir = false) {
    const documento = leerComprobante(factura.xml_generado);
    if (!documento) throw new Error('Esta factura no tiene un comprobante XML válido guardado.');
    const valor = (selector: string) => documento.querySelector(selector)?.textContent || '';
    const adicional = (nombre: string) =>
        Array.from(documento.querySelectorAll('campoAdicional')).find(
            campo => campo.getAttribute('nombre')?.toLowerCase() === nombre
        )?.textContent || '';
    const impuestos = Array.from(documento.querySelectorAll('totalConImpuestos > totalImpuesto'));
    const base = (codigo: string) =>
        impuestos
            .filter(i => i.querySelector('codigoPorcentaje')?.textContent === codigo)
            .reduce(
                (total, i) => total + Number(i.querySelector('baseImponible')?.textContent || 0),
                0
            )
            .toFixed(2);
    const iva = impuestos
        .filter(i => i.querySelector('codigo')?.textContent === '2')
        .reduce((total, i) => total + Number(i.querySelector('valor')?.textContent || 0), 0)
        .toFixed(2);
    const pago = valor('pagos > pago > formaPago');
    const pagos: Record<string, string> = {
        '01': 'SIN UTILIZACIÓN DEL SISTEMA FINANCIERO',
        '15': 'COMPENSACIÓN DE DEUDAS',
        '16': 'TARJETA DE DÉBITO',
        '17': 'DINERO ELECTRÓNICO',
        '18': 'TARJETA PREPAGO',
        '19': 'TARJETA DE CRÉDITO',
        '20': 'OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO',
        '21': 'ENDOSO DE TÍTULOS',
    };
    return generarFacturaHtml(
        {
            empresa: {
                razon_social: valor('infoTributaria > razonSocial'),
                ruc: valor('infoTributaria > ruc'),
                nombre_comercial: valor('nombreComercial'),
                direccion_matriz: valor('dirMatriz'),
                obligado_contabilidad: valor('obligadoContabilidad') === 'SI',
                contribuyente_especial: valor('contribuyenteEspecial'),
                rimpe: Boolean(valor('contribuyenteRimpe')),
            },
            comprador: {
                nombre: valor('razonSocialComprador'),
                identificacion: valor('identificacionComprador'),
                direccion: valor('direccionComprador'),
                email: adicional('email'),
                telefono: adicional('telefono'),
            },
            factura: {
                ambiente: factura.ambiente,
                secuencial: factura.secuencial || '',
                claveAcceso: factura.clave_acceso || '',
                numeroAutorizacion: factura.clave_acceso || '',
                fechaEmision: valor('fechaEmision') || fechaFactura(factura.fecha_emision),
                fechaAutorizacion: factura.autorizacion_fecha
                    ? new Date(factura.autorizacion_fecha).toLocaleString('es-EC', {
                          timeZone: 'America/Guayaquil',
                      })
                    : '',
                items: Array.from(documento.querySelectorAll('detalles > detalle')).map(detalle => {
                    const dato = (campo: string) => detalle.querySelector(campo)?.textContent || '';
                    return {
                        codigo: dato('codigoPrincipal'),
                        descripcion: dato('descripcion'),
                        cantidad: dato('cantidad'),
                        precioUnitario: dato('precioUnitario'),
                        descuento: dato('descuento') || '0.00',
                        precioTotal: dato('precioTotalSinImpuesto'),
                    };
                }),
                subtotal0: base('0'),
                subtotal15: base('4'),
                subtotalNoObjeto: base('6'),
                subtotalExento: base('7'),
                subtotalSinImpuestos: valor('totalSinImpuestos'),
                totalDescuento: valor('totalDescuento') || '0.00',
                iva15: iva,
                propina: valor('propina') || '0.00',
                importeTotal: valor('importeTotal'),
                formaPago: pago,
                formaPagoDescripcion: pagos[pago] || pago,
            },
            logoUrl: new URL('/logo.png', window.location.origin).href,
        },
        { imprimir }
    );
}
