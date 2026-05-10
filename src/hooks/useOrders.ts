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
            if (ordErr) {
                console.error("SUPABASE ERROR FETCHING ORDENES:", ordErr);
                throw ordErr;
            }
            if (!ordenes || ordenes.length === 0) {
                setOrders([]);
                return;
            }

            // Step 2: fetch related clients and vehicles in batch
            const clienteIds = [...new Set(ordenes.map(o => o.cliente_id).filter(Boolean))];
            const vehiculoIds = [...new Set(ordenes.map(o => o.vehiculo_id).filter(Boolean))];

            const [{ data: clientes }, { data: vehiculos }] = await Promise.all([
                clienteIds.length > 0 ? supabase.from('clientes').select('id, nombres, telefono, email, cedula, created_at').in('id', clienteIds) : { data: [] },
                vehiculoIds.length > 0 ? supabase.from('vehiculos').select('id, anio, color, marca, placa, modelo').in('id', vehiculoIds) : { data: [] },
            ]);

            const clienteMap = Object.fromEntries((clientes ?? []).map(c => [c.id, c]));
            const vehiculoMap = Object.fromEntries((vehiculos ?? []).map(v => [v.id, v]));

            // Step 2.5: fetch cover photos
            const orderIds = ordenes.map(o => o.id);
            const { data: mediaFiles } = await supabase
                .from('media')
                .select('orden_id, storage_bucket, storage_path, url')
                .in('orden_id', orderIds)
                .eq('categoria', 'ANTES')
                .order('created_at', { ascending: true }); // Get the first uploaded photo

            // Use order_id as key, grab the URL of the first one found
            const coverPhotos: Record<string, string> = {};
            if (mediaFiles && mediaFiles.length > 0) {
                // Group by order
                const firstMediaMap = new Map<string, any>();
                mediaFiles.forEach(file => {
                    if (!firstMediaMap.has(file.orden_id)) {
                        firstMediaMap.set(file.orden_id, file);
                    }
                });

                // Request URLs
                const urlsToFetch = Array.from(firstMediaMap.entries()).map(async ([ordId, file]) => {
                    try {
                        if (file.url) {
                            coverPhotos[ordId] = file.url; // Nueva lógica (Cloudinary)
                        } else if (file.storage_bucket && file.storage_path) {
                            // Lógica legacy (Supabase Storage)
                            const { data } = await supabase.storage.from(file.storage_bucket).createSignedUrl(file.storage_path, 3600);
                            if (data?.signedUrl) coverPhotos[ordId] = data.signedUrl;
                        }
                    } catch (e) {
                        console.error('Error fetching cover photo URL', e);
                    }
                });
                await Promise.all(urlsToFetch);
            }

            // Step 3: merge
            const merged: AdminOrder[] = ordenes.map(o => ({
                ...o,
                cliente: clienteMap[o.cliente_id] ?? { id: o.cliente_id, nombres: '—' },
                vehiculo: vehiculoMap[o.vehiculo_id] ?? { id: o.vehiculo_id, marca: '—', modelo: '', placa: '—', color: '', anio: '' },
                coverPhoto: coverPhotos[o.id] ?? null,
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

    const deleteOrder = useCallback(async (id: string) => {
        const { error } = await supabase.from('ordenes').delete().eq('id', id);
        if (!error) setOrders(prev => prev.filter(o => o.id !== id));
        return !error;
    }, []);

    return { orders, loading, error, refetch: fetchOrders, updateEstado, toggleShare, deleteOrder };
}
