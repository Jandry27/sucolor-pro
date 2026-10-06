import { writeFile, unlink } from 'node:fs/promises';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { createServer } from 'vite';

// Prueba aislada: sustituye Supabase y nunca emite comprobantes reales.
const archivo = 'verificacion-factura-temporal.html';
const html = `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">
import React from 'react';
import {createRoot} from 'react-dom/client';
import {ModalFactura} from '/src/componentes/administracion/ModalFactura.tsx';
import {supabase} from '/src/biblioteca/clienteSupabase.ts';
import '/src/index.css';
window.consultas=[]; window.emisiones=[]; window.actualizaciones=[];
supabase.from=(tabla)=>{
 let documento='';
 const cadena={select:()=>cadena,eq:(campo,valor)=>{documento=valor;return cadena},order:()=>cadena,limit:()=>cadena,abortSignal:()=>cadena,
 maybeSingle:()=>tabla==='clientes'?new Promise(resolve=>window.consultas.push({documento,resolve})):Promise.resolve({data:tabla==='invoices'?(window.factura||null):null,error:null}),
 then:(resolver)=>Promise.resolve({data:[],error:null}).then(resolver),
 update:(datos)=>{window.actualizaciones.push(datos);return cadena}};
 return cadena;
};
Object.defineProperty(supabase,'functions',{value:{invoke:(_nombre,datos)=>new Promise(resolve=>window.emisiones.push({datos,resolve}))}});
const order={id:'orden-prueba',codigo:'SC-PRUEBA',notas_publicas:'Enderezado y pintura del guardafango trasero derecho',cliente_id:'cliente-original',precio_total:100,vehiculo:{placa:'TEST-001'},cliente:{nombres:'Cliente original',cedula:'0000000000',direccion:'Dirección de prueba',email:'cliente@example.test',telefono:'',tipo_identificacion:'05'}};
window.renderizar=(isOpen=true)=>root.render(React.createElement(ModalFactura,{isOpen,onClose:()=>window.renderizar(false),order}));
const root=createRoot(document.getElementById('root')); window.renderizar();
</script></body></html>`;
let browser;
let servidor;
try {
 await writeFile(archivo,html);
 servidor=await createServer({configFile:'config/vite.config.ts',server:{host:'127.0.0.1',port:0,hmr:false}});
 await servidor.listen();
 const base=servidor.resolvedUrls.local[0];
 browser=await puppeteer.launch({headless:true});
 const page=await browser.newPage();
 await page.setRequestInterception(true);
 page.on('request',request=>{const url=new URL(request.url()); if(['127.0.0.1','localhost'].includes(url.hostname)||url.protocol==='data:')request.continue();else request.abort();});
 page.on('pageerror',error=>console.error(error.message));
 page.on('console',msg=>{if(msg.type()==='error')console.error(msg.text())});
 await page.setViewport({width:1280,height:1000});
 // Encabezado requerido por el plugin React de Vite para una entrada de prueba.
 await page.goto(base+archivo,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#factura-documento',{timeout:20000}).catch(async error=>{console.error((await page.content()).slice(0,1600));throw error;});
 const cambiar=async(selector,valor)=>page.$eval(selector,(elemento,valor)=>{
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(elemento,valor);
  elemento.dispatchEvent(new Event('input',{bubbles:true}));
 },valor);
 assert.equal(await page.$eval('#factura-trabajo',e=>e.value),'Enderezado y pintura del guardafango trasero derecho');
 await cambiar('#factura-documento','0000000001');
 await page.waitForFunction(()=>window.consultas.length===1);
 await cambiar('#factura-documento','0000000002');
 await page.waitForFunction(()=>window.consultas.length===2);
 await page.evaluate(()=>window.consultas[1].resolve({data:{nombres:'Comprador nuevo',email:'nuevo@example.test',direccion:'Loja',telefono:'0990000000'},error:null}));
 await page.waitForFunction(()=>document.querySelector('#factura-nombre').value==='Comprador nuevo');
 await page.evaluate(()=>window.consultas[0].resolve({data:{nombres:'Respuesta atrasada'},error:null}));
 assert.equal(await page.$eval('#factura-nombre',e=>e.value),'Comprador nuevo');
 await page.select('select[aria-label="IVA de mano de obra"]','15');
 await page.select('select[aria-label="Forma de pago"]','20');
 assert.match(await page.$eval('[role="dialog"]',e=>e.textContent),/115\.00/);
 await page.screenshot({path:'/tmp/sucolor-factura-desktop.png'});
 await page.setViewport({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'/tmp/sucolor-factura-mobile.png'});
 await page.$eval('#factura-trabajo',elemento=>{
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(elemento,'');
  elemento.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('Emitir Factura')).click());
 assert.equal(await page.evaluate(()=>window.emisiones.length),0);
 await page.$eval('#factura-trabajo',elemento=>{
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(elemento,'Enderezado y pintura del guardafango trasero derecho. Pulido final.');
  elemento.dispatchEvent(new Event('input',{bubbles:true}));
 });
 await page.evaluate(()=>{
  const boton=Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('Emitir Factura'));
  for(let i=0;i<5;i++)boton.click();
 });
 await page.waitForFunction(()=>window.emisiones.length===1);
 assert.equal(await page.evaluate(()=>window.emisiones[0].datos.body.items[0].descripcion),'Mano de obra: Enderezado y pintura del guardafango trasero derecho. Pulido final.');
 assert.equal(await page.evaluate(()=>window.actualizaciones.length),0);
 assert.equal(await page.evaluate(()=>window.emisiones[0].datos.body.comprador.identificacion),'0000000002');
 await page.evaluate(()=>window.emisiones[0].resolve({data:{success:false,message:'Error simulado'},error:null}));
 await page.waitForFunction(()=>document.querySelector('#factura-documento').disabled===false);
 await cambiar('#factura-documento','0000000003');
 assert.equal(await page.$eval('#factura-nombre',e=>e.value),'');
 await page.waitForFunction(()=>window.consultas.length===3);
 await page.evaluate(()=>window.consultas[2].resolve({data:null,error:null}));
 await page.waitForFunction(()=>document.querySelector('#factura-busqueda').textContent.includes('Cliente nuevo'));
 await cambiar('#factura-documento','0000000004');
 await page.waitForFunction(()=>window.consultas.length===4);
 await page.evaluate(()=>window.consultas[3].resolve({data:null,error:{message:'Error simulado'}}));
 await page.waitForFunction(()=>document.querySelector('#factura-busqueda').textContent.includes('No se pudo consultar'));
 await cambiar('#factura-documento','0000000005');
 await page.waitForFunction(()=>window.consultas.length===5);
 await page.evaluate(()=>window.renderizar(false));
 await page.evaluate(()=>window.consultas[4].resolve({data:{nombres:'No aplicar'},error:null}));
 await page.evaluate(()=>window.renderizar(true));
 await page.waitForFunction(()=>document.querySelector('#factura-nombre')?.value==='Cliente original');
 await page.evaluate(()=>window.renderizar(false));
 await page.evaluate(()=>{
  window.factura={estado:'AUTORIZADA',ambiente:1,secuencial:'DEMO',subtotal_0:0,subtotal_15:165,valor_iva:24.75,importe_total:189.75,xml_generado:'<factura><infoFactura><razonSocialComprador>Comprador del XML</razonSocialComprador><identificacionComprador>0000000002</identificacionComprador><totalSinImpuestos>165.00</totalSinImpuestos><importeTotal>189.75</importeTotal><totalConImpuestos><totalImpuesto><codigo>2</codigo><codigoPorcentaje>4</codigoPorcentaje><baseImponible>165.00</baseImponible><valor>24.75</valor></totalImpuesto></totalConImpuestos></infoFactura><detalles><detalle><codigoPrincipal>DEMO</codigoPrincipal><descripcion>Servicio histórico</descripcion><cantidad>1</cantidad><precioUnitario>165.00</precioUnitario><precioTotalSinImpuesto>165.00</precioTotalSinImpuesto></detalle></detalles></factura>'};
  window.open=()=>({document:{write:html=>{window.ride=html},close:()=>{}}});
  window.renderizar(true);
 });
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(e=>e.textContent.includes('Descargar RIDE')));
 await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('Descargar RIDE')).click());
 await page.waitForFunction(()=>!!window.ride);
 const ride=await page.evaluate(()=>window.ride);
 assert.ok(ride.includes('189.75')&&ride.includes('24.75')&&ride.includes('Comprador del XML')&&ride.includes('Servicio histórico'));
 console.log('OK: RIDE con comprador e importes emitidos; búsqueda, respuestas fuera de orden, limpieza, fallos, reapertura, IVA, envío único y protección del cliente original.');
} finally {
 if(browser)await browser.close();
 if(servidor)await servidor.close();
 await unlink(archivo).catch(()=>{});
}
