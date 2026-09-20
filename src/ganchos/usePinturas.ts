import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/biblioteca/clienteSupabase';
import type { PinturaSobrante, PinturaFormData } from '@/tipos';

interface UsePinturasState {
    pinturas: PinturaSobrante[];
    loading: boolean;
    error: string | null;
}

export function usePinturas(busqueda: string = '') {
    const [state, setState] = useState<UsePinturasState>({
        pinturas: [],
        loading: true,
        error: null,
    });

    const fetchPinturas = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            let query = supabase
                .from('inventario_pinturas')
                .select('*')
                .order('created_at', { ascending: false });

            if (busqueda.trim()) {
                const term = busqueda.trim().toLowerCase();
                query = query.or(
                    `placa.ilike.%${term}%,color.ilike.%${term}%,codigo_color.ilike.%${term}%`
                );
            }

            const { data, error } = await query;
            if (error) throw error;

            setState({ pinturas: data ?? [], loading: false, error: null });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Error al cargar pinturas';
            setState(prev => ({ ...prev, loading: false, error: msg }));
        }
    }, [busqueda]);

    useEffect(() => {
        fetchPinturas();
    }, [fetchPinturas]);

    const addPintura = async (formData: PinturaFormData): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('inventario_pinturas')
                .insert([{ ...formData, placa: formData.placa.toUpperCase().trim() }]);
            if (error) throw error;
            await fetchPinturas();
            return true;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Error al agregar pintura';
            setState(prev => ({ ...prev, error: msg }));
            return false;
        }
    };

    const updatePintura = async (id: string, formData: PinturaFormData): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('inventario_pinturas')
                .update({ ...formData, placa: formData.placa.toUpperCase().trim() })
                .eq('id', id);
            if (error) throw error;
            await fetchPinturas();
            return true;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Error al actualizar pintura';
            setState(prev => ({ ...prev, error: msg }));
            return false;
        }
    };

    const deletePintura = async (id: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('inventario_pinturas')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await fetchPinturas();
            return true;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Error al eliminar pintura';
            setState(prev => ({ ...prev, error: msg }));
            return false;
        }
    };

    return {
        ...state,
        refetch: fetchPinturas,
        addPintura,
        updatePintura,
        deletePintura,
    };
}
