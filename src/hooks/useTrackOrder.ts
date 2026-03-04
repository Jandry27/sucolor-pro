import { useState, useEffect, useCallback } from 'react';
import { fetchTrackOrder, TrackOrderError } from '@/api/trackOrder';
import type { TrackOrderState } from '@/types';

interface UseTrackOrderOptions {
    codigo: string;
    token: string;
}

export function useTrackOrder({ codigo, token }: UseTrackOrderOptions): TrackOrderState & {
    refetch: () => void;
} {
    const [state, setState] = useState<TrackOrderState>({
        data: null,
        loading: true,
        error: null,
    });

    const fetchData = useCallback(async () => {
        // Guard: both params required
        if (!codigo || !token) {
            setState({
                data: null,
                loading: false,
                error: 'Faltan parámetros. Verifica el enlace de seguimiento.',
            });
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await fetchTrackOrder(codigo, token);
            setState({ data, loading: false, error: null });
        } catch (err) {
            const message =
                err instanceof TrackOrderError
                    ? err.message
                    : 'Ha ocurrido un error inesperado.';
            setState({ data: null, loading: false, error: message });
        }
    }, [codigo, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        ...state,
        refetch: fetchData,
    };
}
