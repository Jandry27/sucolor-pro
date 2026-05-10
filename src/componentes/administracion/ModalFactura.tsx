import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    X,
    FileText,
    Loader2,
    Send,
    CheckCircle2,
    AlertTriangle,
    Download,
    Search,
} from 'lucide-react';
import type { AdminOrder, Invoice, OrdenGasto } from '@/tipos';

interface ModalFacturaProps {
    isOpen: boolean;
    onClose: () => void;
    order: AdminOrder;
}

// ── RIDE HTML generator (Formato SRI Oficial) ──────────────────────────────────
function generateRideHtml(data: {
    empresa: { razon_social: string; ruc: string; direccion_matriz: string; nombre_comercial?: string; obligado_contabilidad?: boolean; contribuyente_especial?: string; rimpe?: boolean };
    comprador: { nombre: string; identificacion: string; direccion: string; email: string; telefono?: string };
    factura: {
        secuencial: string;
        claveAcceso: string;
        fechaEmision: string;
        fechaAutorizacion: string;
        numeroAutorizacion: string;
        items: Array<{
            codigo: string;
            descripcion: string;
            cantidad: string;
            precioUnitario: string;
            descuento: string;
            precioTotal: string;
        }>;
        subtotal0: string;
        subtotal15: string;
        subtotalNoObjeto: string;
        subtotalExento: string;
        subtotalSinImpuestos: string;
        totalDescuento: string;
        iva15: string;
        propina: string;
        importeTotal: string;
        formaPago: string;
        formaPagoDescripcion: string;
    };
    vehiculo?: { placa?: string; marca?: string; modelo?: string };
    notas?: string;
    logoUrl?: string;
}): string {
    const esc = (s: string | undefined | null) =>
        (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const itemsRows = data.factura.items
        .map(
            item => `
        <tr>
            <td class="tc">${esc(item.codigo)}</td>
            <td class="tc">${item.cantidad}</td>
            <td>${esc(item.descripcion)}</td>
            <td></td>
            <td class="tr">${item.precioUnitario}</td>
            <td class="tr">0.00</td>
            <td class="tr">${item.descuento}</td>
            <td class="tr">${item.precioTotal}</td>
        </tr>`
        )
        .join('');

    const infoAdicionalRows: string[] = [];
    if (data.comprador.telefono)
        infoAdicionalRows.push(
            `<tr><td class="ia-lbl">Teléfono:</td><td>${esc(data.comprador.telefono)}</td></tr>`
        );
    if (data.comprador.email)
        infoAdicionalRows.push(
            `<tr><td class="ia-lbl">Email:</td><td>${esc(data.comprador.email)}</td></tr>`
        );
    if (data.vehiculo?.placa) {
        const vehicleInfo = [data.vehiculo.marca, data.vehiculo.modelo].filter(Boolean).join(' ');
        infoAdicionalRows.push(
            `<tr><td class="ia-lbl">Vehículo:</td><td>Placa ${data.vehiculo.placa}${vehicleInfo ? ` - ${vehicleInfo}` : ''}</td></tr>`
        );
    }
    if (data.notas)
        infoAdicionalRows.push(
            `<tr><td class="ia-lbl">Observación:</td><td>${esc(data.notas)}</td></tr>`
        );

    // SVG barcode for Code 128B
    const barcodeChars = data.factura.claveAcceso;
    let barcodeSvg = '';
    if (barcodeChars) {
        // Simple Code128-like visual with thin/thick bars
        const bars: string[] = [];
        let x = 0;
        for (let i = 0; i < barcodeChars.length; i++) {
            const charCode = barcodeChars.charCodeAt(i);
            const w1 = (charCode % 3) + 1;
            const w2 = (charCode % 2) + 1;
            bars.push(`<rect x="${x}" y="0" width="${w1}" height="50" fill="black"/>`);
            x += w1 + w2;
        }
        const totalW = x;
        barcodeSvg = `<svg viewBox="0 0 ${totalW} 50" style="width:100%;max-width:380px;height:50px" xmlns="http://www.w3.org/2000/svg">${bars.join('')}</svg>`;
    }

    const logoImg = data.logoUrl
        ? `<img src="${data.logoUrl}" alt="Logo" style="max-height:80px;max-width:200px;object-fit:contain">`
        : `<div style="font-size:32px;font-weight:900;color:#ea580c;font-family:Arial,sans-serif">SuColor</div>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>RIDE - ${data.factura.secuencial}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 15px; }
  .ride { max-width: 780px; margin: 0 auto; }

  /* ── TOP SECTION: 2 columns ── */
  .top-section { display: flex; border: 1.5px solid #000; margin-bottom: 0; }
  .top-left { flex: 1; padding: 12px 15px; border-right: 1.5px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 8px; }
  .top-left .logo { margin-bottom: 4px; text-align: center; }
  .top-left .empresa-info { text-align: center; width: 100%; }
  .empresa-razon { font-size: 11px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; }
  .empresa-detail { font-size: 10px; margin-bottom: 3px; }
  .empresa-detail b { min-width: 110px; display: inline-block; text-align: left; }
  .obligado { margin-top: 8px; font-size: 10px; font-weight: bold; display: flex; gap: 20px; }

  .top-right { min-width: 300px; width: 42%; padding: 12px 15px; }
  .ruc-line { font-size: 13px; font-weight: bold; margin-bottom: 4px; }
  .ruc-line span { font-weight: normal; }
  .factura-title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
  .factura-num { font-size: 13px; font-weight: bold; color: #000; margin-bottom: 8px; }
  .right-detail { font-size: 10px; margin-bottom: 3px; }
  .right-detail b { display: inline-block; min-width: 130px; }

  /* ── CLAVE ACCESO ── */
  .clave-section { border: 1.5px solid #000; border-top: 0; padding: 10px 15px; text-align: center; }
  .clave-title { font-size: 10px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; }
  .clave-barcode { margin: 6px auto; }
  .clave-value { font-family: 'Courier New', monospace; font-size: 10px; word-break: break-all; letter-spacing: 0.5px; }

  /* ── DATOS COMPRADOR ── */
  .comprador-section { border: 1.5px solid #000; border-top: 0; padding: 10px 15px; }
  .comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 20px; font-size: 10px; }
  .comp-grid .comp-item { display: flex; gap: 4px; }
  .comp-grid .comp-item b { min-width: 135px; flex-shrink: 0; }

  /* ── TABLA ITEMS ── */
  .items-section { border: 1.5px solid #000; border-top: 0; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items th { background: #f0f0f0; padding: 5px 6px; font-size: 9px; text-transform: uppercase; font-weight: bold; border: 1px solid #000; text-align: center; }
  table.items td { padding: 5px 6px; font-size: 10px; border: 1px solid #ccc; vertical-align: top; }
  table.items td.tc { text-align: center; }
  table.items td.tr { text-align: right; font-family: 'Courier New', monospace; }

  /* ── BOTTOM: Info Adicional + Totales ── */
  .bottom-section { display: flex; border: 1.5px solid #000; border-top: 0; }
  .bottom-left { flex: 1; border-right: 1.5px solid #000; padding: 8px 12px; }
  .bottom-right { min-width: 280px; width: 38%; padding: 0; }

  .ia-title { font-size: 10px; font-weight: bold; text-align: center; background: #f0f0f0; border: 1px solid #ccc; padding: 3px; margin-bottom: 4px; text-transform: uppercase; }
  table.ia { width: 100%; font-size: 10px; border-collapse: collapse; }
  table.ia td { padding: 2px 4px; vertical-align: top; }
  table.ia .ia-lbl { font-weight: bold; min-width: 80px; white-space: nowrap; }

  .pago-title { font-size: 10px; font-weight: bold; text-align: center; background: #f0f0f0; border: 1px solid #ccc; padding: 3px; margin-top: 8px; text-transform: uppercase; }
  table.pago { width: 100%; font-size: 10px; border-collapse: collapse; margin-top: 0; }
  table.pago th { background: #f0f0f0; padding: 3px 6px; font-size: 9px; border: 1px solid #ccc; font-weight: bold; }
  table.pago td { padding: 3px 6px; border: 1px solid #ccc; }

  /* Totals */
  table.totals { width: 100%; border-collapse: collapse; }
  table.totals td { padding: 3px 8px; font-size: 10px; border-bottom: 1px solid #eee; }
  table.totals .t-lbl { font-weight: bold; text-transform: uppercase; }
  table.totals .t-val { text-align: right; font-family: 'Courier New', monospace; }
  table.totals .t-total { font-weight: bold; font-size: 12px; border-top: 2px solid #000; border-bottom: 2px solid #000; }

  @media print {
    body { padding: 0; }
    .ride { max-width: 100%; }
  }
</style>
</head>
<body>
<div class="ride">

  <!-- TOP SECTION -->
  <div class="top-section">
    <div class="top-left">
      <div class="logo">${logoImg}</div>
      <div class="empresa-info">
        <div class="empresa-razon">${esc(data.empresa.razon_social)}</div>
        ${data.empresa.nombre_comercial && data.empresa.nombre_comercial !== data.empresa.razon_social ? `<div class="empresa-detail" style="font-weight:bold;font-size:11px;margin-bottom:6px">${esc(data.empresa.nombre_comercial)}</div>` : ''}
        <div class="empresa-detail"><b>Dirección Matriz:</b> ${esc(data.empresa.direccion_matriz)}</div>
        <div class="empresa-detail"><b>Dirección Sucursal:</b> ${esc(data.empresa.direccion_matriz)}</div>
        <div class="obligado">
          <span>OBLIGADO A LLEVAR CONTABILIDAD: ${data.empresa.obligado_contabilidad ? 'SÍ' : 'NO'}</span>
        </div>
        ${data.empresa.contribuyente_especial ? `<div class="empresa-detail" style="margin-top:4px"><b>Contribuyente Especial:</b> ${esc(data.empresa.contribuyente_especial)}</div>` : ''}
        ${data.empresa.rimpe ? `<div class="empresa-detail" style="margin-top:4px;font-weight:bold">CONTRIBUYENTE RÉGIMEN RIMPE</div>` : ''}
      </div>
    </div>
    <div class="top-right">
      <div class="ruc-line">R.U.C.: ${esc(data.empresa.ruc)}</div>
      <div class="factura-title">FACTURA</div>
      <div class="factura-num">No. ${esc(data.factura.secuencial)}</div>
      <div class="right-detail"><b>NÚMERO DE AUTORIZACIÓN</b></div>
      <div style="font-family:'Courier New',monospace;font-size:9px;margin-bottom:6px;word-break:break-all">${esc(data.factura.numeroAutorizacion || data.factura.claveAcceso)}</div>
      <div class="right-detail"><b>FECHA Y HORA DE AUTORIZACIÓN:</b> ${esc(data.factura.fechaAutorizacion)}</div>
      <div class="right-detail" style="margin-top:8px"><b>AMBIENTE:</b> PRODUCCIÓN</div>
      <div class="right-detail"><b>EMISIÓN:</b> NORMAL</div>
      <div style="margin-top:10px">
        <div class="clave-title">CLAVE DE ACCESO</div>
        <div class="clave-barcode">${barcodeSvg}</div>
        <div class="clave-value">${esc(data.factura.claveAcceso)}</div>
      </div>
    </div>
  </div>

  <!-- DATOS COMPRADOR -->
  <div class="comprador-section">
    <div class="comp-grid">
      <div class="comp-item"><b>Razón Social / Nombres y Apellidos:</b> ${esc(data.comprador.nombre)}</div>
      <div class="comp-item"><b>Identificación:</b> ${esc(data.comprador.identificacion)}</div>
      <div class="comp-item"><b>Fecha Emisión:</b> ${esc(data.factura.fechaEmision)}</div>
      <div class="comp-item"><b>Placa / Matrícula:</b> ${esc(data.vehiculo?.placa || '')}</div>
      <div class="comp-item"><b>Dirección:</b> ${esc(data.comprador.direccion)}</div>
      <div class="comp-item"><b>Guía:</b></div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <div class="items-section">
    <table class="items">
      <thead>
        <tr>
          <th style="width:55px">Cod. Principal</th>
          <th style="width:45px">Cantidad</th>
          <th>Descripción</th>
          <th style="width:80px">Detalle Adicional</th>
          <th style="width:70px">Precio Unitario</th>
          <th style="width:55px">Subsidio</th>
          <th style="width:60px">Descuento</th>
          <th style="width:70px">Precio Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
  </div>

  <!-- BOTTOM: Info Adicional + Totales -->
  <div class="bottom-section">
    <div class="bottom-left">
      <div class="ia-title">Información Adicional</div>
      <table class="ia">
        ${infoAdicionalRows.join('')}
      </table>

      <div class="pago-title">Forma de Pago</div>
      <table class="pago">
        <thead><tr><th>Descripción</th><th style="width:80px">Valor</th></tr></thead>
        <tbody>
          <tr><td>${esc(data.factura.formaPagoDescripcion)}</td><td style="text-align:right;font-family:'Courier New',monospace">${data.factura.importeTotal}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="bottom-right">
      <table class="totals">
        <tr><td class="t-lbl">SUBTOTAL 0%</td><td class="t-val">${data.factura.subtotal0}</td></tr>
        <tr><td class="t-lbl">SUBTOTAL IVA 15%</td><td class="t-val">${data.factura.subtotal15}</td></tr>
        <tr><td class="t-lbl">SUBTOTAL NO OBJETO DE IVA</td><td class="t-val">${data.factura.subtotalNoObjeto}</td></tr>
        <tr><td class="t-lbl">SUBTOTAL EXENTO DE IVA</td><td class="t-val">${data.factura.subtotalExento}</td></tr>
        <tr><td class="t-lbl" style="font-weight:900">SUBTOTAL SIN IMPUESTOS</td><td class="t-val" style="font-weight:900">${data.factura.subtotalSinImpuestos}</td></tr>
        <tr><td class="t-lbl">TOTAL DESCUENTO</td><td class="t-val">${data.factura.totalDescuento}</td></tr>
        <tr><td class="t-lbl">IVA 15%</td><td class="t-val">${data.factura.iva15}</td></tr>
        <tr><td class="t-lbl">PROPINA</td><td class="t-val">${data.factura.propina}</td></tr>
        <tr class="t-total"><td class="t-lbl">VALOR TOTAL</td><td class="t-val">${data.factura.importeTotal}</td></tr>
      </table>
    </div>
  </div>

</div>
<script>window.onload=()=>window.print();</script>
</body>
</html>`;
}

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
        }
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

    // ── Auto-completar cliente por cédula ──────────────────────────────────────
    const buscarClientePorCedula = useCallback(async (cedula: string) => {
        if (!cedula || cedula.length < 10) {
            setClienteFound(null);
            return;
        }

        setSearchingCliente(true);
        setClienteFound(null);

        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('cedula', cedula)
                .limit(1)
                .maybeSingle();

            if (!error && data) {
                setClienteNombre(data.nombres || data.nombre || '');
                setClienteDireccion(data.direccion || '');
                setClienteEmail(data.email || '');
                setClienteTelefono(data.telefono || '');
                if (data.tipo_identificacion) setClienteDocTipo(data.tipo_identificacion);
                setClienteFound(true);
            } else {
                setClienteFound(false);
            }
        } catch (err) {
            console.error('Error buscando cliente:', err);
            setClienteFound(false);
        } finally {
            setSearchingCliente(false);
        }
    }, []);

    const handleCedulaChange = (value: string) => {
        setClienteDoc(value);
        setClienteFound(null);

        // Debounce: buscar después de 500ms de no tipear
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (value.length >= 10) {
            searchTimeout.current = setTimeout(() => {
                buscarClientePorCedula(value);
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
        const cliente = order.cliente as any;

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

        const subtotalVal = invoiceItems.reduce((s, i) => s + parseFloat(i.precioTotal), 0);
        const sub0 = subtotalVal; // Assuming IVA 0% for now based on existing behavior
        const sub15 = 0;
        const ivaVal = sub15 * 0.15;

        const fechaAuth = existingInvoice.autorizacion_fecha
            ? new Date(existingInvoice.autorizacion_fecha).toLocaleString('es-EC')
            : '';

        const html = generateRideHtml({
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
                nombre: cliente?.nombres || cliente?.nombre || clienteNombre || 'CONSUMIDOR FINAL',
                identificacion: cliente?.cedula || clienteDoc || '9999999999999',
                direccion: cliente?.direccion || clienteDireccion || 'N/A',
                email: cliente?.email || clienteEmail || '',
                telefono: cliente?.telefono || clienteTelefono || '',
            },
            factura: {
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
                subtotalNoObjeto: '0.00',
                subtotalExento: '0.00',
                subtotalSinImpuestos: subtotalVal.toFixed(2),
                totalDescuento: '0.00',
                iva15: ivaVal.toFixed(2),
                propina: '0.00',
                importeTotal: (subtotalVal + ivaVal).toFixed(2),
                formaPago: '01',
                formaPagoDescripcion: 'SIN UTILIZACIÓN DEL SISTEMA FINANCIERO',
            },
            vehiculo: order.vehiculo
                ? {
                      placa: order.vehiculo.placa,
                      marca: order.vehiculo.marca,
                      modelo: order.vehiculo.modelo,
                  }
                : undefined,
            notas: notasVenta || undefined,
            logoUrl: '/logo.png',
        });

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    };

    const handleGenerateInvoice = async () => {
        if (!order.cliente_id) {
            setError('La orden debe tener un cliente asignado para poder facturar.');
            return;
        }
        if (!clienteDoc) {
            setError('Falta ingresar la identificación del cliente (Cédula/RUC).');
            return;
        }
        if (!clienteNombre) {
            setError('Falta ingresar la Razón Social / Nombre del cliente.');
            return;
        }
        if (!clienteDireccion) {
            setError('Falta ingresar la dirección del cliente.');
            return;
        }
        if (!clienteEmail) {
            setError('Falta ingresar el correo electrónico del cliente para enviar la factura.');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // Update client data in BD before invoicing
            if (order.cliente_id) {
                await supabase
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

            await checkExistingInvoice();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocurrió un error al procesar la factura con el SRI');
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    const totalManoObra = order.precio_total || 0;
    const totalGasto = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
    const subtotal = totalManoObra + totalGasto;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-orange" />
                        Facturación Electrónica SRI
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
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
                            {/* Formulario Cliente */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-semibold mb-3 dark:text-white">
                                    Datos del Cliente para el SRI
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2 flex gap-3">
                                        <div className="w-1/3">
                                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                                                Tipo Doc.
                                            </label>
                                            <select
                                                value={clienteDocTipo}
                                                onChange={e => setClienteDocTipo(e.target.value)}
                                                className="w-full text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-brand-orange dark:text-white"
                                            >
                                                <option value="05">Cédula (05)</option>
                                                <option value="04">RUC (04)</option>
                                                <option value="06">Pasaporte (06)</option>
                                            </select>
                                        </div>
                                        <div className="w-2/3">
                                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                                                Identificación *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={clienteDoc}
                                                    onChange={e =>
                                                        handleCedulaChange(e.target.value)
                                                    }
                                                    placeholder="Ingresa la cédula para buscar..."
                                                    className="w-full text-sm p-2 pr-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-brand-orange dark:text-white"
                                                />
                                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                                    {searchingCliente ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
                                                    ) : clienteFound === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : clienteFound === false ? (
                                                        <Search className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <Search className="w-4 h-4 text-slate-300" />
                                                    )}
                                                </div>
                                            </div>
                                            {clienteFound === true && (
                                                <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium">
                                                    ✓ Cliente encontrado — datos autocompletados
                                                </p>
                                            )}
                                            {clienteFound === false && clienteDoc.length >= 10 && (
                                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                                                    Cliente no registrado — ingresa los datos
                                                    manualmente
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                                            Razón Social / Nombres y Apellidos *
                                        </label>
                                        <input
                                            type="text"
                                            value={clienteNombre}
                                            onChange={e => setClienteNombre(e.target.value)}
                                            className="w-full text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-brand-orange dark:text-white"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                                            Dirección *
                                        </label>
                                        <input
                                            type="text"
                                            value={clienteDireccion}
                                            onChange={e => setClienteDireccion(e.target.value)}
                                            className="w-full text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-brand-orange dark:text-white"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                                            Correo Electrónico *
                                        </label>
                                        <input
                                            type="email"
                                            value={clienteEmail}
                                            onChange={e => setClienteEmail(e.target.value)}
                                            className="w-full text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-brand-orange dark:text-white"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                                            Teléfono
                                        </label>
                                        <input
                                            type="text"
                                            value={clienteTelefono}
                                            onChange={e => setClienteTelefono(e.target.value)}
                                            className="w-full text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-brand-orange dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <h3 className="text-sm font-semibold mb-3 dark:text-white">
                                    Detalles a Facturar
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-300">
                                            Mano de Obra (Orden {order.codigo})
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={ivaManoObra}
                                                onChange={e =>
                                                    setIvaManoObra(Number(e.target.value))
                                                }
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs outline-none"
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
                                        <span>Subtotal sin impuestos:</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Forma de Pago */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <label className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
                                    Forma de Pago
                                </label>
                                <select
                                    value={formaPago}
                                    onChange={e => setFormaPago(e.target.value)}
                                    className="w-full text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-brand-orange dark:text-white"
                                >
                                    {Object.entries(FORMAS_PAGO).map(([code, desc]) => (
                                        <option key={code} value={code}>
                                            {code} - {desc}
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

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                    Notas adicionales en la factura (Opcional)
                                </label>
                                <textarea
                                    className="w-full text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 resize-none focus:ring-1 focus:ring-brand-orange outline-none dark:text-white"
                                    rows={2}
                                    placeholder="Ej. Pago con transferencia"
                                    value={notasVenta}
                                    onChange={e => setNotasVenta(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleGenerateInvoice}
                                disabled={processing}
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
