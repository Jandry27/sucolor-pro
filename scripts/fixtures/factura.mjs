import fs from 'node:fs/promises';

export const datos = {
 empresa: { razon_social: 'SuColor · Taller automotriz', ruc: 'RUC DE EJEMPLO', direccion_matriz: 'Loja, Ecuador', obligado_contabilidad: false },
 comprador: { nombre: 'Cliente de demostración', identificacion: 'DOCUMENTO DE EJEMPLO', direccion: 'Av. de ejemplo, Loja', email: 'cliente@example.test', telefono: 'TELÉFONO DE EJEMPLO' },
 factura: { ambiente: 1, secuencial: '001-001-000000001', claveAcceso: 'CLAVE DE DEMOSTRACIÓN - SIN VALIDEZ TRIBUTARIA', numeroAutorizacion: 'EJEMPLO - DOCUMENTO NO EMITIDO', fechaEmision: '04/10/2026', fechaAutorizacion: 'Ejemplo de diseño', items: [
 { codigo: 'SERV-01', descripcion: 'Preparación y pintura de guardafango', cantidad: '1.00', precioUnitario: '120.00', descuento: '0.00', precioTotal: '120.00' },
 { codigo: 'SERV-02', descripcion: 'Pulido y acabado de carrocería', cantidad: '1.00', precioUnitario: '45.00', descuento: '0.00', precioTotal: '45.00' },
 ], subtotal0: '0.00', subtotal15: '165.00', subtotalNoObjeto: '0.00', subtotalExento: '0.00', subtotalSinImpuestos: '165.00', totalDescuento: '0.00', iva15: '24.75', propina: '0.00', importeTotal: '189.75', formaPago: '20', formaPagoDescripcion: 'Transferencia bancaria' },
 vehiculo: { placa: 'DEMO', marca: 'Vehículo de ejemplo' }, notas: 'Vista de diseño. Documento de muestra, sin validez tributaria.',
 logoUrl: 'data:image/png;base64,' + (await fs.readFile('public/logo.png')).toString('base64'),
};
