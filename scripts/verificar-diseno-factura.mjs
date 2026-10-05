import fs from 'node:fs/promises';
import ts from 'typescript';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const fuente = await fs.readFile('supabase/functions/_shared/facturaHtml.ts', 'utf8');
const js = ts.transpileModule(fuente, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
const { generarFacturaHtml } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const { datos } = await import('./fixtures/factura.mjs');
await fs.mkdir('output/pdf', { recursive: true });
await fs.mkdir('tmp/pdfs', { recursive: true });
const html = generarFacturaHtml(datos);
await fs.writeFile('tmp/pdfs/factura-sucolor.html', html);
const malicioso = generarFacturaHtml({ ...datos, comprador: { ...datos.comprador, nombre: '<script>alert(1)</script>', direccion: '"<img src=x onerror=alert(1)>' } });
assert.ok(!malicioso.includes('<script>alert(1)</script>'));
assert.ok(malicioso.includes('&lt;script&gt;'));
assert.ok(!html.includes('window.print'));
assert.ok(generarFacturaHtml(datos, { imprimir: true }).includes('window.print'));
const browser = await puppeteer.launch({ headless: true });
try {
 const page = await browser.newPage();
 await page.setViewport({ width: 900, height: 1200 });
 await page.setContent(html, { waitUntil: 'load' });
 await page.pdf({ path: 'output/pdf/factura-sucolor-muestra.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
 await page.setViewport({ width: 390, height: 844 });
 const correo = generarFacturaHtml({ ...datos, logoUrl: undefined });
 await page.setContent(correo, { waitUntil: 'load' });
 assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
 await page.screenshot({ path: 'tmp/pdfs/correo-movil.png', fullPage: true });
 await page.setViewport({ width: 900, height: 1200 });
 await page.setContent(generarFacturaHtml({ ...datos, factura: { ...datos.factura, items: Array.from({ length: 32 }, (_,i) => ({ ...datos.factura.items[0], codigo: 'SERV-' + i, descripcion: 'Servicio de demostración con descripción extensa para comprobar cortes de página y lectura del detalle ' + i })) } }), { waitUntil: 'load' });
 await page.pdf({ path: 'tmp/pdfs/factura-multipagina.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
 console.log('Plantilla verificada: escape de datos, móvil sin desbordamiento y variantes de impresión/correo.');
} finally { await browser.close(); }
