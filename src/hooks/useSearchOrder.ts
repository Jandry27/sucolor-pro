import { useState, useCallback } from 'react';
import { searchOrder, SearchOrderError, type SearchParams } from '@/api/searchOrder';
import type { SearchOrderState } from '@/types';

export function useSearchOrder() {
    const [state, setState] = useState<SearchOrderState>({
        result: null,
        loading: false,
        error: null,
    });

    const search = useCallback(async (params: SearchParams) => {
        setState({ result: null, loading: true, error: null });

        try {
            const result = await searchOrder(params);
            setState({ result, loading: false, error: null });
            return result;
        } catch (err) {
            const message =
                err instanceof SearchOrderError
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
