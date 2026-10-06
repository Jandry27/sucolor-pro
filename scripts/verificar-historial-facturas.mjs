import { writeFile, unlink } from 'node:fs/promises';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { createServer } from 'vite';

// Datos aislados: esta prueba no inicia sesión ni modifica comprobantes reales.
const archivo = 'verificacion-historial-temporal.html';
let servidor;
let navegador;
try {
    await writeFile(archivo, `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root" style="max-width:1100px;margin:auto;padding:16px"></div><script type="module">
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {ReporteFacturas} from '/src/componentes/administracion/reportes/ReporteFacturas.tsx';
import {supabase} from '/src/biblioteca/clienteSupabase.ts';
import '/src/index.css';
window.consultas=[];
const factura={id:'demo',orden_id:'orden-demo',secuencial:'001-001-000000015',estado:'AUTORIZADA',ambiente:2,fecha_emision:'2026-10-06T12:00:00Z',importe_total:115,clave_acceso:'CLAVE-DE-DEMOSTRACION',xml_generado:'<factura><infoTributaria><razonSocial>Empresa de demostración</razonSocial><ruc>0000000000001</ruc></infoTributaria><infoFactura><razonSocialComprador>Comprador histórico</razonSocialComprador><identificacionComprador>0000000001</identificacionComprador><importeTotal>115.00</importeTotal><totalSinImpuestos>100.00</totalSinImpuestos></infoFactura><detalles><detalle><descripcion>Pintura original</descripcion><cantidad>1</cantidad><precioUnitario>100.00</precioUnitario><precioTotalSinImpuesto>100.00</precioTotalSinImpuesto></detalle></detalles></factura>'};
supabase.from=()=>{const cadena={};for(const metodo of ['select','order','eq','gte','lt','or','range'])cadena[metodo]=(...args)=>{window.consultas.push([metodo,...args]);return cadena};cadena.abortSignal=()=>Promise.resolve(window.fallo?{error:{message:'simulado'}}:{data:[factura],count:26});return cadena;};
window.open=()=>({document:{write:html=>window.impreso=html,close:()=>{}}});
createRoot(document.getElementById('root')).render(React.createElement(MemoryRouter,null,React.createElement(ReporteFacturas)));
</script></body></html>`);
    servidor = await createServer({ configFile: 'config/vite.config.ts', server: { host: '127.0.0.1', port: 0, hmr: false } });
    await servidor.listen();
    navegador = await puppeteer.launch({ headless: true });
    const pagina = await navegador.newPage();
    const errores = [];
    pagina.on('pageerror', error => errores.push(error.message));
    await pagina.setRequestInterception(true);
    pagina.on('request', request => {
        const url = new URL(request.url());
        if (['127.0.0.1', 'localhost'].includes(url.hostname) || ['data:', 'about:'].includes(url.protocol)) request.continue();
        else request.abort();
    });
    await pagina.setViewport({ width: 1280, height: 900 });
    await pagina.goto(servidor.resolvedUrls.local[0] + archivo);
    await pagina.waitForSelector('article');
    const pulsar = texto => pagina.evaluate(texto => Array.from(document.querySelectorAll('button')).find(e => e.textContent.trim() === texto).click(), texto);
    await pulsar('Siguiente');
    await pagina.waitForFunction(() => window.consultas.some(c => c[0] === 'range' && c[1] === 25));
    await pagina.type('input[placeholder]', 'Comprador histórico');
    await pagina.$eval('form', form => form.requestSubmit());
    await pagina.waitForFunction(() => window.consultas.some(c => c[0] === 'or' && c[1].includes('Comprador histórico')));
    await pagina.screenshot({ path: '/tmp/sucolor-historial-desktop.png' });
    await pagina.setViewport({ width: 390, height: 844 });
    assert.equal(await pagina.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await pulsar('Ver factura');
    const marco = await (await pagina.waitForSelector('iframe')).contentFrame();
    await marco.waitForFunction(() => document.body.textContent.includes('Comprador histórico'));
    await pulsar('Imprimir / Guardar PDF');
    assert.match(await pagina.evaluate(() => window.impreso), /Comprador histórico/);
    await pagina.$eval('iframe', e => e.scrollIntoView({ behavior: 'instant' }));
    await pagina.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await pagina.screenshot({ path: '/tmp/sucolor-historial-mobile.png', fullPage: true });
    await (await pagina.$('iframe')).screenshot({ path: '/tmp/sucolor-historial-comprobante.png' });
    await pagina.evaluate(() => { window.fallo = true; });
    await pulsar('Actualizar');
    await pagina.waitForSelector('[role="alert"]');
    assert.match(await pagina.$eval('[role="alert"]', e => e.textContent), /No se pudo cargar/);
    assert.deepEqual(errores, []);
    console.log('OK: escritorio y móvil sin desbordamiento, búsqueda y paginación en servidor, comprobante histórico, impresión y error de conexión.');
} finally {
    if (navegador) await navegador.close();
    if (servidor) await servidor.close();
    await unlink(archivo).catch(() => {});
}
