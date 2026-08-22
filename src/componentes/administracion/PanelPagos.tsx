import { useState, useRef } from 'react';
import {
    Loader2,
    DollarSign,
    CheckCircle,
    AlertCircle,
    Clock,
    Pencil,
    Trash2,
    Upload,
    Image,
    ExternalLink,
    X,
} from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import { sonidoPagoRegistrado, sonidoPagoEliminado, sonidoPagoCompleto, sonidoDetallesGuardados, sonidoError } from '@/biblioteca/sonidos';

interface PanelPagosProps {
    ordenId: string;
    precioTotal: number;
    montoPagado: number;
    notasInternas?: string | null;
    onUpdate: (fields: {
        precio_total?: number;
        monto_pagado?: number;
        notas_internas?: string | null;
    }) => void;
}

interface Abono {
    id: string;
    fecha: string;
    monto: number;
    nota: string;
    metodo?: string;
    comprobante?: string;
}

const METODOS_PAGO = ['Efectivo', 'Transferencia'];
const ABONOS_MARKER = '---ABONOS---';

function fmt(n: number) {
    return n.toLocaleString('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    });
}

const parseAbonos = (notas: string | null | undefined): Abono[] => {
    if (!notas) return [];
    const idx = notas.indexOf(ABONOS_MARKER);
    if (idx !== -1) {
        try {
            const jsonStr = notas.substring(idx + ABONOS_MARKER.length).trim();
            return JSON.parse(jsonStr) as Abono[];
        } catch {
            return [];
        }
    }
    return [];
};

const getRawNotas = (notas: string | null | undefined): string => {
    if (!notas) return '';
    const idx = notas.indexOf(ABONOS_MARKER);
    if (idx !== -1) return notas.substring(0, idx).trim();
    return notas.trim();
};

const METODO_COLORS: Record<string, { bg: string; text: string }> = {
    Efectivo:      { bg: 'rgba(22,163,74,0.10)',  text: '#15803D' },
    Transferencia: { bg: 'rgba(59,130,246,0.10)',  text: '#1D4ED8' },
    Tarjeta:       { bg: 'rgba(168,85,247,0.10)',  text: '#7E22CE' },
    Cheque:        { bg: 'rgba(234,179,8,0.10)',   text: '#A16207' },
};

export function PanelPagos({
    ordenId,
    precioTotal,
    montoPagado,
    notasInternas,
    onUpdate,
}: PanelPagosProps) {
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [total, setTotal] = useState(precioTotal.toString());

    const [abonos, setAbonos] = useState<Abono[]>(() => {
        let abs = parseAbonos(notasInternas);
        if (abs.length === 0 && montoPagado > 0) {
            abs = [{
                id: 'legacy',
                fecha: new Date().toISOString().split('T')[0],
                monto: montoPagado,
                nota: 'Saldo inicial registrado',
                metodo: 'Efectivo',
            }];
        }
        return abs;
    });

    const [addingAbono, setAddingAbono] = useState(false);
    const [newAbono, setNewAbono] = useState({
        fecha: new Date().toISOString().split('T')[0],
        monto: '',
        nota: '',
        metodo: 'Efectivo',
    });

    const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
    const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
    const [uploadingComp, setUploadingComp] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const currentMontoPagado = abonos.reduce((acc, a) => acc + Number(a.monto), 0);
    const saldo = precioTotal - currentMontoPagado;
    const pct = precioTotal > 0 ? Math.min(100, (currentMontoPagado / precioTotal) * 100) : 0;
    const completo = saldo <= 0 && precioTotal > 0;

    const saveTotal = async () => {
        setSaving(true);
        const fields = { precio_total: parseFloat(total) || 0 };
        const { error } = await supabase.from('ordenes').update(fields).eq('id', ordenId);
        setSaving(false);
        if (!error) { onUpdate(fields); setEditing(false); sonidoDetallesGuardados(); }
        else { sonidoError(); }
    };

    const uploadComprobante = async (): Promise<string | null> => {
        if (!comprobanteFile) return null;
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        if (!cloudName || !uploadPreset) return null;
        setUploadingComp(true);
        try {
            const formData = new FormData();
            formData.append('file', comprobanteFile);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', `sucolor/comprobantes/${ordenId}`);
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: 'POST', body: formData }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.secure_url ?? null;
        } catch (e) {
            console.error('Cloudinary upload error:', e);
            return null;
        } finally {
            setUploadingComp(false);
        }
    };

    const handleComprobanteFile = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        setComprobanteFile(file);
        setComprobantePreview(URL.createObjectURL(file));
    };

    const clearComprobante = () => {
        if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
        setComprobanteFile(null);
        setComprobantePreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const saveAbono = async () => {
        if (!newAbono.monto) return;
        setSaving(true);
        let comprobanteUrl: string | undefined = undefined;
        if (newAbono.metodo === 'Transferencia' && comprobanteFile) {
            const url = await uploadComprobante();
            if (url) comprobanteUrl = url;
        }
        const montoNum = parseFloat(newAbono.monto);
        const newAb: Abono = {
            id: Math.random().toString(36).substring(2, 9),
            fecha: newAbono.fecha || new Date().toISOString().split('T')[0],
            monto: montoNum,
            nota: newAbono.nota.trim(),
            metodo: newAbono.metodo,
            ...(comprobanteUrl ? { comprobante: comprobanteUrl } : {}),
        };
        const updatedAbonos = [...abonos, newAb];
        const newMontoPagado = updatedAbonos.reduce((acc, a) => acc + Number(a.monto), 0);
        const rawNotas = getRawNotas(notasInternas);
        const newNotasInternas =
            rawNotas + (rawNotas ? '\n\n' : '') + ABONOS_MARKER + '\n' + JSON.stringify(updatedAbonos);
        const fields = { monto_pagado: newMontoPagado, notas_internas: newNotasInternas };
        const { error } = await supabase.from('ordenes').update(fields).eq('id', ordenId);
        setSaving(false);
        if (!error) {
            setAbonos(updatedAbonos);
            setAddingAbono(false);
            setNewAbono({ fecha: new Date().toISOString().split('T')[0], monto: '', nota: '', metodo: 'Efectivo' });
            clearComprobante();
            onUpdate(fields);
            // Si el pago quedó completo, fanfarria; si no, sonido normal
            const newSaldo = (parseFloat(total) || precioTotal) - newMontoPagado;
            if (newSaldo <= 0 && precioTotal > 0) {
                sonidoPagoCompleto();
            } else {
                sonidoPagoRegistrado();
            }
        } else {
            sonidoError();
        }
    };

    const deleteAbono = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este abono?')) return;
        setSaving(true);
        const updatedAbonos = abonos.filter(a => a.id !== id);
        const newMontoPagado = updatedAbonos.reduce((acc, a) => acc + Number(a.monto), 0);
        const rawNotas = getRawNotas(notasInternas);
        const newNotasInternas = updatedAbonos.length > 0
            ? rawNotas + (rawNotas ? '\n\n' : '') + ABONOS_MARKER + '\n' + JSON.stringify(updatedAbonos)
            : rawNotas;
        const fields = { monto_pagado: newMontoPagado, notas_internas: newNotasInternas };
        const { error } = await supabase.from('ordenes').update(fields).eq('id', ordenId);
        setSaving(false);
        if (!error) { setAbonos(updatedAbonos); onUpdate(fields); sonidoPagoEliminado(); }
        else { sonidoError(); }
    };

    return (
        <>
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
                        <span className="badge-success"><CheckCircle className="w-3 h-3" /> Pagado completo</span>
                    ) : precioTotal === 0 ? (
                        <span className="badge-neutral"><Clock className="w-3 h-3" /> Sin valor registrado</span>
                    ) : (
                        <span className="badge-warning"><AlertCircle className="w-3 h-3" /> Saldo pendiente: {fmt(saldo)}</span>
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

                {/* Edit Total */}
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

                {/* Summary */}
                {!editing && (
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Valor total', value: fmt(precioTotal), highlight: false },
                            { label: 'Total pagado', value: fmt(currentMontoPagado), highlight: true },
                        ].map(({ label, value, highlight }) => (
                            <div key={label} className="rounded-xl p-3 text-center border border-[rgba(15,23,42,0.07)]"
                                style={{ background: 'rgba(255,255,255,0.5)' }}>
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
                                <button onClick={() => setAddingAbono(true)}
                                    className="btn-ghost text-xs text-[#F97316] hover:bg-[rgba(249,115,22,0.1)] px-2 py-1">
                                    + Registrar abono
                                </button>
                            )}
                        </div>

                        {/* Formulario nuevo abono */}
                        {addingAbono && (
                            <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[rgba(15,23,42,0.07)] space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] mb-1 block">Fecha</label>
                                        <input type="date" value={newAbono.fecha}
                                            onChange={e => setNewAbono({ ...newAbono, fecha: e.target.value })}
                                            className="input-field text-xs py-1.5" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] mb-1 block">Monto ($)</label>
                                        <input type="number" min="0" step="0.01" value={newAbono.monto}
                                            onChange={e => setNewAbono({ ...newAbono, monto: e.target.value })}
                                            placeholder="0.00" className="input-field text-xs py-1.5" />
                                    </div>

                                    {/* Método de pago */}
                                    <div className="col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] mb-1.5 block">Método de pago</label>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {METODOS_PAGO.map(m => {
                                                const sel = newAbono.metodo === m;
                                                const col = METODO_COLORS[m] ?? { bg: 'rgba(249,115,22,0.10)', text: '#C2550D' };
                                                return (
                                                    <button key={m} type="button"
                                                        onClick={() => {
                                                            setNewAbono({ ...newAbono, metodo: m });
                                                            if (m !== 'Transferencia') clearComprobante();
                                                        }}
                                                        className="text-[11px] font-semibold px-3 py-1 rounded-full border transition-all"
                                                        style={sel
                                                            ? { background: col.bg, color: col.text, borderColor: col.text }
                                                            : { background: 'white', color: 'rgba(11,18,32,0.45)', borderColor: 'rgba(15,23,42,0.12)' }
                                                        }>
                                                        {m}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Nota */}
                                    <div className="col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] mb-1 block">Nota (Opcional)</label>
                                        <input type="text" value={newAbono.nota}
                                            onChange={e => setNewAbono({ ...newAbono, nota: e.target.value })}
                                            placeholder="Ej: Primer abono, cuota 2..."
                                            className="input-field text-xs py-1.5" />
                                    </div>

                                    {/* Comprobante — solo si Transferencia */}
                                    {newAbono.metodo === 'Transferencia' && (
                                        <div className="col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] mb-1.5 block">
                                                Comprobante de transferencia
                                            </label>
                                            <input ref={fileRef} type="file" accept="image/*" className="hidden"
                                                onChange={e => handleComprobanteFile(e.target.files)} />
                                            {!comprobantePreview ? (
                                                <button type="button" onClick={() => fileRef.current?.click()}
                                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed transition-all text-xs font-medium"
                                                    style={{ borderColor: 'rgba(59,130,246,0.30)', color: '#1D4ED8', background: 'rgba(59,130,246,0.04)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B82F6')}
                                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.30)')}>
                                                    <Upload className="w-3.5 h-3.5" />
                                                    Subir captura del pago
                                                </button>
                                            ) : (
                                                <div className="relative rounded-xl overflow-hidden border border-[rgba(59,130,246,0.20)] bg-[rgba(59,130,246,0.04)]">
                                                    <img src={comprobantePreview} alt="Comprobante" className="w-full max-h-40 object-contain" />
                                                    <button type="button" onClick={clearComprobante}
                                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    <div className="absolute bottom-0 left-0 right-0 text-[10px] font-medium text-center py-1"
                                                        style={{ background: 'rgba(29,78,216,0.75)', color: 'white' }}>
                                                        {comprobanteFile?.name}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => { setAddingAbono(false); clearComprobante(); }}
                                        className="btn-secondary flex-1 text-xs py-1.5">Cancelar</button>
                                    <button onClick={saveAbono} disabled={saving || uploadingComp || !newAbono.monto}
                                        className="btn-primary flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5">
                                        {saving || uploadingComp ? (
                                            <><Loader2 className="w-3 h-3 animate-spin" />{uploadingComp ? 'Subiendo...' : 'Guardando...'}</>
                                        ) : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Lista abonos */}
                        {abonos.length === 0 ? (
                            <div className="flex flex-col items-center py-4 bg-[rgba(15,23,42,0.02)] rounded-lg border border-[rgba(15,23,42,0.05)] border-dashed">
                                <p className="text-xs text-[rgba(15,23,42,0.40)]">No hay abonos registrados</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {abonos.map((a, i) => {
                                    const metodoCol = METODO_COLORS[a.metodo ?? ''] ?? { bg: 'rgba(15,23,42,0.06)', text: 'rgba(11,18,32,0.45)' };
                                    return (
                                        <div key={a.id || i} className="rounded-xl bg-white border border-[rgba(15,23,42,0.06)] shadow-sm overflow-hidden">
                                            <div className="flex items-center justify-between px-3 py-2.5">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                        <p className="text-xs font-bold text-[#0F172A]">${Number(a.monto).toFixed(2)}</p>
                                                        {a.metodo && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                                style={{ background: metodoCol.bg, color: metodoCol.text }}>
                                                                {a.metodo}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-[rgba(15,23,42,0.45)] truncate">
                                                        {new Date(a.fecha).toLocaleDateString('es-ES')}{a.nota && ` · ${a.nota}`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                                                    {a.comprobante && (
                                                        <button onClick={() => setPreviewUrl(a.comprobante!)}
                                                            title="Ver comprobante"
                                                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
                                                            style={{ background: 'rgba(59,130,246,0.10)', color: '#1D4ED8' }}>
                                                            <Image className="w-3 h-3" />
                                                            Comprobante
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteAbono(a.id)} disabled={saving}
                                                        className="text-[rgba(15,23,42,0.25)] hover:text-red-500 p-1 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal preview comprobante */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setPreviewUrl(null)}>
                    <div className="relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl bg-white"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(15,23,42,0.08)]">
                            <div className="flex items-center gap-2">
                                <Image className="w-4 h-4 text-[#3B82F6]" />
                                <span className="text-sm font-semibold text-[#0F172A]">Comprobante de transferencia</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg hover:bg-[rgba(59,130,246,0.08)] text-[#3B82F6] transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                <button onClick={() => setPreviewUrl(null)}
                                    className="p-1.5 rounded-lg hover:bg-[rgba(15,23,42,0.06)] text-[rgba(11,18,32,0.40)] transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <img src={previewUrl} alt="Comprobante de pago" className="w-full max-h-[70vh] object-contain" />
                    </div>
                </div>
            )}
        </>
    );
}
