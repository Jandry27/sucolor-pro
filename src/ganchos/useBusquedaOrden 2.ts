import { useState, useCallback } from 'react';
import { buscarOrden, BusquedaOrdenError, type SearchParams } from '@/servicios/buscarOrden';
import type { BusquedaOrdenState } from '@/tipos';

export function useBusquedaOrden() {
    const [state, setState] = useState<BusquedaOrdenState>({
        result: null,
        loading: false,
        error: null,
    });

    const search = useCallback(async (params: SearchParams) => {
        setState({ result: null, loading: true, error: null });

        try {
            const result = await buscarOrden(params);
            setState({ result, loading: false, error: null });
            return result;
        } catch (err) {
            const message =
                err instanceof BusquedaOrdenError
                    ? err.message
                    : 'Error inesperado al buscar tu vehículo.';
            setState({ result: null, loading: false, error: message });
            return null;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ result: null, loading: false, error: null });
    }, []);

    return { ...state, search, reset };
}
