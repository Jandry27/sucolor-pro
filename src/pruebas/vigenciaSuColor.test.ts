import { describe, it, expect, vi } from 'vitest';
import contratoServidor from '../../supabase/functions/aviso-suscripcion/contrato.ts?raw';
import contratoCliente from '../dominio/vigenciaSuColor.ts?raw';
import { avisoVigencia, validarVigencia } from '../dominio/vigenciaSuColor';
import { crearHandler } from '../../supabase/functions/aviso-suscripcion/handler';
const ahora = Date.parse('2026-10-30T17:00:00Z');
const datos = (fin = '2026-11-06', fecha = ahora) => ({
    version: 1,
    producto: 'sucolor',
    fecha_inicio: '2026-01-01',
    fecha_fin: fin,
    dias_aviso: 7,
    consultado_en: new Date(fecha).toISOString(),
});
describe('Aviso de vigencia', () => {
    it.each([
        ['2026-11-07', null],
        ['2026-11-06', 'Tu suscripción está por vencer'],
        ['2026-10-31', 'Tu suscripción está por vencer'],
        ['2026-10-30', 'Tu suscripción vence hoy'],
        ['2026-10-29', 'Tu suscripción está vencida'],
    ])('frontera %s', (fin, titulo) =>
        expect(avisoVigencia(datos(fin), ahora)?.titulo ?? null).toBe(titulo)
    );
    it('usa la fecha de Ecuador antes de medianoche UTC y oculta fechas futuras de inicio', () => {
        const noche = Date.parse('2026-10-31T02:00:00Z');
        expect(avisoVigencia(datos('2026-10-30', noche), noche)?.titulo).toBe(
            'Tu suscripción vence hoy'
        );
        expect(avisoVigencia({ ...datos(), fecha_inicio: '2026-11-01' }, ahora)).toBeNull();
    });
    it('rechaza respuestas caducadas, malformadas o adelantadas', () => {
        for (const v of [
            null,
            {},
            datos('2026-02-30'),
            datos('2026-11-06', ahora - 240000),
            datos('2026-11-06', ahora + 31000),
            { ...datos(), dias_aviso: 30 },
        ])
            expect(validarVigencia(v, ahora)).toBe(false);
    });
    it('mantiene idénticos los contratos del servidor y navegador', () => {
        expect(contratoServidor).toBe(contratoCliente);
    });
});
describe('Servidor SuColor', () => {
    const req = () =>
        new Request('https://example.test', {
            method: 'POST',
            headers: { Authorization: 'Bearer usuario' },
            body: JSON.stringify({ empresa_id: 'ajena' }),
        });
    it.each(['sin_sesion', 'denegado'] as const)(
        'rechaza %s antes de consultar SIXELA',
        async permiso => {
            const consultar = vi.fn();
            const guardarVigencia = vi.fn();
            const res = await crearHandler({
                autorizar: async () => permiso,
                consultar,
                guardarVigencia,
            })(req());
            expect(res.status).toBe(permiso === 'sin_sesion' ? 401 : 403);
            expect(consultar).not.toHaveBeenCalled();
        }
    );
    it('no consulta sin sesión y respeta preflight', async () => {
        const autorizar = vi.fn(),
            consultar = vi.fn();
        const handler = crearHandler({ autorizar, consultar, guardarVigencia: vi.fn() });
        expect(
            (await handler(new Request('https://example.test', { method: 'POST' }))).status
        ).toBe(401);
        expect(
            (await handler(new Request('https://example.test', { method: 'OPTIONS' }))).status
        ).toBe(204);
        expect(autorizar).not.toHaveBeenCalled();
        expect(consultar).not.toHaveBeenCalled();
    });
    it('proyecta solo campos permitidos y propaga la vigencia renovada', async () => {
        const guardarVigencia = vi.fn().mockResolvedValue(undefined);
        const vigencia = datos('2026-12-31', Date.now());
        const res = await crearHandler({
            autorizar: async () => 'admin',
            consultar: async () => ({ ...vigencia, secreto: 'oculto' }),
            guardarVigencia,
        })(req());
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.fecha_fin).toBe('2026-12-31');
        expect(body.secreto).toBeUndefined();
        expect(guardarVigencia).toHaveBeenCalledWith({
            fecha_inicio: '2026-01-01',
            fecha_fin: '2026-12-31',
            consultado_en: vigencia.consultado_en,
        });
    });
    it('falla sin revelar detalles cuando SIXELA cae o devuelve datos antiguos', async () => {
        for (const consultar of [
            async () => {
                throw new Error('token privado');
            },
            async () => datos('2026-11-06', Date.now() - 31000),
        ]) {
            const res = await crearHandler({
                autorizar: async () => 'admin',
                consultar,
                guardarVigencia: vi.fn(),
            })(req());
            expect(res.status).toBe(503);
            expect(await res.text()).not.toContain('token privado');
        }
    });
});
