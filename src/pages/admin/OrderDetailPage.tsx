import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, ToggleLeft, ToggleRight, Copy, Check, Loader2, AlertTriangle, ExternalLink, Trash2, Edit2, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PhotoUploadPanel } from '@/components/admin/PhotoUploadPanel';
import { PaymentPanel } from '@/components/admin/PaymentPanel';
import { GastosPanel } from '@/components/admin/GastosPanel';
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

    // Edit states (Client & Vehicle)
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editNombres, setEditNombres] = useState('');
    const [editPlaca, setEditPlaca] = useState('');
    const [editMarca, setEditMarca] = useState('');
    const [editModelo, setEditModelo] = useState('');
    const [savingDetails, setSavingDetails] = useState(false);

    // Edit states (Notes)
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editNotasPublicas, setEditNotasPublicas] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

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

    const handleDeleteOrder = async () => {
        if (!order) return;
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.')) return;

        setSaving(true);
        const { error } = await supabase.from('ordenes').delete().eq('id', order.id);
        setSaving(false);

        if (!error) {
            navigate('/admin/orders');
        } else {
            console.error('Error deleting order:', error);
            alert('Asegúrese de eliminar primero los pagos y las fotos asociadas a la orden.');
        }
    };

    const handleEditDetails = () => {
        if (!order) return;
        setEditNombres((order.cliente as any).nombres === 'Cliente anónimo (No registrado)' || (order.cliente as any).nombres === '—' ? '' : (order.cliente as any).nombres);
        setEditPlaca(order.vehiculo.placa === '—' ? '' : order.vehiculo.placa);
        setEditMarca(order.vehiculo.marca === '—' ? '' : order.vehiculo.marca);
        setEditModelo(order.vehiculo.modelo || '');
        setIsEditingDetails(true);
    };

    const handleSaveDetails = async () => {
        if (!order) return;
        setSavingDetails(true);
        try {
            if (order.cliente_id) {
                await supabase.from('clientes').update({ nombres: editNombres }).eq('id', order.cliente_id);
            }
            if (order.vehiculo_id) {
                await supabase.from('vehiculos').update({
                    placa: editPlaca.toUpperCase(),
                    marca: editMarca,
                    modelo: editModelo
                }).eq('id', order.vehiculo_id);
            }

            setOrder({
                ...order,
                cliente: { ...(order.cliente as any), nombres: editNombres || 'Cliente anónimo (No registrado)' },
                vehiculo: { ...order.vehiculo, placa: editPlaca.toUpperCase() || '—', marca: editMarca || '—', modelo: editModelo }
            } as any);
            setIsEditingDetails(false);
        } catch (e) {
            console.error(e);
            alert('Error al guardar detalles');
        } finally {
            setSavingDetails(false);
        }
    };

    const handleEditNotes = () => {
        if (!order) return;
        setEditNotasPublicas(order.notas_publicas || '');
        setIsEditingNotes(true);
    };

    const handleSaveNotes = async () => {
        if (!order) return;
        setSavingNotes(true);
        try {
            const val = editNotasPublicas.trim() === '' ? null : editNotasPublicas;
            await supabase.from('ordenes').update({ notas_publicas: val }).eq('id', order.id);
            setOrder({ ...order, notas_publicas: val } as any);
            setIsEditingNotes(false);
        } catch (e) {
            console.error(e);
            alert('Error al guardar notas');
        } finally {
            setSavingNotes(false);
        }
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
                        {isEditingDetails ? (
                            <div className="w-full space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-mono-code text-xs text-[#FF5100] font-bold">{order.codigo}</span>
                                    <span className="text-xs text-[rgba(11,18,32,0.40)] font-medium bg-[rgba(15,23,42,0.04)] px-2 py-0.5 rounded-md">
                                        Modo Edición
                                    </span>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">Cliente</label>
                                        <input value={editNombres} onChange={e => setEditNombres(e.target.value)} placeholder="Nombre del cliente" className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA]" disabled={!order.cliente_id} />
                                        {!order.cliente_id && <p className="text-[10px] text-orange-500 mt-1">Orden registrada sin cliente (Anónimo)</p>}
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">Placa</label>
                                        <input value={editPlaca} onChange={e => setEditPlaca(e.target.value)} placeholder="ABC-1234" className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA] font-mono uppercase" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">Marca</label>
                                        <input value={editMarca} onChange={e => setEditMarca(e.target.value)} placeholder="Marca" className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA]" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">Modelo</label>
                                        <input value={editModelo} onChange={e => setEditModelo(e.target.value)} placeholder="Modelo" className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA]" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2 border-t border-[rgba(15,23,42,0.06)]">
                                    <button onClick={handleSaveDetails} disabled={savingDetails} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
                                        {savingDetails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar
                                    </button>
                                    <button onClick={() => setIsEditingDetails(false)} disabled={savingDetails} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs border-transparent hover:bg-[rgba(15,23,42,0.06)]">
                                        <X className="w-3.5 h-3.5" /> Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <span className="font-mono-code text-xs text-[#FF5100] font-bold">{order.codigo}</span>
                                    <h1 className="text-xl font-bold text-[#0B1220] mt-1">
                                        {(order.cliente as any).nombres}
                                    </h1>
                                    <p className="text-sm text-[rgba(11,18,32,0.50)] mt-0.5 flex items-center gap-1">
                                        {order.vehiculo.marca} {order.vehiculo.modelo} —{' '}
                                        <span className="font-mono-code">{order.vehiculo.placa}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {saving && <Loader2 className="w-4 h-4 text-[#FF5100] animate-spin mt-1" />}
                                    <button
                                        onClick={handleEditDetails}
                                        disabled={saving}
                                        className="p-2 text-[rgba(11,18,32,0.40)] bg-[rgba(15,23,42,0.03)] hover:bg-[rgba(15,23,42,0.06)] hover:text-[#0B1220] rounded-lg transition-colors border border-transparent hover:border-[rgba(15,23,42,0.1)]"
                                        title="Editar detalles del cliente y vehículo"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleDeleteOrder}
                                        disabled={saving}
                                        className="p-2 text-[#EF4444] bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.1)] hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.2)] rounded-lg transition-colors ml-1"
                                        title="Eliminar orden"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        )}
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
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-semibold text-[#0B1220]">Notas para el cliente</h2>
                        {!isEditingNotes && (
                            <button
                                onClick={handleEditNotes}
                                className="p-1.5 text-[rgba(11,18,32,0.40)] bg-[rgba(15,23,42,0.03)] hover:bg-[rgba(15,23,42,0.06)] hover:text-[#0B1220] rounded-lg transition-colors border border-transparent hover:border-[rgba(15,23,42,0.1)]"
                                title="Editar notas"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    {isEditingNotes ? (
                        <div className="space-y-3">
                            <textarea
                                value={editNotasPublicas}
                                onChange={e => setEditNotasPublicas(e.target.value)}
                                rows={3}
                                placeholder="Escribe aquí los detalles del trabajo a realizar..."
                                className="w-full text-sm p-3 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA] resize-none focus:outline-none focus:border-[#FF5100] focus:ring-1 focus:ring-[#FF5100]"
                            />
                            <div className="flex items-center gap-2">
                                <button onClick={handleSaveNotes} disabled={savingNotes} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
                                    {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar notas
                                </button>
                                <button onClick={() => setIsEditingNotes(false)} disabled={savingNotes} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs border-transparent hover:bg-[rgba(15,23,42,0.06)]">
                                    <X className="w-3.5 h-3.5" /> Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className={`text-sm leading-relaxed ${order.notas_publicas ? 'text-[rgba(11,18,32,0.65)]' : 'text-[rgba(11,18,32,0.30)] italic'}`}>
                            {order.notas_publicas ?? 'Sin notas públicas'}
                        </p>
                    )}
                </motion.div>

                {/* Gastos y Repuestos */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                    <GastosPanel ordenId={order.id} />
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
