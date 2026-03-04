import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminOrder, OrderStatus } from '@/types';

export function useOrders(filterEstado?: OrderStatus) {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Step 1: fetch orders (no join — avoids FK constraint requirement)
            let ordQ = supabase
                .from('ordenes')
                .select('id, codigo, estado, prioridad, fecha_ingreso, fecha_estimada, notas_publicas, notas_internas, share_enabled, share_token, precio_total, monto_pagado, updated_at, cliente_id, vehiculo_id')
                .order('fecha_ingreso', { ascending: false });

            if (filterEstado) ordQ = ordQ.eq('estado', filterEstado);

            const { data: ordenes, error: ordErr } = await ordQ;
            if (ordErr) throw ordErr;
            if (!ordenes || ordenes.length === 0) {
                setOrders([]);
                return;
            }

            // Step 2: fetch related clients and vehicles in batch
            const clienteIds = [...new Set(ordenes.map(o => o.cliente_id).filter(Boolean))];
            const vehiculoIds = [...new Set(ordenes.map(o => o.vehiculo_id).filter(Boolean))];

            const [{ data: clientes }, { data: vehiculos }] = await Promise.all([
                supabase.from('clientes').select('id, nombres, telefono, email, cedula, created_at').in('id', clienteIds),
                supabase.from('vehiculos').select('id, anio, color, marca, placa, modelo').in('id', vehiculoIds),
            ]);

            const clienteMap = Object.fromEntries((clientes ?? []).map(c => [c.id, c]));
            const vehiculoMap = Object.fromEntries((vehiculos ?? []).map(v => [v.id, v]));

            // Step 3: merge
            const merged: AdminOrder[] = ordenes.map(o => ({
                ...o,
                cliente: clienteMap[o.cliente_id] ?? { id: o.cliente_id, nombres: '—' },
                vehiculo: vehiculoMap[o.vehiculo_id] ?? { id: o.vehiculo_id, marca: '—', modelo: '', placa: '—', color: '', anio: '' },
            })) as AdminOrder[];

            setOrders(merged);
        } catch (e) {
            console.error('[useOrders]', e);
            setError('No se pudo cargar las órdenes.');
        } finally {
            setLoading(false);
        }
    }, [filterEstado]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const updateEstado = useCallback(async (id: string, estado: OrderStatus) => {
        const { error } = await supabase.from('ordenes').update({ estado }).eq('id', id);
        if (!error) setOrders(prev => prev.map(o => o.id === id ? { ...o, estado } : o));
        return !error;
    }, []);

    const toggleShare = useCallback(async (id: string, enabled: boolean) => {
        const { error } = await supabase.from('ordenes').update({ share_enabled: enabled }).eq('id', id);
        if (!error) setOrders(prev => prev.map(o => o.id === id ? { ...o, share_enabled: enabled } : o));
        return !error;
    }, []);

    return { orders, loading, error, refetch: fetchOrders, updateEstado, toggleShare };
}
