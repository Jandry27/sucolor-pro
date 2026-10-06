import { writeFile, unlink } from 'node:fs/promises';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { createServer } from 'vite';
const archivo = 'verificacion-pinturas-temporal.html';
const html = `<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="root"></div><script type="module">
import React from 'react'; import {createRoot} from 'react-dom/client';
import {ControlPinturas} from '/src/componentes/administracion/pinturas/ControlPinturas.tsx';
import {supabase} from '/src/biblioteca/clienteSupabase.ts'; import '/src/index.css';
window.pedidos=[];window.escrituras=0;window.fallar=false;
const proveedores=[{id:'pepe',nombre:'Pepe'},{id:'german',nombre:'German'}];
supabase.from=tabla=>{
 let filtros=[], desde=0,hasta=24, accion='',payload, ignorar=false;
 const q={select:()=>q,order:()=>q,range:(a,b)=>{desde=a;hasta=b;return q},abortSignal:()=>q,
 eq:(k,v)=>{filtros.push(r=>r[k]===v);return q},gt:(k,v)=>{filtros.push(r=>r[k]>v);return q},is:(k,v)=>{filtros.push(r=>r[k]===v);return q},gte:()=>q,lte:()=>q,
 or:exp=>{const term=exp.split('%')[1].toLowerCase();filtros.push(r=>[r.placa,r.color,r.codigo_color].some(v=>v.toLowerCase().includes(term)));return q},
 upsert:(p,op)=>{accion='crear';payload=p;ignorar=op.ignoreDuplicates;return q},update:p=>{accion='editar';payload=p;return q},insert:p=>{accion='crear';payload=p;return q},
 then:async(resolve,reject)=>{try{
 let data,total;
 if(accion){window.escrituras++;await new Promise(r=>setTimeout(r,100));if(window.fallar){resolve({error:{message:'Fallo simulado'},data:null});return;}
 if(tabla==='solicitudes_pintura'){
 if('muestras_pendientes' in payload)throw Error('Campo generado enviado');
 if(accion==='crear'){const existe=window.pedidos.find(r=>r.id===payload.id);if(!existe)window.pedidos.unshift({...payload,version:1,updated_at:new Date().toISOString(),muestras_pendientes:payload.muestras_dejadas-payload.muestras_retiradas});data=existe&&ignorar?[]:[{id:payload.id}];}
 else{data=[];window.pedidos=window.pedidos.map(r=>{if(!filtros.every(f=>f(r)))return r;data.push({id:r.id});return {...r,...payload,version:r.version+1,muestras_pendientes:payload.muestras_dejadas-payload.muestras_retiradas}});}
 }else{if(accion==='crear')proveedores.push({id:crypto.randomUUID(),...payload});else proveedores.filter(r=>filtros.every(f=>f(r))).forEach(r=>Object.assign(r,payload));data=[{id:'ok'}];}
 }else if(tabla==='resumen_proveedores_pintura')data=proveedores.map(p=>{const lista=window.pedidos.filter(r=>r.proveedor_id===p.id);return {...p,solicitudes:lista.length,muestras_pendientes:lista.reduce((a,r)=>a+r.muestras_pendientes,0),solicitudes_pendientes:lista.filter(r=>r.muestras_pendientes>0).length,pedidos_por_recoger:lista.filter(r=>r.estado_pedido==='en_preparacion').length,valores_pendientes:lista.filter(r=>r.valor===null).length,valor_conocido:lista.reduce((a,r)=>a+(r.valor??0),0)}});
 else {const lista=window.pedidos.filter(r=>filtros.every(f=>f(r)));total=lista.length;data=lista.slice(desde,hasta+1)}
 resolve({data,error:null,count:total});}catch(e){reject(e)}}};return q;
};
createRoot(document.getElementById('root')).render(React.createElement('div',{className:'p-4 mx-auto max-w-6xl'},React.createElement(ControlPinturas)));
</script></body></html>`;
let server,browser;
try {
 await writeFile(archivo,html);
 server=await createServer({configFile:'config/vite.config.ts',server:{port:5187,strictPort:true}});await server.listen();
 browser=await puppeteer.launch({headless:true});const page=await browser.newPage();await page.setViewport({width:1280,height:1000});
 const errores=[];page.on('pageerror',e=>errores.push(e.message));
 await page.goto('http://localhost:5187/'+archivo);
 const pulsar=async texto=>page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t);if(!b)throw Error('Boton '+t);b.click()},texto);
 const campo=async(nombre,valor)=>page.evaluate(({nombre,valor})=>{const l=[...document.querySelectorAll('dialog label')].find(l=>l.firstChild.textContent.trim()===nombre);const e=l?.querySelector('input,select,textarea');if(!e)throw Error('Campo '+nombre);const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,valor);e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))},{nombre,valor});
 await page.waitForFunction(()=>document.body.textContent.includes('Ver pedidos por recoger'));
 await pulsar('Nueva solicitud');await page.waitForSelector('dialog[open]');
 await campo('Placa *','ABC-1234');await campo('Proveedor *','pepe');await campo('Color o descripción *','Azul perla');await campo('Cantidad de pintura *','1/16');await campo('Fecha para recoger','2026-10-07');await campo('Hora acordada','12:00');
 await page.click('dialog input[type=checkbox]');await campo('Cantidad dejada','3');
 await page.evaluate(()=>{const form=document.querySelector('dialog form');for(let i=0;i<5;i++)form.requestSubmit()});
 await page.waitForFunction(()=>!document.querySelector('dialog'));assert.equal(await page.evaluate(()=>window.escrituras),1);
 assert.equal(await page.evaluate(()=>window.pedidos[0].valor),null);assert.equal(await page.evaluate(()=>window.pedidos[0].fraccion_galon),'1/16');assert.equal(await page.evaluate(()=>window.pedidos[0].hora_recogida_prevista),'12:00');
 await page.waitForSelector('article');assert.match(await page.$eval('article',e=>e.textContent),/3 pendientes/);
 await pulsar('Registrar recogida / editar');await campo('Cantidad ya retirada','1');await campo('Valor de la pintura (USD)','45.50');await pulsar('Guardar solicitud');
 await page.waitForFunction(()=>!document.querySelector('dialog'));await page.waitForFunction(()=>document.querySelector('article')?.textContent.includes('2 pendientes'));
 assert.equal(await page.evaluate(()=>window.pedidos[0].valor),45.5);
 await page.setViewport({width:320,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await pulsar('Registrar recogida / editar');await page.screenshot({path:'/tmp/sucolor-pinturas-formulario.png',fullPage:true});
 await page.evaluate(()=>window.fallar=true);await campo('Cantidad ya retirada','3');await campo('Estado de la pintura','recogida');await campo('Pago al proveedor','pagado');await pulsar('Guardar solicitud');await page.waitForSelector('dialog [role=alert]');
 assert.equal(await page.evaluate(()=>window.pedidos[0].muestras_retiradas),1);
 await page.evaluate(()=>window.fallar=false);await pulsar('Guardar solicitud');await page.waitForFunction(()=>!document.querySelector('dialog'));await page.waitForFunction(()=>document.querySelector('article')?.textContent.includes('Retiradas'));
 await page.evaluate(()=>{for(let i=0;i<30;i++)window.pedidos.push({...window.pedidos[0],id:'test-'+i,estado_pedido:'en_preparacion',placa:'TEST-'+i,proveedor_id:'german',muestras_dejadas:2,muestras_retiradas:0,muestras_pendientes:2})});
 await page.click('button[aria-label="Actualizar pedidos"]');await page.waitForFunction(()=>document.body.textContent.includes('Historial · 31 pedidos'));
 assert.equal(await page.$$eval('article',els=>els.length),25);assert.match(await page.$eval('body',e=>e.textContent),/60 tapas/);
 await pulsar('Siguiente');await page.waitForFunction(()=>document.querySelectorAll('article').length===6);
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('German')&&b.textContent.includes('Ver pedidos por recoger')).click());
 await page.waitForFunction(()=>document.body.textContent.includes('Historial · 30 pedidos'));
 await page.screenshot({path:'/tmp/sucolor-pinturas-movil.png',fullPage:true});
 await page.setViewport({width:1280,height:1000});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'/tmp/sucolor-pinturas-escritorio.png',fullPage:false});
 assert.deepEqual(errores,[]);
 console.log('OK: alta sin valor, doble envío bloqueado, retiro parcial/total, valor posterior, fallo recuperable, resumen global, filtros, paginación, móvil 320px. API simulada sin datos reales.');
}finally{await browser?.close();await server?.close();await unlink(archivo).catch(()=>{});}
