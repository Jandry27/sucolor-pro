export type DatosFactura = {
    empresa: {
        razon_social: string;
        ruc: string;
        direccion_matriz: string;
        nombre_comercial?: string;
        obligado_contabilidad?: boolean;
        contribuyente_especial?: string;
        rimpe?: boolean;
    };
    comprador: {
        nombre: string;
        identificacion: string;
        direccion: string;
        email: string;
        telefono?: string;
    };
    factura: {
        ambiente?: number;
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
};

// Plantilla compartida: estilos esenciales inline para clientes de correo.
export function generarFacturaHtml(data: DatosFactura, opciones: { imprimir?: boolean } = {}): string {
    const esc = (valor: unknown) => String(valor ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const etiqueta = 'font-size:10px;line-height:1.5;color:#77716b;text-transform:uppercase;letter-spacing:1px';
    const numero = 'text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap';
    const filas = data.factura.items.map(item => `<tr>
        <td class="descripcion" style="padding:14px 10px 14px 0;border-bottom:1px solid #ece8e2;overflow-wrap:anywhere"><strong style="font-weight:600">${esc(item.descripcion)}</strong><br><span style="font-size:10px;color:#77716b">${esc(item.codigo)}</span></td>
        <td style="padding:14px 7px;border-bottom:1px solid #ece8e2;${numero}">${esc(item.cantidad)}</td>
        <td style="padding:14px 7px;border-bottom:1px solid #ece8e2;${numero}">${esc(item.precioUnitario)}</td>
        <td style="padding:14px 7px;border-bottom:1px solid #ece8e2;${numero}">${esc(item.descuento)}</td>
        <td style="padding:14px 0 14px 7px;border-bottom:1px solid #ece8e2;font-weight:600;${numero}">${esc(item.precioTotal)}</td>
    </tr>`).join('');
    const totales: [string, string][] = [
        ['Subtotal 0%', data.factura.subtotal0], ['Subtotal IVA 15%', data.factura.subtotal15],
        ['No objeto de IVA', data.factura.subtotalNoObjeto], ['Exento de IVA', data.factura.subtotalExento],
        ['Subtotal sin impuestos', data.factura.subtotalSinImpuestos], ['Descuento', data.factura.totalDescuento],
        ['IVA 15%', data.factura.iva15], ['Propina', data.factura.propina],
    ].filter(([nombre, valor]) => !['No objeto de IVA', 'Exento de IVA', 'Propina'].includes(nombre) || Number(valor) !== 0) as [string, string][];
    const logoSeguro = data.logoUrl && /^(https?:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(data.logoUrl);
    const logo = logoSeguro ? `<img src="${esc(data.logoUrl)}" alt="SuColor" width="130" style="display:block;width:130px;max-width:100%;height:auto;border:0">` : '<span style="font-size:30px;font-weight:800;letter-spacing:-1px;color:#d4530c">SuColor<span style="color:#222">.</span></span>';
    const ambiente = data.factura.ambiente === 1 ? 'Pruebas' : data.factura.ambiente === 2 ? 'Producción' : 'No especificado';
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factura ${esc(data.factura.secuencial)} · SuColor</title>
<style>
@page { size:A4; margin:12mm; }
* { box-sizing:border-box; }
body { margin:0; }
table { border-collapse:collapse; }
p { margin:0; }
@media screen and (max-width:560px) {
 .hoja { width:100%!important; }
 .interior { padding:24px 18px!important; }
 .columna { display:block!important;width:100%!important;padding-left:0!important;padding-right:0!important; }
 .separar { padding-top:22px!important; }
 .titulo { text-align:left!important; }
 .detalle { font-size:10px!important; }
 .detalle th,.detalle td { padding-left:3px!important;padding-right:3px!important;white-space:normal!important; }
 .descripcion { width:36%!important; }
}
@media print {
 body { background:white!important;padding:0!important; }
 .hoja { max-width:none!important;width:100%!important;border:0!important; }
 .interior { padding:8px 16px!important; }
 .hoja { line-height:1.35!important; }
 .detalle td { padding-top:9px!important;padding-bottom:9px!important; }
 .conservar { margin-top:16px!important; }
 thead { display:table-header-group; }
 .detalle tr,.conservar { break-inside:avoid; }
 .sin-imprimir { display:none!important; }
 * { -webkit-print-color-adjust:exact;print-color-adjust:exact; }
}
</style></head><body style="background:#f3f1ed;padding:28px 10px;font-family:Arial,Helvetica,sans-serif;color:#25221f;font-size:12px;line-height:1.55">
<table role="presentation" class="hoja" style="width:100%;max-width:780px;margin:0 auto;background:white;border:1px solid #e9e4dc;border-top:5px solid #ea6b16"><tr><td class="interior" style="padding:34px 38px">
<table role="presentation" style="width:100%"><tr>
<td class="columna" style="width:53%;vertical-align:top">${logo}<p style="margin-top:12px;${etiqueta}">Pintura · Latonería · Restauración</p><p style="font-size:14px;font-weight:bold;margin-top:16px">${esc(data.empresa.razon_social)}</p><p style="color:#68615a;margin-top:4px">RUC ${esc(data.empresa.ruc)}</p><p style="color:#68615a;max-width:290px;overflow-wrap:anywhere">${esc(data.empresa.direccion_matriz)}</p></td>
<td class="columna separar titulo" style="width:47%;vertical-align:top;text-align:right"><p style="${etiqueta};color:#b84b0d">Comprobante electrónico</p><h1 style="font-size:38px;font-weight:600;letter-spacing:-1.5px;line-height:1.1;margin:9px 0 8px">Factura<span style="color:#ea6b16">.</span></h1><p style="font-size:14px;font-weight:600">${esc(data.factura.secuencial)}</p><p style="margin-top:18px;${etiqueta}">Fecha de emisión</p><p style="font-size:13px">${esc(data.factura.fechaEmision)}</p><p style="margin-top:7px;font-size:10px;color:#77716b">${ambiente} · Emisión normal</p></td>
</tr></table>
<table role="presentation" class="conservar" style="width:100%;margin-top:28px;background:#fcf6ee;border-left:3px solid #ea6b16"><tr><td style="padding:18px 20px">
<p style="${etiqueta};color:#a74d19">Facturado a</p><p style="font-size:18px;font-weight:600;margin:5px 0">${esc(data.comprador.nombre)}</p>
<p style="color:#68615a">Identificación: ${esc(data.comprador.identificacion)}</p><p style="color:#68615a;overflow-wrap:anywhere">${esc(data.comprador.direccion)}</p>
${data.vehiculo?.placa ? `<p style="margin-top:9px;font-size:11px"><strong>Vehículo</strong> &nbsp; ${esc([data.vehiculo.placa, data.vehiculo.marca, data.vehiculo.modelo].filter(Boolean).join(' · '))}</p>` : ''}
</td></tr></table>
<h2 style="font-size:13px;font-weight:600;margin:27px 0 12px">Detalle de servicios y repuestos</h2>
<table class="detalle" style="width:100%;font-size:12px"><thead><tr style="color:#77716b;border-bottom:1px solid #25221f;font-size:10px">
<th scope="col" style="text-align:left;padding:0 8px 9px 0;font-weight:400">Descripción / código</th><th scope="col" style="${numero};padding-bottom:9px;font-weight:400">Cant.</th><th scope="col" style="${numero};padding-bottom:9px;font-weight:400">P. unitario</th><th scope="col" style="${numero};padding-bottom:9px;font-weight:400">Desc.</th><th scope="col" style="${numero};padding-bottom:9px;font-weight:400">Importe</th>
</tr></thead><tbody>${filas}</tbody></table>
<table role="presentation" style="width:100%;margin-top:25px"><tr>
<td class="columna" style="width:49%;vertical-align:top;padding-right:30px">
<p style="${etiqueta}">Forma de pago</p><p style="margin-top:5px">${esc(data.factura.formaPagoDescripcion)}</p><p style="font-size:11px;color:#77716b">Valor: USD ${esc(data.factura.importeTotal)}</p>
${data.comprador.email || data.comprador.telefono ? `<p style="margin-top:20px;${etiqueta}">Contacto del cliente</p><p style="margin-top:5px;overflow-wrap:anywhere">${esc(data.comprador.email)}</p><p>${esc(data.comprador.telefono)}</p>` : ''}
${data.notas ? `<p style="margin-top:20px;${etiqueta}">Observaciones</p><p style="margin-top:5px;overflow-wrap:anywhere">${esc(data.notas)}</p>` : ''}
</td><td class="columna separar" style="width:51%;vertical-align:top">
<table style="width:100%;font-size:11px">${totales.map(([nombre,valor])=>`<tr><td style="padding:4px 10px 4px 0;color:#68615a">${nombre}</td><td style="padding:4px 0;${numero}">${esc(valor)}</td></tr>`).join('')}
<tr><td style="padding:13px 12px;background:#fcf0e2;color:#a7430a;font-weight:bold;border-top:2px solid #ea6b16">TOTAL <span style="font-size:9px;font-weight:normal">USD</span></td><td style="padding:13px 12px;background:#fcf0e2;border-top:2px solid #ea6b16;font-size:23px;letter-spacing:-.5px;font-weight:600;${numero}">$${esc(data.factura.importeTotal)}</td></tr></table>
</td></tr></table>
<div class="conservar" style="margin-top:28px;border-top:1px solid #e9e4dc;padding-top:16px;font-size:10px;color:#77716b">
<p style="${etiqueta}">Información tributaria</p><p style="margin-top:7px">Obligado a llevar contabilidad: ${data.empresa.obligado_contabilidad ? 'Sí' : 'No'}${data.empresa.contribuyente_especial ? ` · Contribuyente especial: ${esc(data.empresa.contribuyente_especial)}` : ''}${data.empresa.rimpe ? ' · Contribuyente régimen RIMPE' : ''}</p>
<p>Fecha y hora de autorización: ${esc(data.factura.fechaAutorizacion || 'No disponible')}</p>
<p style="margin-top:8px">Número de autorización</p><p style="font-family:monospace;overflow-wrap:anywhere;word-break:break-all;color:#444">${esc(data.factura.numeroAutorizacion || data.factura.claveAcceso)}</p>
<p style="margin-top:8px">Clave de acceso</p><p style="font-family:monospace;overflow-wrap:anywhere;word-break:break-all;color:#444">${esc(data.factura.claveAcceso)}</p>
</div>
<div class="conservar" style="margin-top:23px;border-top:1px solid #e9e4dc;padding-top:16px"><p style="font-size:14px;font-weight:600">Gracias por confiar en SuColor<span style="color:#ea6b16">.</span></p><p style="font-size:10px;color:#77716b;margin-top:3px">Cuidamos cada detalle de tu vehículo.</p></div>
</td></tr></table>${opciones.imprimir ? '<script>window.addEventListener("load",()=>window.print());</script>' : ''}</body></html>`;
}
