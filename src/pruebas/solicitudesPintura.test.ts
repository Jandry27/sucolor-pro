import { describe, expect, it, vi } from 'vitest';
vi.mock('@/biblioteca/clienteSupabase', () => ({ supabase: { from: vi.fn() } }));
import {
    estadoMuestras,
    guardarSolicitudPintura,
    validarSolicitudPintura,
    type DatosSolicitudPintura,
} from '@/biblioteca/solicitudesPintura';
import { supabase } from '@/biblioteca/clienteSupabase';
const base: DatosSolicitudPintura = {
    placa: ' abc-1234 ',
    color: 'Perla',
    codigo_color: '',
    proveedor_id: 'pepe',
    fecha_solicitud: '2026-10-06',
    valor: null,
    muestras_dejadas: 3,
    muestras_retiradas: 0,
    observaciones: '',
};
describe('Control de pedidos y muestras', () => {
    it('conserva valor desconocido y normaliza placa', () => {
        const datos = validarSolicitudPintura(base);
        expect(datos.valor).toBeNull();
        expect(datos.placa).toBe('ABC-1234');
    });
    it('distingue sin muestra, pendiente, retiro parcial y completo', () => {
        expect(estadoMuestras({ muestras_dejadas: 0, muestras_retiradas: 0 })).toBe('Sin muestra');
        expect(estadoMuestras(base)).toBe('Pendientes');
        expect(estadoMuestras({ ...base, muestras_retiradas: 1 })).toBe('Retiro parcial');
        expect(estadoMuestras({ ...base, muestras_retiradas: 3 })).toBe('Retiradas');
    });
    it.each([
        { muestras_retiradas: 4 },
        { muestras_dejadas: -1 },
        { muestras_dejadas: 1.5 },
        { valor: -2 },
        { valor: NaN },
        { valor: 1.234 },
        { fecha_solicitud: '2026-02-30' },
        { proveedor_id: '' },
        { color: ' ' },
    ])('rechaza datos inválidos %j', cambio => {
        expect(() => validarSolicitudPintura({ ...base, ...cambio })).toThrow();
    });
    it('permite completar el valor sin modificar las muestras', () => {
        expect(validarSolicitudPintura({ ...base, valor: 12.5 }).muestras_dejadas).toBe(3);
    });
    it('no envía campos generados al editar', () => {
        const datos = validarSolicitudPintura({
            ...base,
            id: 'otro',
            muestras_pendientes: 3,
            version: 1,
        } as DatosSolicitudPintura);
        expect(datos).not.toHaveProperty('muestras_pendientes');
        expect(datos).not.toHaveProperty('version');
        expect(datos).not.toHaveProperty('id');
    });
});


describe('Reintentos de guardado', () => {
    function simularExistente(datos: DatosSolicitudPintura) {
        const from = vi.mocked(supabase.from);
        from.mockReset();
        from.mockReturnValueOnce({ upsert: () => ({ select: async () => ({ data: [], error: null }) }) } as never);
        from.mockReturnValueOnce({ select: () => ({ eq: () => ({ single: async () => ({ data: datos, error: null }) }) }) } as never);
    }
    it('reconoce un alta ya guardada después de perder la respuesta', async () => {
        simularExistente(validarSolicitudPintura(base));
        await expect(guardarSolicitudPintura('id-estable', base)).resolves.toBeUndefined();
    });
    it('no anuncia éxito si un reintento contiene cambios no guardados', async () => {
        simularExistente(validarSolicitudPintura(base));
        await expect(guardarSolicitudPintura('id-estable', { ...base, valor: 25 })).rejects.toThrow('intento anterior');
    });
    it('advierte si otra sesión editó la solicitud', async () => {
        const cadena = { update: () => cadena, eq: () => cadena, select: async () => ({ data: [], error: null }) };
        vi.mocked(supabase.from).mockReturnValueOnce(cadena as never);
        await expect(guardarSolicitudPintura('id', base, 1)).rejects.toThrow('otra sesión');
    });
});
