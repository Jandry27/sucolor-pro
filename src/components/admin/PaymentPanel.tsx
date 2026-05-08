import { useState } from 'react';
import { Loader2, DollarSign, CheckCircle, AlertCircle, Clock, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PaymentPanelProps {
    ordenId: string;
    precioTotal: number;
    montoPagado: number;
    notasInternas?: string | null;
    onUpdate: (fields: { precio_total?: number; monto_pagado?: number; notas_internas?: string | null }) => void;
}

interface Abono {
    id: string;
    fecha: string;
    monto: number;
    nota: string;
}

const ABONOS_MARKER = '---ABONOS---';

function fmt(n: number) {
    return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

const parseAbonos = (notas: string | null | undefined): Abono[] => {
    if (!notas) return [];
    const idx = notas.indexOf(ABONOS_MARKER);
    if (idx !== -1) {
        try {
            const jsonStr = notas.substring(idx + ABONOS_MARKER.length).trim();
            return JSON.parse(jsonStr) as Abono[];
        } catch { return []; }
    }
    return [];
};

const getRawNotas = (notas: string | null | undefined): string => {
    if (!notas) return '';
    const idx = notas.indexOf(ABONOS_MARKER);
    if (idx !== -1) return notas.substring(0, idx).trim();
    return notas.trim();
};

export function PaymentPanel({ ordenId, precioTotal, montoPagado, notasInternas, onUpdate }: PaymentPanelProps) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [total, setTotal] = useState(precioTotal.toString());
    
    // Abonos logic
    const [abonos, setAbonos] = useState<Abono[]>(() => {
        let abs = parseAbonos(notasInternas);
        if (abs.length === 0 && montoPagado > 0) {
            abs = [{ id: 'legacy', fecha: new Date().toISOString().split('T')[0], monto: montoPagado, nota: 'Saldo inicial registrado' }];
        }
        return abs;
    });
    
    const [addingAbono, setAddingAbono] = useState(false);
    const [newAbono, setNewAbono] = useState({ fecha: new Date().toISOString().split('T')[0], monto: '', nota: '' });

    // The actual paid amount is now dynamically calculated from abonos
    const currentMontoPagado = abonos.reduce((acc, a) => acc + Number(a.monto), 0);
    const saldo = precioTotal - currentMontoPagado;
    const pct = precioTotal > 0 ? Math.min(100, (currentMontoPagado / precioTotal) * 100) : 0;
    const completo = saldo <= 0 && precioTotal > 0;

    const saveTotal = async () => {
        setSaving(true);
        const fields = { precio_total: parseFloat(total) || 0 };
        const { error } = await supabase.from('ordenes').update(fields).eq('id', ordenId);
        setSaving(false);
        if (!error) { onUpdate(fields); setEditing(false); }
    };

    const saveAbono = async () => {
        if (!newAbono.monto) return;
        setSaving(true);
        const montoNum = parseFloat(newAbono.monto);
        
        // Ensure legacy is not kept as "legacy" id if we modify it, but it's fine.
        const newAb: Abono = {
            id: Math.random().toString(36).substring(2, 9),
            fecha: newAbono.fecha || new Date().toISOString().split('T')[0],
            monto: montoNum,
            nota: newAbono.nota.trim()
        };
        
        const updatedAbonos = [...abonos, newAb];
        const newMontoPagado = updatedAbonos.reduce((acc, a) => acc + Number(a.monto), 0);
        const rawNotas = getRawNotas(notasInternas);
        const newNotasInternas = rawNotas + (rawNotas ? '\n\n' : '') + ABONOS_MARKER + '\n' + JSON.stringify(updatedAbonos);

        const fields = { monto_pagado: newMontoPagado, notas_internas: newNotasInternas };
        const { error } = await supabase.from('ordenes').update(fields).eq('id', ordenId);
        setSaving(false);
        
        if (!error) {
            setAbonos(updatedAbonos);
            setAddingAbono(false);
            setNewAbono({ fecha: new Date().toISOString().split('T')[0], monto: '', nota: '' });
            onUpdate(fields);
        }
    };

    const deleteAbono = async (id: string) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este abono?")) return;
        setSaving(true);
        
        const updatedAbonos = abonos.filter(a => a.id !== id);
        const newMontoPagado = updatedAbonos.reduce((acc, a) => acc + Number(a.monto), 0);
        const rawNotas = getRawNotas(notasInternas);
        const newNotasInternas = updatedAbonos.length > 0 ? rawNotas + (rawNotas ? '\n\n' : '') + ABONOS_MARKER + '\n' + JSON.stringify(updatedAbonos) : rawNotas;
        
        const fields = { monto_pagado: newMontoPagado, notas_internas: newNotasInternas };
        const { error } = await supabase.from('ordenes').update(fields).eq('id', ordenId);
        setSaving(false);
        
        if (!error) {
            setAbonos(updatedAbonos);
            onUpdate(fields);
        }
    };

    return (
        <div className="glass-card space-y-4" style={{ padding: '20px' }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#F97316]" />
                    <h3 className="font-semibold text-[#0F172A] text-sm">Control de pagos</h3>
                </div>
                {!editing && (
                    <button onClick={() => setEditing(true)} className="btn-ghost text-xs gap-1.5">
                        <Pencil className="w-3.5 h-3.5" /> Editar Total
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
                        <span>Pagado: {fmt(currentMontoPagado)}</span>
                        <span>Total: {fmt(precioTotal)}</span>
                    </div>
                    <div className="h-1.5 bg-[rgba(15,23,42,0.07)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: completo ? '#16A34A' : 'linear-gradient(90deg, #F97316, #F59E0B)' }} />
                    </div>
                    <p className="text-xs text-[rgba(15,23,42,0.40)]">{pct.toFixed(0)}% pagado</p>
                </div>
            )}

            {/* Edit form for Total */}
            {editing && (
                <div className="space-y-3">
                    <div>
                        <label className="form-label">Valor total de la orden ($)</label>
                        <input value={total} onChange={e => setTotal(e.target.value)}
                            type="number" min="0" step="0.01" className="input-field" placeholder="0.00" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setEditing(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                        <button onClick={saveTotal} disabled={saving} className="btn-primary flex-1 text-sm">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Summary (view) */}
            {!editing && (
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Valor total', value: fmt(precioTotal), highlight: false },
                        { label: 'Total pagado', value: fmt(currentMontoPagado), highlight: true },
                    ].map(({ label, value, highlight }) => (
                        <div key={label} className="rounded-xl p-3 text-center border border-[rgba(15,23,42,0.07)]"
                            style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
                            <p className="text-xs text-[rgba(15,23,42,0.45)] mb-1">{label}</p>
                            <p className={`font-bold text-sm ${highlight ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Abonos Section */}
            {!editing && (
                <div className="mt-6 pt-5 border-t border-[rgba(15,23,42,0.06)] space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider">Historial de Abonos</h4>
                        {!addingAbono && !completo && (
                            <button onClick={() => setAddingAbono(true)} className="btn-ghost text-xs text-[#F97316] hover:bg-[rgba(249,115,22,0.1)] px-2 py-1">
                                + Registrar abono
                            </button>
                        )}
                    </div>

                    {addingAbono && (
                        <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[rgba(15,23,42,0.07)] space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] mb-1 block">Fecha</label>
                                    <input type="date" value={newAbono.fecha} onChange={e => setNewAbono({...newAbono, fecha: e.target.value})} className="input-field text-xs py-1.5" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] mb-1 block">Monto ($)</label>
                                    <input type="number" min="0" step="0.01" value={newAbono.monto} onChange={e => setNewAbono({...newAbono, monto: e.target.value})} placeholder="0.00" className="input-field text-xs py-1.5" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] mb-1 block">Nota (Opcional)</label>
                                    <input type="text" value={newAbono.nota} onChange={e => setNewAbono({...newAbono, nota: e.target.value})} placeholder="Ej: Efectivo, Transferencia..." className="input-field text-xs py-1.5" />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setAddingAbono(false)} className="btn-secondary flex-1 text-xs py-1.5">Cancelar</button>
                                <button onClick={saveAbono} disabled={saving || !newAbono.monto} className="btn-primary flex-1 text-xs py-1.5">
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {abonos.length === 0 ? (
                        <div className="flex flex-col items-center py-4 bg-[rgba(15,23,42,0.02)] rounded-lg border border-[rgba(15,23,42,0.05)] border-dashed">
                            <p className="text-xs text-[rgba(15,23,42,0.40)]">No hay abonos registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {abonos.map((a, i) => (
                                <div key={a.id || i} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[rgba(15,23,42,0.05)] shadow-sm">
                                    <div>
                                        <p className="text-xs font-semibold text-[#0F172A]">${Number(a.monto).toFixed(2)}</p>
                                        <p className="text-[10px] text-[rgba(15,23,42,0.45)]">{new Date(a.fecha).toLocaleDateString('es-ES')} {a.nota && `· ${a.nota}`}</p>
                                    </div>
                                    <button onClick={() => deleteAbono(a.id)} disabled={saving} className="text-[rgba(15,23,42,0.25)] hover:text-red-500 p-1">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
