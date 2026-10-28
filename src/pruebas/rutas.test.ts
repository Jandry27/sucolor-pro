import { describe, expect, it } from 'vitest';
import { crearEnlaceSeguimiento, resolverRutaAnterior } from '@/biblioteca/rutas';

describe('Compatibilidad de enlaces anteriores', () => {
    it.each([
        ['/#/track/SC-2026-001?token=abc_123', '/track/SC-2026-001?token=abc_123'],
        ['/#/administracion/login', '/admin'],
        ['/#/administracion/orders/orden-1', '/administracion/orders/orden-1'],
        ['/#/admin', '/admin'],
        ['/#/', '/'],
    ])('conserva el destino de %s', (anterior, destino) => {
        expect(resolverRutaAnterior('https://sucolor.autos' + anterior)).toBe(destino);
    });

    it.each(['/admin', '/#servicios', '/#contacto', '/#//externo.example', '/#/\\externo.example'])(
        'no convierte rutas actuales, secciones ni destinos externos: %s',
        ruta => expect(resolverRutaAnterior('https://sucolor.autos' + ruta)).toBeNull()
    );

    it('genera el enlace del cliente desde la raíz y codifica sus parámetros', () => {
        const enlace = new URL(crearEnlaceSeguimiento('SC-2026-001', 'token&prueba'));
        expect(enlace.pathname).toBe('/track/SC-2026-001');
        expect(enlace.searchParams.get('token')).toBe('token&prueba');
        expect(enlace.hash).toBe('');
    });
});
