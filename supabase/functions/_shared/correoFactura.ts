import type { DatosFactura } from './facturaHtml.ts';
import { generarFacturaPdf } from './facturaPdf.ts';

export async function prepararCorreoFactura(datos: DatosFactura) {
    // El adjunto se genera antes de enviar: nunca anunciar un PDF que no existe.
    const pdf = await generarFacturaPdf(datos);
    const numeroSeguro = datos.factura.secuencial.replace(/[^a-zA-Z0-9-]/g, '_');
    const archivo = `Factura-${numeroSeguro || 'SuColor'}.pdf`;
    const esc = (valor: string) => String(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return {
        content: `Hola, ${datos.comprador.nombre}.\nTu factura ${datos.factura.secuencial} por USD ${datos.factura.importeTotal} está adjunta como ${archivo}.\nAbre o descarga el archivo PDF desde los adjuntos de este correo.\nGracias por confiar en SuColor.`,
        html: `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#f5f3ef;font-family:Arial,Helvetica,sans-serif;color:#25221f">
<table role="presentation" style="width:100%;max-width:560px;margin:auto;background:#fff;border-collapse:collapse;border-top:4px solid #ea6b16"><tr><td style="padding:32px 26px">
<p style="margin:0 0 28px;font-size:28px;font-weight:bold;color:#d4530c">SuColor<span style="color:#25221f">.</span></p>
<h1 style="font-size:25px;line-height:1.2;letter-spacing:-.6px;margin:0 0 14px">Tu factura está lista.</h1>
<p style="font-size:14px;line-height:1.7;margin:0;color:#68615a">Hola, ${esc(datos.comprador.nombre)}. Gracias por confiar en nosotros para cuidar tu vehículo.</p>
<table role="presentation" style="width:100%;margin:24px 0;border-collapse:collapse;background:#fcf6ee"><tr><td style="padding:20px">
<p style="margin:0;color:#77716b;font-size:11px">FACTURA ${esc(datos.factura.secuencial)}</p><p style="margin:8px 0;font-size:29px;font-weight:bold">$${esc(datos.factura.importeTotal)} <span style="font-size:12px;font-weight:normal;color:#77716b">USD</span></p><p style="margin:0;font-size:12px;color:#77716b">${esc(datos.factura.fechaEmision)}</p></td></tr></table>
<p style="font-size:14px;line-height:1.7;margin:0">Tu factura completa está en el <strong>PDF adjunto</strong>. Puedes abrirlo o descargarlo desde este correo, sin ingresar a SuColor.</p>
<p style="font-size:12px;margin:16px 0 0;color:#a7430a;overflow-wrap:anywhere">${esc(archivo)}</p>
<p style="font-size:11px;color:#77716b;border-top:1px solid #ece8e2;padding-top:20px;margin-top:28px">SuColor · Cuidamos cada detalle de tu vehículo.</p>
</td></tr></table></body></html>`,
        attachments: [{ filename: archivo, contentType: 'application/pdf', encoding: 'binary' as const, content: pdf }],
    };
}
