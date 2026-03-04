import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, ToggleLeft, ToggleRight, Copy, Check, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PhotoUploadPanel } from '@/components/admin/PhotoUploadPanel';
import { PaymentPanel } from '@/components/admin/PaymentPanel';
import type { AdminOrder, OrderStatus } from '@/types';

const ESTADOS: { value: OrderStatus; label: string }[] = [
    { value: 'RECIBIDO', label: 'Recibido' },
    { value: 'LATONERIA', label: 'Latonería' },
    { value: 'PREPARACION', label: 'Preparación' },
    { value: 'PINTURA', label: 'Pintura' },
    { value: 'SECADO', label: 'Secado' },
    { value: 'PULIDO_DETALLES', label: 'Pulido' },
    { value: 'TERMINADO', label: 'Terminado' },
    { value: 'ENTREGADO', label: 'Entregado' },
];

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<AdminOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [precioTotal, setPrecioTotal] = useState(0);
    const [montoPagado, setMontoPagado] = useState(0);

    useEffect(() => {
        if (!id) return;
        setLoading(true); setError(null);
        supabase.from('ordenes')
            .select('id, codigo, estado, prioridad, fecha_ingreso, fecha_estimada, notas_publicas, notas_internas, share_enabled, share_token, cliente_id, vehiculo_id, precio_total, monto_entrada, monto_pagado')
            .eq('id', id).single()
            .then(async ({ data: ord, error: ordErr }) => {
                if (ordErr || !ord) { setError('No se pudo cargar la orden.'); setLoading(false); return; }
                const [{ data: cliente }, { data: vehiculo }] = await Promise.all([
                    supabase.from('clientes').select('id, nombres, telefono').eq('id', ord.cliente_id).single(),
                    supabase.from('vehiculos').select('id, anio, color, marca, placa, modelo').eq('id', ord.vehiculo_id).single(),
                ]);
                setOrder({ ...ord, cliente: cliente ?? { id: ord.cliente_id, nombres: '—', created_at: '' }, vehiculo: vehiculo ?? { id: ord.vehiculo_id, marca: '—', modelo: '', placa: '—', color: '', anio: '' } } as unknown as AdminOrder);
                setPrecioTotal(ord.precio_total ?? 0);
                setMontoPagado(ord.monto_pagado ?? 0);
                setLoading(false);
            });
    }, [id]);

    const updateEstado = async (estado: OrderStatus) => {
        if (!order) return;
        setSaving(true);
        const { error } = await supabase.from('ordenes').update({ estado }).eq('id', order.id);
        if (!error) setOrder(prev => prev ? { ...prev, estado } : prev);
        setSaving(false);
    };

    const toggleShare = async () => {
        if (!order) return;
        setSaving(true);
        const newVal = !order.share_enabled;
        const { error } = await supabase.from('ordenes').update({ share_enabled: newVal }).eq('id', order.id);
        if (!error) setOrder(prev => prev ? { ...prev, share_enabled: newVal } : prev);
        setSaving(false);
    };

    const copyLink = () => {
        if (!order?.share_token) return;
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/admin.*/, '');
        navigator.clipboard.writeText(`${baseUrl}#/track/${order.codigo}?token=${order.share_token}`);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const trackUrl = order?.share_token
        ? `${window.location.origin}${window.location.pathname.replace(/\/admin.*/, '')}#/track/${order.codigo}?token=${order.share_token}`
        : null;

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-7 h-7 text-[#FF5100] animate-spin" />
            </div>
        </AdminLayout>
    );

    if (error || !order) return (
        <AdminLayout>
            <div className="card flex flex-col items-center justify-center py-16 gap-3 max-w-sm mx-auto">
                <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
                <p className="text-sm text-[rgba(11,18,32,0.55)]">{error ?? 'Orden no encontrada'}</p>
                <button onClick={() => navigate(-1)} className="btn-secondary text-sm">Volver</button>
            </div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
                {/* Breadcrumb */}
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-[rgba(11,18,32,0.45)] hover:text-[#FF5100] transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver al dashboard
                </button>

                {/* Header card */}
                <motion.div className="card" style={{ padding: '20px' }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <span className="font-mono-code text-xs text-[#FF5100] font-bold">{order.codigo}</span>
                            <h1 className="text-xl font-bold text-[#0B1220] mt-1">
                                {(order.cliente as any).nombres}
                            </h1>
                            <p className="text-sm text-[rgba(11,18,32,0.50)] mt-0.5">
                                {order.vehiculo.marca} {order.vehiculo.modelo} —{' '}
                                <span className="font-mono-code">{order.vehiculo.placa}</span>
                            </p>
                        </div>
                        {saving && <Loader2 className="w-4 h-4 text-[#FF5100] animate-spin mt-1" />}
                    </div>
                </motion.div>

                {/* Estado */}
                <motion.div className="card" style={{ padding: '20px' }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <h2 className="text-sm font-semibold text-[#0B1220] mb-3">Estado de la orden</h2>
                    <div className="flex flex-wrap gap-2">
                        {ESTADOS.map(st => (
                            <button key={st.value} onClick={() => updateEstado(st.value)} disabled={saving}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${order.estado === st.value
                                    ? 'text-white'
                                    : 'text-[rgba(11,18,32,0.55)] bg-[rgba(15,23,42,0.05)] hover:bg-[rgba(15,23,42,0.08)] border border-[rgba(15,23,42,0.08)]'
                                    }`}
                                style={order.estado === st.value ? { background: '#FF5100', boxShadow: '0 2px 8px rgba(255,81,0,0.25)' } : {}}>
                                {st.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Portal del cliente */}
                <motion.div className="card" style={{ padding: '20px' }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-[#FF5100]" />
                            <h2 className="text-sm font-semibold text-[#0B1220]">Portal cliente</h2>
                        </div>
                        <button onClick={toggleShare} disabled={saving}
                            className="flex items-center gap-2 text-sm transition-colors">
                            {order.share_enabled
                                ? <ToggleRight className="w-5 h-5 text-[#FF5100]" />
                                : <ToggleLeft className="w-5 h-5 text-[rgba(11,18,32,0.35)]" />}
                            <span className={order.share_enabled ? 'text-[#FF5100] font-medium text-xs' : 'text-[rgba(11,18,32,0.45)] text-xs'}>
                                {order.share_enabled ? 'Activo' : 'Inactivo'}
                            </span>
                        </button>
                    </div>

                    {order.share_token && trackUrl ? (
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-2 p-3 bg-[#F7F8FA] border border-[rgba(15,23,42,0.07)] rounded-xl">
                                <p className="flex-1 text-xs font-mono-code text-[rgba(11,18,32,0.55)] truncate">{trackUrl}</p>
                                <button onClick={copyLink}
                                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.05)] text-[rgba(11,18,32,0.40)] hover:text-[#0B1220] transition-all">
                                    {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <Link to={`/track/${order.codigo}?token=${order.share_token}`} target="_blank"
                                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.05)] text-[rgba(11,18,32,0.40)] hover:text-[#0B1220] transition-all">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            {!order.share_enabled && (
                                <p className="text-xs text-[#F59E0B] font-medium">
                                    ⚠️ El portal está desactivado — el cliente no puede acceder con el enlace
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-[rgba(11,18,32,0.45)]">Esta orden aún no tiene token de seguimiento.</p>
                    )}
                </motion.div>

                {/* Notas */}
                <motion.div className="card" style={{ padding: '20px' }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <h2 className="text-sm font-semibold text-[#0B1220] mb-2">Notas para el cliente</h2>
                    <p className={`text-sm leading-relaxed ${order.notas_publicas ? 'text-[rgba(11,18,32,0.65)]' : 'text-[rgba(11,18,32,0.30)] italic'}`}>
                        {order.notas_publicas ?? 'Sin notas públicas'}
                    </p>
                </motion.div>

                {/* Pagos */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
                    <PaymentPanel ordenId={order.id} precioTotal={precioTotal} montoPagado={montoPagado}
                        onUpdate={(fields) => {
                            if (fields.precio_total !== undefined) setPrecioTotal(fields.precio_total);
                            if (fields.monto_pagado !== undefined) setMontoPagado(fields.monto_pagado);
                        }} />
                </motion.div>

                {/* Fotos */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <PhotoUploadPanel ordenId={order.id} ordCodigo={order.codigo} />
                </motion.div>
            </div>
        </AdminLayout>
    );
}
