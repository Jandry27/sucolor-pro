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
    fraccion_galon: '1/16',
    unidades: 1,
    fecha_recogida_prevista: null,
    hora_recogida_prevista: null,
    estado_pedido: 'en_preparacion',
    pagado: false,
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
        from.mockReturnValueOnce({
            upsert: () => ({ select: async () => ({ data: [], error: null }) }),
        } as never);
        from.mockReturnValueOnce({
            select: () => ({ eq: () => ({ single: async () => ({ data: datos, error: null }) }) }),
        } as never);
    }
    it('reconoce un alta ya guardada después de perder la respuesta', async () => {
        simularExistente(validarSolicitudPintura(base));
        await expect(guardarSolicitudPintura('id-estable', base)).resolves.toBeUndefined();
    });
    it('no anuncia éxito si un reintento contiene cambios no guardados', async () => {
        simularExistente(validarSolicitudPintura(base));
        await expect(guardarSolicitudPintura('id-estable', { ...base, valor: 25 })).rejects.toThrow(
            'intento anterior'
        );
    });
    it('advierte si otra sesión editó la solicitud', async () => {
        const cadena = {
            update: () => cadena,
            eq: () => cadena,
            select: async () => ({ data: [], error: null }),
        };
        vi.mocked(supabase.from).mockReturnValueOnce(cadena as never);
        await expect(guardarSolicitudPintura('id', base, 1)).rejects.toThrow('otra sesión');
    });
});

describe('Fracciones, recogida y pago', () => {
    it.each(['1/32', '1/16', '1/8', '1/4', '1/2', '1'])('guarda %s de galón sin redondearlo', fraccion => {
        expect(validarSolicitudPintura({ ...base, fraccion_galon: fraccion }).fraccion_galon).toBe(fraccion);
    });
    it.each([
        { fraccion_galon: '1/3' }, { unidades: 0 }, { unidades: 1.5 },
        { hora_recogida_prevista: '12:00' },
        { fecha_recogida_prevista: '2026-10-07', hora_recogida_prevista: '25:00' },
        { fecha_recogida_prevista: '2026-02-30' },
        { fecha_recogida_prevista: '2026-10-05' }, { pagado: true },
    ])('rechaza un encargo incoherente %j', cambio => {
        expect(() => validarSolicitudPintura({ ...base, ...cambio })).toThrow();
    });
    it('recoger y pagar no devuelve la tapa automáticamente', () => {
        const pedido = validarSolicitudPintura({ ...base, estado_pedido: 'recogida', valor: 12.5, pagado: true });
        expect(pedido.muestras_retiradas).toBe(0);
        expect(pedido.muestras_dejadas).toBe(3);
    });
    it('permite registrar la hora de mañana y varias unidades', () => {
        const pedido = validarSolicitudPintura({ ...base, unidades: 2, fecha_recogida_prevista: '2026-10-07', hora_recogida_prevista: '12:00' });
        expect(pedido.hora_recogida_prevista).toBe('12:00');
        expect(pedido.unidades).toBe(2);
    });
});
