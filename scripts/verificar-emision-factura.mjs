import fs from 'node:fs/promises';
import ts from 'typescript';
import assert from 'node:assert/strict';
const fuente = await fs.readFile('supabase/functions/sri-invoice/index.ts', 'utf8');
const reglasFuente = await fs.readFile('supabase/functions/_shared/reglasFacturacion.ts', 'utf8');
const transpilar = fuente => ts.transpileModule(fuente, { compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 } }).outputText;
const reglas = await import('data:text/javascript;base64,' + Buffer.from(transpilar(reglasFuente)).toString('base64'));
const handler = transpilar(fuente.slice(fuente.indexOf('serve(async req =>')));
let atender, datosXml, correo, filas, configuracion;
const registros = [];
const base = { ruc: '1104449473001', razon_social: 'Empresa de prueba', direccion_matriz: 'Loja', obligado_contabilidad: false, rimpe: false, contribuyente_especial: '', secuencial_factura: '1', establecimiento: '001', punto_emision: '001', p12_storage_path: 'firma-simulada' };
const supabase = {
    from(tabla) {
        let insertando = false;
        const cadena = {};
        for (const metodo of ['select','limit','eq','in','order','like']) cadena[metodo] = () => cadena;
        cadena.insert = valor => { insertando = true; filas = valor; registros.push('insert'); return cadena; };
        cadena.update = valor => { registros.push(['update', tabla, valor]); return cadena; };
        cadena.maybeSingle = async () => ({ data: null });
        cadena.single = async () => ({ data: tabla === 'company_settings' ? configuracion : tabla === 'ordenes' ? {id:'orden-demo',cliente:{nombres:'Cliente original'},vehiculo:{placa:'DEMO'}} : insertando ? {id:'factura-demo'} : null });
        cadena.then = resolver => Promise.resolve({data:null,error:null}).then(resolver);
        return cadena;
    },
    storage: { from: () => ({ download: async () => ({data: { arrayBuffer: async () => new ArrayBuffer(0) }}) }) },
};
const dependencias = {
    serve: funcion => { atender = funcion; }, isAllowedOrigin: () => true, getCorsHeaders: () => ({}),
    Deno: { env: { get: () => 'simulado' } }, createClient: () => supabase, requireAdmin: async () => ({ok:true}),
    ...reglas, generateClaveAcceso: () => '0'.repeat(49), buildFacturaXml: datos => { datosXml=datos; return '<factura/>'; },
    signXmlWithP12: xml => xml, sendRecepcion: async () => ({estado:'RECIBIDA'}),
    sendAutorizacion: async () => ({estado:'AUTORIZADO',fechaAutorizacion:'2026-10-06T12:00:00-05:00'}),
    sendInvoiceEmail: async datos => { correo=datos; return {success:true}; },
    setTimeout: resolver => resolver(), console: {log(){},warn(){},error(){}}, Response,
};
new Function(...Object.keys(dependencias), handler)(...Object.values(dependencias));
const entrada = pago => ({orden_id:'orden-demo',forma_pago:pago,comprador:{tipo_identificacion:'05',identificacion:'1104432198',razon_social:'Cliente de prueba',direccion:'Loja',email:'prueba@example.test'},items:[{codigo_principal:'MO',descripcion:'Reparación',precio_total_sin_impuestos:15,tarifa_iva:15},{codigo_principal:'REP',descripcion:'Repuesto',precio_total_sin_impuestos:3,tarifa_iva:0}]});
const enviar = cuerpo => atender({method:'POST',headers:{get:()=>null},json:async()=>cuerpo});
for (const pago of ['01','16','19','20']) {
    configuracion={...base}; registros.length=0; correo=null;
    const respuesta=await enviar(entrada(pago));
    assert.equal(respuesta.status,200,await respuesta.clone().text());
    assert.equal((await respuesta.json()).status,'AUTORIZADA');
    assert.equal(datosXml.pagos[0].formaPago,pago);
    assert.equal(correo.factura.formaPago,pago);
    assert.equal(correo.factura.formaPagoDescripcion,reglas.FORMAS_PAGO[pago]);
    assert.equal(datosXml.importeTotal,'20.25');
    assert.equal(correo.factura.importeTotal,'20.25');
    assert.equal(filas.importe_total,20.25);
}
configuracion={...base,contribuyente_especial:'correo@example.test'}; registros.length=0;
assert.equal((await enviar(entrada('01'))).status,400);
assert.equal(registros.length,0);
configuracion={...base};registros.length=0;
assert.equal((await enviar(entrada('99'))).status,400);
assert.equal(registros.length,0);
console.log('OK: cuatro formas de pago coherentes entre XML, base de datos y correo; totales mixtos y rechazo previo de configuración y pago inválidos. Todo simulado, sin emisión ni correo real.');
