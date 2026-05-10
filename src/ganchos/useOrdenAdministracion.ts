import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/biblioteca/clienteSupabase';
import type { AdminOrder, OrderStatus } from '@/tipos';

interface UseAdminOrderReturn {
    order: AdminOrder | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    precioTotal: number;
    montoPagado: number;
    setPrecioTotal: (v: number) => void;
    setMontoPagado: (v: number) => void;
    updateEstado: (estado: OrderStatus) => Promise<void>;
    toggleShare: () => Promise<void>;
    deleteOrder: () => Promise<boolean>;
    updateDetails: (updates: {
        nombres?: string;
        telefono?: string;
        placa?: string;
        marca?: string;
        modelo?: string;
    }) => Promise<void>;
    updateNotes: (notas: string | null) => Promise<void>;
    addNoteEntry: (entry: string) => Promise<void>;
    updatePaymentFields: (fields: {
        precio_total?: number;
        monto_pagado?: number;
        notas_internas?: string | null;
    }) => void;
}

export function useOrdenAdministracion(id: string | undefined): UseAdminOrderReturn {
    const [order, setOrder] = useState<AdminOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [precioTotal, setPrecioTotal] = useState(0);
    const [montoPagado, setMontoPagado] = useState(0);

    // ── Load order ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;

        const loadOrder = async () => {
            setLoading(true);
            setError(null);

            const { data: rawOrd, error: ordErr } = await supabase
                .from('ordenes')
                .select(
                    'id, codigo, estado, prioridad, fecha_ingreso, fecha_estimada, ' +
                        'notas_publicas, notas_internas, share_enabled, share_token, ' +
                        'cliente_id, vehiculo_id, precio_total, monto_pagado, updated_at'
                )
                .eq('id', id)
                .single();

            // Cast to any: Supabase client is untyped (no Database generic)
            const ord = rawOrd as any;

            if (ordErr || !ord) {
                setError('No se pudo cargar la orden.');
                setLoading(false);
                return;
            }

            // Fetch cliente & vehiculo in parallel
            const [{ data: cliente }, { data: vehiculo }] = await Promise.all([
                supabase
                    .from('clientes')
                    .select(
                        'id, nombres, telefono, email, cedula, direccion, tipo_identificacion, notas, created_at'
                    )
                    .eq('id', ord.cliente_id)
                    .single(),
                supabase
                    .from('vehiculos')
                    .select('id, anio, color, marca, placa, modelo')
                    .eq('id', ord.vehiculo_id)
                    .single(),
            ]);

            setOrder({
                ...ord,
                cliente: cliente ?? { id: ord.cliente_id, nombres: '—', created_at: '' },
                vehiculo: vehiculo ?? {
                    id: ord.vehiculo_id,
                    marca: '—',
                    modelo: '',
                    placa: '—',
                    color: '',
                    anio: 0,
                },
            } as unknown as AdminOrder);

            setPrecioTotal(ord.precio_total ?? 0);
            setMontoPagado(ord.monto_pagado ?? 0);
            setLoading(false);
        };

        loadOrder();
    }, [id]);

    // ── Estado ────────────────────────────────────────────────────────────────
    const updateEstado = useCallback(
        async (estado: OrderStatus) => {
            if (!order) return;
            setSaving(true);
            const { error: err } = await supabase
                .from('ordenes')
                .update({ estado })
                .eq('id', order.id);
            if (!err) setOrder(prev => (prev ? { ...prev, estado } : prev));
            setSaving(false);
        },
        [order]
    );

    // ── Share toggle ──────────────────────────────────────────────────────────
    const toggleShare = useCallback(async () => {
        if (!order) return;
        setSaving(true);
        const newVal = !order.share_enabled;
        const { error: err } = await supabase
            .from('ordenes')
            .update({ share_enabled: newVal })
            .eq('id', order.id);
        if (!err) setOrder(prev => (prev ? { ...prev, share_enabled: newVal } : prev));
        setSaving(false);
    }, [order]);

    // ── Delete ────────────────────────────────────────────────────────────────
    const deleteOrder = useCallback(async (): Promise<boolean> => {
        if (!order) return false;
        setSaving(true);
        const { error: err } = await supabase.from('ordenes').delete().eq('id', order.id);
        setSaving(false);
        if (!err) return true;
        console.error('Error deleting order:', err);
        return false;
    }, [order]);

    // ── Update client & vehicle details ───────────────────────────────────────
    const updateDetails = useCallback(
        async (updates: {
            nombres?: string;
            telefono?: string;
            placa?: string;
            marca?: string;
            modelo?: string;
        }) => {
            if (!order) return;
            setSaving(true);
            try {
                if (
                    order.cliente_id &&
                    (updates.nombres !== undefined || updates.telefono !== undefined)
                ) {
                    await supabase
                        .from('clientes')
                        .update({
                            ...(updates.nombres !== undefined && { nombres: updates.nombres }),
                            ...(updates.telefono !== undefined && { telefono: updates.telefono }),
                        })
                        .eq('id', order.cliente_id);
                }
                if (
                    order.vehiculo_id &&
                    (updates.placa !== undefined ||
                        updates.marca !== undefined ||
                        updates.modelo !== undefined)
                ) {
                    await supabase
                        .from('vehiculos')
                        .update({
                            ...(updates.placa !== undefined && {
                                placa: updates.placa.toUpperCase(),
                            }),
                            ...(updates.marca !== undefined && { marca: updates.marca }),
                            ...(updates.modelo !== undefined && { modelo: updates.modelo }),
                        })
                        .eq('id', order.vehiculo_id);
                }

                setOrder(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        cliente: {
                            ...prev.cliente,
                            ...(updates.nombres !== undefined && {
                                nombres: updates.nombres || 'Cliente anónimo (No registrado)',
                            }),
                            ...(updates.telefono !== undefined && { telefono: updates.telefono }),
                        },
                        vehiculo: {
                            ...prev.vehiculo,
                            ...(updates.placa !== undefined && {
                                placa: updates.placa.toUpperCase() || '—',
                            }),
                            ...(updates.marca !== undefined && { marca: updates.marca || '—' }),
                            ...(updates.modelo !== undefined && { modelo: updates.modelo }),
                        },
                    };
                });
            } catch (e) {
                console.error('Error updating details:', e);
            } finally {
                setSaving(false);
            }
        },
        [order]
    );

    // ── Update full public notes ───────────────────────────────────────────────
    const updateNotes = useCallback(
        async (notas: string | null) => {
            if (!order) return;
            setSaving(true);
            try {
                await supabase.from('ordenes').update({ notas_publicas: notas }).eq('id', order.id);
                setOrder(prev => (prev ? { ...prev, notas_publicas: notas } : prev));
            } catch (e) {
                console.error('Error updating notes:', e);
            } finally {
                setSaving(false);
            }
        },
        [order]
    );

    // ── Add single note entry (prepended with date prefix) ────────────────────
    const addNoteEntry = useCallback(
        async (entry: string) => {
            if (!order) return;
            setSaving(true);
            try {
                const date = new Intl.DateTimeFormat('es-EC', {
                    day: '2-digit',
                    month: 'short',
                }).format(new Date());
                const newLine = `• [${date}] ${entry.trim()}`;
                const updatedNotes = order.notas_publicas
                    ? `${newLine}\n${order.notas_publicas}`
                    : newLine;
                await supabase
                    .from('ordenes')
                    .update({ notas_publicas: updatedNotes })
                    .eq('id', order.id);
                setOrder(prev => (prev ? { ...prev, notas_publicas: updatedNotes } : prev));
            } catch (e) {
                console.error('Error adding note entry:', e);
            } finally {
                setSaving(false);
            }
        },
        [order]
    );

    // ── Sync payment fields locally (Supabase handled by PanelPagos) ────────
    const updatePaymentFields = useCallback(
        (fields: {
            precio_total?: number;
            monto_pagado?: number;
            notas_internas?: string | null;
        }) => {
            setOrder(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    ...(fields.precio_total !== undefined && { precio_total: fields.precio_total }),
                    ...(fields.monto_pagado !== undefined && { monto_pagado: fields.monto_pagado }),
                    ...(fields.notas_internas !== undefined && {
                        notas_internas: fields.notas_internas,
                    }),
                };
            });
        },
        []
    );

    return {
        order,
        loading,
        saving,
        error,
        precioTotal,
        montoPagado,
        setPrecioTotal,
        setMontoPagado,
        updateEstado,
        toggleShare,
        deleteOrder,
        updateDetails,
        updateNotes,
        addNoteEntry,
        updatePaymentFields,
    };
}
