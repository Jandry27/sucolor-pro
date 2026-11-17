import { render, screen, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvisoSuscripcion } from '../componentes/administracion/AvisoSuscripcion';
const mocks = vi.hoisted(() => ({
    invoke: vi.fn(),
    unsubscribe: vi.fn(),
    cambio: null as null | (() => void),
}));
vi.mock('@/biblioteca/clienteSupabase', () => ({
    supabase: {
        functions: { invoke: mocks.invoke },
        auth: {
            onAuthStateChange: vi.fn((fn: () => void) => {
                mocks.cambio = fn;
                return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
            }),
        },
    },
}));
const datos = (fin = '2026-11-02') => ({
    version: 2,
    producto: 'sucolor',
    fecha_inicio: '2026-01-01',
    fecha_fin: fin,
    dias_aviso: 3,
    consultado_en: new Date().toISOString(),
});
beforeEach(() => {
    const almacenamiento = new Map<string, string>();
    vi.stubGlobal('localStorage', {
        getItem: (clave: string) => almacenamiento.get(clave) ?? null,
        setItem: (clave: string, valor: string) => almacenamiento.set(clave, valor),
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-30T17:00:00Z'));
    mocks.invoke.mockReset();
    mocks.invoke.mockResolvedValue({ data: datos(), error: null });
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});
async function montar() {
    await act(async () => {
        render(<AvisoSuscripcion usuarioId="admin" habilitado />);
    });
}
describe('Aviso administrativo', () => {
    it('se actualiza al renovar dentro de dos minutos', async () => {
        await montar();
        expect(screen.getByRole('dialog')).toHaveTextContent('está por vencer');
        expect(screen.getByRole('dialog')).toHaveTextContent('2 de noviembre');
        mocks.invoke.mockImplementation(async () => ({ data: datos('2026-12-31'), error: null }));
        await act(async () => {
            vi.advanceTimersByTime(120000);
        });
        expect(screen.queryByRole('status')).toBeNull();
        expect(screen.queryByRole('dialog')).toBeNull();
    });
    it('oculta el aviso lejos del vencimiento y no repite la ventana de la misma etapa', async () => {
        mocks.invoke.mockResolvedValue({ data: datos('2026-12-31'), error: null });
        await montar();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByRole('status')).toBeNull();

        mocks.invoke.mockImplementation(async () => ({ data: datos(), error: null }));
        await act(async () => vi.advanceTimersByTime(120000));
        expect(screen.getByRole('dialog')).toHaveTextContent('Fecha de vencimiento:');
        await act(async () => screen.getByRole('button', { name: 'Entendido' }).click());
        await act(async () => vi.advanceTimersByTime(120000));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.getByRole('status')).toHaveTextContent('está por vencer');
    });
    it('retira el aviso ante fallo, pérdida de red y cierre de sesión', async () => {
        await montar();
        act(() => window.dispatchEvent(new Event('offline')));
        expect(screen.queryByRole('status')).toBeNull();
        await act(async () => window.dispatchEvent(new Event('online')));
        expect(screen.queryByRole('status')).not.toBeNull();
        act(() => mocks.cambio?.());
        expect(screen.queryByRole('status')).toBeNull();
        mocks.invoke.mockResolvedValue({ data: null, error: new Error('401') });
        await act(async () => vi.advanceTimersByTime(120000));
        expect(screen.queryByRole('status')).toBeNull();
    });
    it('no consulta si la integración no está habilitada o no hay usuario', async () => {
        await act(async () => {
            render(<AvisoSuscripcion habilitado />);
        });
        expect(mocks.invoke).not.toHaveBeenCalled();
        cleanup();
        await act(async () => {
            render(<AvisoSuscripcion usuarioId="admin" habilitado={false} />);
        });
        expect(mocks.invoke).not.toHaveBeenCalled();
    });
    it('oculta una respuesta anterior al cambiar de usuario y limpia las escuchas', async () => {
        let vista: ReturnType<typeof render>;
        await act(async () => {
            vista = render(<AvisoSuscripcion usuarioId="admin" habilitado />);
        });
        mocks.invoke.mockResolvedValue({ data: null, error: new Error('403') });
        await act(async () => vista!.rerender(<AvisoSuscripcion usuarioId="viewer" habilitado />));
        expect(screen.queryByRole('status')).toBeNull();
        expect(mocks.unsubscribe).toHaveBeenCalled();
    });
});
