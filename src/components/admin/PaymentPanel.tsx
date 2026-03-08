import { useState } from 'react';
import { Loader2, DollarSign, CheckCircle, AlertCircle, Clock, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PaymentPanelProps {
    ordenId: string;
    precioTotal: number;
    montoPagado: number;
    onUpdate: (fields: { precio_total?: number; monto_pagado?: number }) => void;
}

function fmt(n: number) {
    return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

export function PaymentPanel({ ordenId, precioTotal, montoPagado, onUpdate }: PaymentPanelProps) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [total, setTotal] = useState(precioTotal.toString());
    const [pagado, setPagado] = useState(montoPagado.toString());

    const saldo = precioTotal - montoPagado;
    const pct = precioTotal > 0 ? Math.min(100, (montoPagado / precioTotal) * 100) : 0;
    const completo = saldo <= 0 && precioTotal > 0;

    const save = async () => {
        setSaving(true);
        const fields = { precio_total: parseFloat(total) || 0, monto_pagado: parseFloat(pagado) || 0 };
        const { error } = await supabase.from('ordenes').update(fields).eq('id', ordenId);
        setSaving(false);
        if (!error) { onUpdate(fields); setEditing(false); }
    };

    return (
        <div className="glass-card space-y-4" style={{ padding: '20px' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#FF6A00]" />
                    <h3 className="font-semibold text-[#0F172A] text-sm">Control de pagos</h3>
                </div>
                {!editing && (
                    <button onClick={() => setEditing(true)} className="btn-ghost text-xs gap-1.5">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                )}
            </div>

            {/* Status badge */}
            <div>
                {completo ? (
                    <span className="badge-success">
                        <CheckCircle className="w-3 h-3" /> Pagado completo
                    </span>
                ) : precioTotal === 0 ? (
                    <span className="badge-neutral">
                        <Clock className="w-3 h-3" /> Sin valor registrado
                    </span>
                ) : (
                    <span className="badge-warning">
                        <AlertCircle className="w-3 h-3" /> Saldo pendiente: {fmt(saldo)}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            {precioTotal > 0 && (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[rgba(15,23,42,0.45)]">
                        <span>Pagado: {fmt(montoPagado)}</span>
                        <span>Total: {fmt(precioTotal)}</span>
                    </div>
                    <div className="h-1.5 bg-[rgba(15,23,42,0.07)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: completo ? '#16A34A' : 'linear-gradient(90deg, #FF6A00, #F59E0B)' }} />
                    </div>
                    <p className="text-xs text-[rgba(15,23,42,0.40)]">{pct.toFixed(0)}% pagado</p>
                </div>
            )}

            {/* Summary (view) */}
            {!editing && (
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Valor total', value: fmt(precioTotal), highlight: false },
                        { label: 'Total pagado', value: fmt(montoPagado), highlight: true },
                    ].map(({ label, value, highlight }) => (
                        <div key={label} className="rounded-xl p-3 text-center border border-[rgba(15,23,42,0.07)]"
                            style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                            <p className="text-xs text-[rgba(15,23,42,0.45)] mb-1">{label}</p>
                            <p className={`font-bold text-sm ${highlight ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit form */}
            {editing && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label">Valor total ($)</label>
                            <input value={total} onChange={e => setTotal(e.target.value)}
                                type="number" min="0" step="0.01" className="input-field" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="form-label">Total pagado ($)</label>
                            <input value={pagado} onChange={e => setPagado(e.target.value)}
                                type="number" min="0" step="0.01" className="input-field" placeholder="0.00" />
                        </div>
                    </div>
                    <p className="text-xs text-[rgba(15,23,42,0.45)]">
                        Saldo: <span className="font-semibold text-[#F59E0B]">
                            {fmt(Math.max(0, (parseFloat(total) || 0) - (parseFloat(pagado) || 0)))}
                        </span>
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setEditing(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                        <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
