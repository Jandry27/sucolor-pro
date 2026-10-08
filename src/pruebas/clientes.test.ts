import { describe, expect, it } from 'vitest';
import { esClienteRegistrado } from '@/biblioteca/clientes';

describe('Contactos visibles en la agenda', () => {
    it.each([
        'Cliente Anónimo (Placa: ABC-123)',
        'Cliente Anonimo (Placa: LBA-9423)',
        'Cliente anónimo (No registrado)',
        'Cliente Anónimo',
        '  ',
    ])('excluye el marcador sin datos: %s', nombres => {
        expect(esClienteRegistrado({ nombres })).toBe(false);
    });
    it('excluye una placa generada automáticamente', () => {
        expect(
            esClienteRegistrado({
                nombres: 'ABC-123',
                notas: 'Generado automáticamente por sistema al omitir cliente',
            })
        ).toBe(false);
    });
    it.each(['Ana Pérez', 'Chino', 'Cliente Anónimo García'])(
        'conserva nombres reales sin teléfono: %s',
        nombres => {
            expect(esClienteRegistrado({ nombres })).toBe(true);
        }
    );
    it.each([
        { telefono: '0991234567' },
        { email: 'cliente@example.com' },
        { cedula: '1100000000' },
    ])('conserva registros que sí tienen datos: %s', datos => {
        expect(esClienteRegistrado({ nombres: 'Cliente Anónimo (Placa: ABC-123)', ...datos })).toBe(
            true
        );
    });
    it('conserva un contacto completado después aunque tenga la nota automática', () => {
        expect(
            esClienteRegistrado({
                nombres: 'Ana Pérez',
                notas: 'Generado automáticamente por sistema al omitir cliente',
            })
        ).toBe(true);
    });
    it('no confunde una placa escrita manualmente con un registro automático', () => {
        expect(esClienteRegistrado({ nombres: 'ABC-123' })).toBe(true);
    });
});
