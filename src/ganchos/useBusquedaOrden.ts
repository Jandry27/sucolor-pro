import { useState, useCallback } from 'react';
import { buscarOrden, BusquedaOrdenError, type SearchParams } from '@/servicios/buscarOrden';
import type { BusquedaOrdenState } from '@/tipos';
import { registrarEventoAnalytics } from '@/biblioteca/googleAnalytics';

export function useBusquedaOrden() {
    const [state, setState] = useState<BusquedaOrdenState>({
        result: null,
        loading: false,
        error: null,
    });

    const search = useCallback(async (params: SearchParams) => {
        const metodo = 'placa' in params ? 'placa' : 'nombre';

        registrarEventoAnalytics('buscar_vehiculo', { metodo });
        setState({ result: null, loading: true, error: null });

        try {
            const result = await buscarOrden(params);
            registrarEventoAnalytics('vehiculo_encontrado', { metodo });
            setState({ result, loading: false, error: null });
            return result;
        } catch (err) {
            const message =
                err instanceof BusquedaOrdenError
                    ? err.message
                    : 'Error inesperado al buscar tu vehículo.';

            registrarEventoAnalytics('busqueda_vehiculo_error', {
                metodo,
                estado_http: err instanceof BusquedaOrdenError ? err.status : 0,
            });
            setState({ result: null, loading: false, error: message });
            return null;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ result: null, loading: false, error: null });
    }, []);

    return { ...state, search, reset };
}
