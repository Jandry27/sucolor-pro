import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTrackOrder } from '@/hooks/useTrackOrder';
import type { TrackOrderResponse } from '@/types';

// ─── Mock del módulo API ───────────────────────────────────────────────────────
vi.mock('@/api/trackOrder', () => {
    class TrackOrderError extends Error {
        public status: number;
        constructor(message: string, status: number) {
            super(message);
            this.name = 'TrackOrderError';
            this.status = status;
        }
    }
    return {
        fetchTrackOrder: vi.fn(),
        TrackOrderError,
    };
});

// ─── Datos de ejemplo ─────────────────────────────────────────────────────────
const mockData: TrackOrderResponse = {
    ok: true,
    order: {
        codigo: 'SC-0001',
        estado: 'PINTURA',
        prioridad: 'NORMAL',
        fecha_ingreso: '2026-01-15',
        fecha_estimada: '2026-01-20',
        notas_publicas: 'En proceso',
        cliente: 'Juan Pérez',
        vehiculo: {
            marca: 'Toyota',
            modelo: 'Corolla',
            anio: 2020,
            color: 'Rojo',
            placa: 'ABC-1234',
        },
    },
    gastos: [],
    media: [],
};

const VALID_TOKEN = 'valid-token-12345678901234567890';

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useTrackOrder', () => {
    beforeEach(async () => {
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    it('inicia en estado loading', async () => {
        const { fetchTrackOrder } = await import('@/api/trackOrder');
        (fetchTrackOrder as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

        const { result } = renderHook(() =>
            useTrackOrder({ codigo: 'SC-0001', token: VALID_TOKEN })
        );

        // Si no hay caché, debe iniciar en loading
        expect(result.current.loading).toBe(true);
    });

    it('carga datos correctamente al montar', async () => {
        const { fetchTrackOrder } = await import('@/api/trackOrder');
        (fetchTrackOrder as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

        const { result } = renderHook(() =>
            useTrackOrder({ codigo: 'SC-0001', token: VALID_TOKEN })
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data).toEqual(mockData);
        expect(result.current.error).toBeNull();
    });

    it('muestra error de TrackOrderError con su mensaje exacto', async () => {
        const { fetchTrackOrder, TrackOrderError } = await import('@/api/trackOrder');
        (fetchTrackOrder as ReturnType<typeof vi.fn>).mockRejectedValue(
            new (TrackOrderError as any)('Orden no encontrada.', 404)
        );

        const { result } = renderHook(() =>
            useTrackOrder({ codigo: 'SC-9999', token: VALID_TOKEN })
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe('Orden no encontrada.');
    });

    it('muestra mensaje genérico en errores desconocidos', async () => {
        const { fetchTrackOrder } = await import('@/api/trackOrder');
        (fetchTrackOrder as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() =>
            useTrackOrder({ codigo: 'SC-0001', token: VALID_TOKEN })
        );

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Ha ocurrido un error inesperado.');
    });

    it('usa datos del caché en la segunda renderización y no llama al API', async () => {
        const { fetchTrackOrder } = await import('@/api/trackOrder');
        (fetchTrackOrder as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

        // Primera renderización: llama al API
        const { result: r1 } = renderHook(() =>
            useTrackOrder({ codigo: 'SC-0001', token: VALID_TOKEN })
        );
        await waitFor(() => expect(r1.current.loading).toBe(false));
        expect(fetchTrackOrder).toHaveBeenCalledTimes(1);

        // Segunda renderización: usa caché, no llama al API
        const { result: r2 } = renderHook(() =>
            useTrackOrder({ codigo: 'SC-0001', token: VALID_TOKEN })
        );
        expect(r2.current.data).toEqual(mockData);
        expect(fetchTrackOrder).toHaveBeenCalledTimes(1); // sigue siendo 1
    });

    it('refetch limpia el caché y vuelve a llamar al API', async () => {
        const { fetchTrackOrder } = await import('@/api/trackOrder');
        (fetchTrackOrder as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

        const { result } = renderHook(() =>
            useTrackOrder({ codigo: 'SC-0001', token: VALID_TOKEN })
        );
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(fetchTrackOrder).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.refetch();
        });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(fetchTrackOrder).toHaveBeenCalledTimes(2);
    });

    it('no llama al API y muestra error si faltan parámetros', async () => {
        const { fetchTrackOrder: noCallFetch } = await import('@/api/trackOrder');

        const { result } = renderHook(() => useTrackOrder({ codigo: '', token: '' }));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Faltan parámetros. Verifica el enlace de seguimiento.');
        expect(noCallFetch).not.toHaveBeenCalled();
    });

    it('expone una función refetch', () => {
        const { result } = renderHook(() => useTrackOrder({ codigo: '', token: '' }));

        expect(typeof result.current.refetch).toBe('function');
    });
});
