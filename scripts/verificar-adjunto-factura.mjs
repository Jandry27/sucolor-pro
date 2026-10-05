import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import ts from 'typescript';
import puppeteer from 'puppeteer';
import { datos } from './fixtures/factura.mjs';

const require = createRequire(import.meta.url);
const pdfLib = pathToFileURL(require.resolve('pdf-lib')).href;
const modulo = async (archivo, reemplazos = {}) => {
 let fuente = await fs.readFile(archivo, 'utf8');
 for(const [original,nuevo] of Object.entries(reemplazos))fuente=fuente.replace(original,nuevo);
 const js = ts.transpileModule(fuente,{compilerOptions:{module:ts.ModuleKind.ES2020,target:ts.ScriptTarget.ES2020}}).outputText;
 return 'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
};
const pdfUrl=await modulo('supabase/functions/_shared/facturaPdf.ts',{'npm:pdf-lib@1.17.1':pdfLib});
const correoUrl=await modulo('supabase/functions/_shared/correoFactura.ts',{'./facturaPdf.ts':pdfUrl});
const {prepararCorreoFactura}=await import(correoUrl);
const {PDFDocument}=await import(pdfLib);
const correo=await prepararCorreoFactura(datos);
assert.equal(correo.attachments.length,1);
const adjunto=correo.attachments[0];
assert.equal(adjunto.contentType,'application/pdf');
assert.equal(adjunto.encoding,'binary');
assert.equal(adjunto.filename,'Factura-001-001-000000001.pdf');
assert.equal(new TextDecoder().decode(adjunto.content.slice(0,5)),'%PDF-');
const pdf=await PDFDocument.load(adjunto.content);
assert.ok(pdf.getPageCount()>=1);
assert.ok(correo.html.includes('PDF adjunto')&&correo.content.includes(adjunto.filename));
assert.ok(!correo.html.includes('<button')&&!correo.html.includes('href="#"'));
const sanitizado=await prepararCorreoFactura({...datos,comprador:{...datos.comprador,nombre:'<b>Cliente</b>'},factura:{...datos.factura,secuencial:'../ejemplo'}});
assert.ok(sanitizado.html.includes('&lt;b&gt;Cliente&lt;/b&gt;'));
assert.ok(!sanitizado.attachments[0].filename.includes('/'));
await fs.mkdir('output/pdf',{recursive:true});
await fs.mkdir('tmp/pdfs',{recursive:true});
await fs.writeFile('output/pdf/factura-adjunta-muestra.pdf',adjunto.content);
await fs.writeFile('tmp/pdfs/correo-con-adjunto.html',correo.html);
const larga=await prepararCorreoFactura({...datos,factura:{...datos.factura,items:Array.from({length:35},(_,i)=>({...datos.factura.items[0],descripcion:'Servicio '+i+' con descripción extendida para comprobar que el texto y los importes no se superponen al cambiar de página.'}))}});
assert.ok((await PDFDocument.load(larga.attachments[0].content)).getPageCount()>1);
await fs.writeFile('tmp/pdfs/adjunto-multipagina.pdf',larga.attachments[0].content);
const browser=await puppeteer.launch({headless:true});
try { const page=await browser.newPage();await page.setViewport({width:390,height:844});await page.setContent(correo.html);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'output/pdf/correo-con-adjunto.png',fullPage:true});}finally{await browser.close();}
console.log('OK: PDF binario legible, nombre seguro, correo breve, caracteres escapados, móvil y múltiples páginas. No se enviaron correos.');

// Verificar el remitente real con transporte simulado, sin conexión SMTP.
const backend=await fs.readFile('supabase/functions/sri-invoice/index.ts','utf8');
const inicio=backend.indexOf('async function sendInvoiceEmail(');
const fin=backend.indexOf('// MAIN HANDLER',inicio);
const bloque=backend.slice(inicio,fin).replace("import('https://deno.land/x/denomailer@1.6.0/mod.ts')",'Promise.resolve({ SMTPClient: TransporteSMTP })');
const funcion=ts.transpileModule(bloque,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}}).outputText;
let mensaje, cierres=0, fallar=false;
class SMTPClient {
 async send(valor){if(fallar)throw new Error('Fallo SMTP simulado');mensaje=valor;}
 async close(){cierres++;}
}
const enviar=new Function('prepararCorreoFactura','Deno','TransporteSMTP',funcion+';return sendInvoiceEmail;')(prepararCorreoFactura,{env:{get:()=> 'prueba@example.test'}},SMTPClient);
const entrada={to:'destino@example.test',empresa:{...datos.empresa,direccion:datos.empresa.direccion_matriz},comprador:datos.comprador,factura:{...datos.factura,totalIva:datos.factura.iva15,items:datos.factura.items.map(item=>({...item,subtotal:item.precioTotal}))},vehiculo:datos.vehiculo,notas:datos.notas};
assert.equal((await enviar(entrada)).success,true);
assert.equal(cierres,1);
assert.equal(mensaje.to,entrada.to);
assert.equal(mensaje.attachments[0].contentType,'application/pdf');
assert.equal(new TextDecoder().decode(mensaje.attachments[0].content.slice(0,5)),'%PDF-');
fallar=true;
assert.equal((await enviar(entrada)).success,false);
assert.equal(cierres,2);
console.log('OK: envío con adjunto, fallo SMTP y cierre de conexión; transporte completamente simulado.');
