import { describe, expect, it } from 'vitest';
import {
    validarConfiguracionFiscal,
    validarEmision,
    calcularTotalesFactura,
    type ItemFacturable,
} from '../../supabase/functions/_shared/reglasFacturacion';
import { formatearDecimalFactura } from '../../supabase/functions/_shared/facturaHtml';
import fuente from '../../supabase/functions/sri-invoice/index.ts?raw';
import ts from 'typescript';

const detalle: ItemFacturable = {
    codigo_principal: 'SERV',
    descripcion: 'Reparación',
    precio_total_sin_impuestos: 15,
    tarifa_iva: 15,
};
const empresa = {
    ruc: '1104449473001',
    razon_social: 'Empresa de prueba',
    direccion_matriz: 'Dirección de prueba',
};

describe('Reglas de facturación SRI', () => {
    it('quita ceros sobrantes sin redondear fracciones reales', () => {
        expect(formatearDecimalFactura('1.000000')).toBe('1');
        expect(formatearDecimalFactura('15.000000', 2)).toBe('15.00');
        expect(formatearDecimalFactura('15.123456', 2)).toBe('15.123456');
        expect(formatearDecimalFactura('0.100000', 2)).toBe('0.10');
    });
    it('rechaza un correo en la resolución y admite ausencia o resolución válida', () => {
        expect(() =>
            validarConfiguracionFiscal({ ...empresa, contribuyente_especial: 'correo@example.com' })
        ).toThrow(/no un correo/);
        expect(() =>
            validarConfiguracionFiscal({ ...empresa, contribuyente_especial: '' })
        ).not.toThrow();
        expect(() =>
            validarConfiguracionFiscal({ ...empresa, contribuyente_especial: '5368' })
        ).not.toThrow();
    });
    it.each(['01', '16', '19', '20'])(
        'admite la forma de pago %s explícitamente seleccionada',
        pago => {
            expect(() => validarEmision([detalle], pago)).not.toThrow();
        }
    );
    it('rechaza pagos ausentes o inválidos y tarifas no seleccionadas', () => {
        expect(() => validarEmision([detalle], '')).toThrow(/forma de pago/);
        expect(() => validarEmision([detalle], 'toString')).toThrow(/forma de pago/);
        expect(() => validarEmision([{ ...detalle, tarifa_iva: '' }], '01')).toThrow(/IVA/);
    });
    it.each([-1, NaN, Infinity, 15.001, true, false, null, ''])(
        'rechaza importe inválido %s',
        monto => {
            expect(() =>
                validarEmision([{ ...detalle, precio_total_sin_impuestos: monto }], '01')
            ).toThrow();
        }
    );
    it('acumula IVA por línea sin diferencias con el resumen', () => {
        const items = [1, 2, 3].map(() => ({ ...detalle, precio_total_sin_impuestos: 0.03 }));
        expect(calcularTotalesFactura(items)).toEqual({
            subtotal0: 0,
            subtotal15: 0.09,
            iva: 0,
            total: 0.09,
        });
        expect(calcularTotalesFactura([detalle, { ...detalle, tarifa_iva: 0 }])).toEqual({
            subtotal0: 15,
            subtotal15: 15,
            iva: 2.25,
            total: 32.25,
        });
    });
    it('incluye la resolución y el pago elegido en el XML y escapa textos', () => {
        const inicio = fuente.indexOf('function buildFacturaXml(');
        const fin = fuente.indexOf('\n// ===', inicio);
        const js = ts.transpileModule(fuente.slice(inicio, fin), {
            compilerOptions: { target: ts.ScriptTarget.ES2020 },
        }).outputText;
        const construir = new Function(js + '; return buildFacturaXml;')();
        for (const pago of ['01', '20']) {
            const xml = construir({
                ambiente: '1',
                tipoEmision: '1',
                razonSocial: 'A & B',
                nombreComercial: 'Prueba',
                ruc: empresa.ruc,
                claveAcceso: '0'.repeat(49),
                estab: '001',
                ptoEmi: '001',
                secuencial: '000000001',
                dirMatriz: 'Dirección',
                fechaEmision: '06/10/2026',
                contribuyenteEspecial: '5368',
                obligadoContabilidad: 'SI',
                tipoIdentificacionComprador: '05',
                razonSocialComprador: 'Cliente',
                identificacionComprador: '1104432198',
                direccionComprador: 'Loja',
                totalSinImpuestos: '15.00',
                totalDescuento: '0.00',
                totalConImpuestos: [],
                propina: '0.00',
                importeTotal: '15.00',
                pagos: [{ formaPago: pago, total: '15.00', plazo: '0', unidadTiempo: 'dias' }],
                detalles: [],
                infoAdicional: [],
            });
            expect(xml).toContain(`<formaPago>${pago}</formaPago>`);
            expect(xml).toContain(
                '<contribuyenteEspecial>5368</contribuyenteEspecial><obligadoContabilidad>SI'
            );
            expect(xml).toContain('A &amp; B');
            expect(
                new DOMParser().parseFromString(xml, 'application/xml').querySelector('parsererror')
            ).toBeNull();
        }
    });
});
