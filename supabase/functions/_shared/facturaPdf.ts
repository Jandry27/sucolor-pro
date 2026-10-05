import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import type { DatosFactura } from './facturaHtml.ts';

// Generación local al servidor: no envía datos del cliente a servicios de conversión.
export async function generarFacturaPdf(data: DatosFactura): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
    const negro = rgb(.14, .13, .12), gris = rgb(.43, .40, .37);
    const naranja = rgb(.91, .39, .06), crema = rgb(.99, .96, .92), borde = rgb(.90, .88, .85);
    const ancho = 595.28, alto = 841.89, margen = 42, util = ancho - 2 * margen;
    let pagina = pdf.addPage([ancho, alto]);
    let y = alto - margen;
    const limpiar = (valor: string) => String(valor ?? '').normalize('NFC').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    const texto = (valor: string, x: number, arriba: number, tam = 10, fuerte = false, color = negro) => {
        pagina.drawText(limpiar(valor), { x, y: arriba - tam, size: tam, font: fuerte ? negrita : regular, color });
    };
    const lineas = (valor: string, limite = util, tam = 10, fuerte = false): string[] => {
        const font = fuerte ? negrita : regular;
        const resultado: string[] = [];
        let actual = '';
        for (const letra of limpiar(valor)) {
            if (font.widthOfTextAtSize(actual + letra, tam) > limite && actual) {
                const corte = actual.lastIndexOf(' ');
                if (corte > 0) { resultado.push(actual.slice(0, corte)); actual = actual.slice(corte + 1) + letra; }
                else { resultado.push(actual); actual = letra; }
            } else actual += letra;
        }
        if (actual) resultado.push(actual);
        return resultado.length ? resultado : [''];
    };
    const nuevaPagina = () => {
        pagina = pdf.addPage([ancho, alto]); y = alto - margen;
        texto('SuColor.', margen, y, 17, true, naranja);
        texto(`Factura ${data.factura.secuencial} · continuación`, margen + 180, y + 1, 9, false, gris);
        y -= 40;
    };
    const espacio = (altura: number) => { if (y - altura < margen + 24) nuevaPagina(); };
    const parrafo = (valor: string, tam = 10, fuerte = false, color = negro, x = margen, limite = util) => {
        for (const linea of lineas(valor, limite, tam, fuerte)) {
            espacio(tam + 5); texto(linea, x, y, tam, fuerte, color); y -= tam + 5;
        }
    };
    const separador = () => { espacio(14); pagina.drawLine({ start: {x:margen,y}, end:{x:ancho-margen,y}, thickness:.6,color:borde }); y -= 11; };
    const derecha = (valor: string, derechaX: number, arriba: number, tam = 10, fuerte = false) => {
        const font = fuerte ? negrita : regular;
        texto(valor, derechaX - font.widthOfTextAtSize(limpiar(valor), tam), arriba, tam, fuerte);
    };
    pdf.setTitle(`Factura ${data.factura.secuencial} · SuColor`);
    pdf.setAuthor(data.empresa.nombre_comercial || data.empresa.razon_social);
    pdf.setSubject('Representación impresa de la factura electrónica');
    pagina.drawRectangle({x:margen,y:y+10,width:util,height:3,color:naranja});
    texto('SuColor.', margen, y - 8, 29, true, naranja);
    texto('FACTURA', ancho - margen - 160, y - 4, 26, true);
    texto(data.factura.secuencial, ancho - margen - 160, y - 39, 11, true);
    y -= 55;
    parrafo('PINTURA · LATONERÍA · RESTAURACIÓN', 8, false, gris);
    y -= 12;
    parrafo(data.empresa.razon_social, 12, true);
    parrafo(`RUC ${data.empresa.ruc}`, 9, false, gris);
    parrafo(data.empresa.direccion_matriz, 9, false, gris);
    y -= 7;
    parrafo(`Emisión: ${data.factura.fechaEmision} · ${data.factura.ambiente === 1 ? 'Pruebas' : data.factura.ambiente === 2 ? 'Producción' : 'Ambiente no especificado'} · Emisión normal`, 9, false, gris);
    y -= 14;
    const clienteLineas = [data.comprador.nombre, `Identificación: ${data.comprador.identificacion}`, data.comprador.direccion,
        data.vehiculo?.placa ? `Vehículo: ${[data.vehiculo.placa, data.vehiculo.marca, data.vehiculo.modelo].filter(Boolean).join(' · ')}` : ''].filter(Boolean);
    const alturaCliente = 36 + clienteLineas.reduce((s, v) => s + lineas(v, util-28, 10).length*15, 0);
    if (alturaCliente < alto - margen * 2 - 80) {
        espacio(alturaCliente + 14);
        pagina.drawRectangle({x:margen,y:y-alturaCliente,width:util,height:alturaCliente,color:crema});
        pagina.drawRectangle({x:margen,y:y-alturaCliente,width:2,height:alturaCliente,color:naranja});
        y -= 12;
        parrafo('FACTURADO A', 8, true, naranja, margen+14, util-28);
        for(const [indice, linea] of clienteLineas.entries()) parrafo(linea, 10, indice===0, negro, margen+14,util-28);
        y -= 21;
    } else {
        parrafo('FACTURADO A',8,true,naranja);
        for(const linea of clienteLineas)parrafo(linea);
        y -= 14;
    }
    const cabeceraDetalle = () => {
        espacio(48);
        parrafo('Detalle de servicios y repuestos', 11, true); y -= 8;
        texto('Descripción / código', margen, y, 8, false, gris);
        texto('Cant.', 327, y, 8, false, gris);
        texto('P. unit.', 373, y, 8, false, gris);
        texto('Desc.', 433, y, 8, false, gris);
        texto('Importe', 494, y, 8, false, gris);
        y -= 18; separador();
    };
    cabeceraDetalle();
    for (const item of data.factura.items) {
        const detalle = [...lineas(item.descripcion,270,10,true), ...lineas(item.codigo,270,8)];
        const alturaFila = detalle.length * 14 + 22;
        if (alturaFila < alto - margen * 2 - 100 && y - alturaFila < margen + 24) { nuevaPagina(); cabeceraDetalle(); }
        let inicio = 0;
        while(inicio < detalle.length) {
            if(y < margen + 64) { nuevaPagina(); cabeceraDetalle(); }
            const cantidadLineas = Math.max(1,Math.floor((y-margen-50)/14));
            const fragmento = detalle.slice(inicio,inicio+cantidadLineas);
            const inicioY = y;
            fragmento.forEach((linea,i)=>texto(linea,margen,y-i*14,10,inicio+i<detalle.length-1));
            if(inicio===0) {
                derecha(item.cantidad,350,inicioY,9); derecha(item.precioUnitario,411,inicioY,9);
                derecha(item.descuento,471,inicioY,9); derecha(item.precioTotal,ancho-margen,inicioY,9,true);
            }
            y -= fragmento.length*14+4; separador(); inicio+=fragmento.length;
        }
    }
    y -= 6;
    espacio(220);
    const comienzoResumen=y;
    parrafo('FORMA DE PAGO',8,true,gris,margen,225);
    parrafo(data.factura.formaPagoDescripcion,9,false,negro,margen,225);
    y-=8;
    parrafo('CONTACTO DEL CLIENTE',8,true,gris,margen,225);
    parrafo(data.comprador.email,9,false,negro,margen,225);
    if(data.comprador.telefono)parrafo(data.comprador.telefono,9,false,negro,margen,225);
    const finIzquierda=y;
    y=comienzoResumen;
    const totales = [['Subtotal 0%',data.factura.subtotal0],['Subtotal IVA 15%',data.factura.subtotal15],
        ['No objeto de IVA',data.factura.subtotalNoObjeto],['Exento de IVA',data.factura.subtotalExento],
        ['Subtotal sin impuestos',data.factura.subtotalSinImpuestos],['Descuento',data.factura.totalDescuento],
        ['IVA 15%',data.factura.iva15],['Propina',data.factura.propina]]
        .filter(([nombre,valor])=>!['No objeto de IVA','Exento de IVA','Propina'].includes(nombre)||Number(valor)!==0);
    for(const [nombre,valor] of totales) { texto(nombre,310,y,9,false,gris); derecha(valor,ancho-margen,y,9); y-=17; }
    pagina.drawRectangle({x:302,y:y-37,width:util-260,height:37,color:crema});
    texto('TOTAL USD',312,y-10,9,true,naranja); derecha('$'+data.factura.importeTotal,ancho-margen-10,y-7,19,true);
    y=Math.min(y-54,finIzquierda-16);
    if(data.notas) { parrafo('OBSERVACIONES',8,true,gris); parrafo(data.notas,9); y-=10; }
    espacio(130); separador();
    parrafo('INFORMACIÓN TRIBUTARIA',8,true,gris);
    parrafo(`Obligado a llevar contabilidad: ${data.empresa.obligado_contabilidad?'Sí':'No'}`,8,false,gris);
    if(data.empresa.contribuyente_especial)parrafo(`Contribuyente especial: ${data.empresa.contribuyente_especial}`,8,false,gris);
    if(data.empresa.rimpe)parrafo('Contribuyente régimen RIMPE',8,false,gris);
    parrafo(`Fecha y hora de autorización: ${data.factura.fechaAutorizacion}`,8,false,gris);
    parrafo(`Autorización: ${data.factura.numeroAutorizacion || data.factura.claveAcceso}`,8,false,gris);
    parrafo(`Clave de acceso: ${data.factura.claveAcceso}`,8,false,gris);
    y-=10; espacio(35); separador(); parrafo('Gracias por confiar en SuColor.',11,true);
    pdf.getPages().forEach((hoja,indice)=>{
        hoja.drawText(`SuColor · ${data.factura.secuencial}`,{x:margen,y:24,size:8,font:regular,color:gris});
        hoja.drawText(`${indice+1} / ${pdf.getPageCount()}`,{x:ancho-margen-30,y:24,size:8,font:regular,color:gris});
    });
    return pdf.save();
}
