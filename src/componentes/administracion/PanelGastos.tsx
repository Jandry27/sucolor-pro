import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, FileText, Trash2, Camera, Receipt } from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import type { OrdenGasto } from '@/tipos';

interface PanelGastosProps {
    ordenId: string;
}

export function PanelGastos({ ordenId }: PanelGastosProps) {
    const [gastos, setGastos] = useState<OrdenGasto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Formulario
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [facturaUrl, setFacturaUrl] = useState<string | null>(null);
    const [facturaFile, setFacturaFile] = useState<File | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [lightbox, setLightbox] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const loadGastos = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('orden_gastos')
            .select('*')
            .eq('orden_id', ordenId)
            .order('created_at', { ascending: false });
        if (data) {
            setGastos(data as OrdenGasto[]);
        }
        setLoading(false);
    }, [ordenId]);

    useEffect(() => { loadGastos(); }, [loadGastos]);

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setFacturaFile(files[0]);
        // Solo previsualizamos, se sube cuando se guarda el formulario
        const tempUrl = URL.createObjectURL(files[0]);
        setFacturaUrl(tempUrl);
    };

    const removeFile = () => {
        setFacturaFile(null);
        setFacturaUrl(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSaveGasto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!descripcion.trim() || !monto) return;

        const numericMonto = parseFloat(monto);
        if (isNaN(numericMonto) || numericMonto <= 0) {
            setError("Monto inválido");
            return;
        }

        setSaving(true);
        setError(null);
        let finalImageUrl = null;

        try {
            // 1. Subir a Cloudinary si hay archivo
            if (facturaFile) {
                const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

                if (!cloudName || !uploadPreset) {
                    throw new Error("Faltan credenciales de Cloudinary en el entorno.");
                }

                const formData = new FormData();
                formData.append('file', facturaFile);
                formData.append('upload_preset', uploadPreset);
                formData.append('folder', `sucolor/gastos/${ordenId}`);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errTxt = await res.text();
                    throw new Error(`Cloudinary error: ${errTxt}`);
                }

                const data = await res.json();
                finalImageUrl = data.secure_url;
            }

            // 2. Guardar en Base de Datos
            const { data: insertData, error: insertErr } = await supabase.from('orden_gastos').insert({
                orden_id: ordenId,
                descripcion: descripcion.trim(),
                monto: numericMonto,
                factura_url: finalImageUrl
            }).select().single();

            if (insertErr) throw insertErr;

            // 3. Actualizar estado y limpiar formulario
            if (insertData) setGastos(prev => [insertData as OrdenGasto, ...prev]);
            setDescripcion('');
            setMonto('');
            removeFile();

        } catch (err: any) {
            setError(`Error al guardar gasto: ${err.message}`);
            console.error("Gasto save error:", err);
        } finally {
            setSaving(false);
        }
    };

    const deleteGasto = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('¿Eliminar este gasto?')) return;

        await supabase.from('orden_gastos').delete().eq('id', id);
        setGastos(prev => prev.filter(g => g.id !== id));
    };

    const totalGastos = gastos.reduce((acc, curr) => acc + Number(curr.monto), 0);

    return (
        <div className="glass-card space-y-4" style={{ padding: '20px' }}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-4 h-4 text-[#F97316]" />
                <h3 className="font-semibold text-[#0F172A] text-sm">Repuestos y Gastos</h3>
                <div className="ml-auto text-xs font-bold bg-[rgba(249, 115, 22,0.08)] text-[#F97316] px-2.5 py-1 rounded-md">
                    Total: ${totalGastos.toFixed(2)}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-[#EF4444]"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-[rgba(239,68,68,0.60)] hover:text-[#EF4444]">✕</button>
                </div>
            )}

            {/* Formulario de Nuevo Gasto */}
            <form onSubmit={handleSaveGasto} className="bg-[#F7F8FA] p-3.5 rounded-xl border border-[rgba(15,23,42,0.07)] space-y-3">
                <h4 className="text-xs font-bold text-[rgba(11,18,32,0.50)] uppercase tracking-wider mb-2">Agregar nuevo Gasto</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] tracking-wider mb-1 block">Descripción (Repuesto/Servicio)</label>
                        <input value={descripcion} onChange={e => setDescripcion(e.target.value)} required type="text" placeholder="Ej. Filtro de aceite, Pintura roja..." className="w-full text-sm px-3 py-2 rounded-lg border border-[rgba(15,23,42,0.15)] bg-white/50 focus:outline-none focus:border-[#F97316]" disabled={saving} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] tracking-wider mb-1 block">Costo ($)</label>
                        <input value={monto} onChange={e => setMonto(e.target.value)} required type="number" step="0.01" min="0" placeholder="0.00" className="w-full text-sm px-3 py-2 rounded-lg border border-[rgba(15,23,42,0.15)] bg-white/50 focus:outline-none focus:border-[#F97316]" disabled={saving} />
                    </div>
                </div>

                <div className="pt-1">
                    <label className="text-[10px] uppercase font-bold text-[rgba(15,23,42,0.40)] tracking-wider mb-1 block">Factura o recibo (Opcional)</label>

                    {!facturaUrl ? (
                        <div
                            className="border border-dashed rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-white/50 hover:border-[#F97316] group"
                            style={{ borderColor: 'rgba(15,23,42,0.15)' }}
                            onClick={() => fileRef.current?.click()}
                        >
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files)} />
                            <Camera className="w-4 h-4 text-[rgba(15,23,42,0.40)] group-hover:text-[#F97316] transition-colors" />
                            <span className="text-xs text-[rgba(15,23,42,0.50)] group-hover:text-[#F97316] transition-colors">Adjuntar foto de la factura</span>
                        </div>
                    ) : (
                        <div className="relative inline-block border border-[rgba(15,23,42,0.10)] rounded-lg p-1 bg-white">
                            <img src={facturaUrl} alt="Preview" className="h-16 w-auto object-cover rounded-md" />
                            <button type="button" onClick={removeFile} className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-[rgba(15,23,42,0.1)] hover:bg-gray-50 text-[rgba(11,18,32,0.5)] hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={saving || !descripcion.trim() || !monto} className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                        {saving ? 'Guardando...' : 'Guardar Gasto'}
                    </button>
                </div>
            </form>

            {/* Listado de Gastos */}
            <div className="mt-5">
                <h4 className="text-xs font-bold text-[rgba(15,23,42,0.50)] uppercase tracking-wider mb-3">Historial de Repuestos / Gastos</h4>

                {loading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
                    </div>
                ) : gastos.length === 0 ? (
                    <div className="flex flex-col items-center py-6 gap-2 bg-[rgba(15,23,42,0.02)] rounded-xl border border-[rgba(15,23,42,0.05)] border-dashed">
                        <FileText className="w-6 h-6 text-[rgba(15,23,42,0.20)]" />
                        <p className="text-sm text-[rgba(15,23,42,0.40)]">No hay gastos registrados para esta orden</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {gastos.map(gasto => (
                                <motion.div
                                    key={gasto.id}
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(15,23,42,0.06)] hover:bg-[rgba(15,23,42,0.02)] transition-colors group"
                                >
                                    {gasto.factura_url ? (
                                        <div
                                            className="w-10 h-10 rounded-md overflow-hidden bg-[rgba(15,23,42,0.05)] border border-[rgba(15,23,42,0.08)] cursor-pointer flex-shrink-0 relative"
                                            onClick={() => setLightbox(gasto.factura_url)}
                                        >
                                            <img src={gasto.factura_url} alt="Factura" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <Camera className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-md bg-[rgba(15,23,42,0.03)] border border-[rgba(15,23,42,0.06)] flex items-center justify-center flex-shrink-0">
                                            <Receipt className="w-4 h-4 text-[rgba(11,18,32,0.30)]" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#0F172A] truncate placeholder:">{gasto.descripcion}</p>
                                        <p className="text-[10px] text-[rgba(15,23,42,0.45)]">
                                            {new Date(gasto.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-bold text-sm text-[#0F172A]">${Number(gasto.monto).toFixed(2)}</span>
                                        <button
                                            onClick={(e) => deleteGasto(gasto.id, e)}
                                            className="p-1.5 rounded-md hover:bg-red-50 text-[rgba(15,23,42,0.30)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar gasto"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Lightbox para facturas */}
            {lightbox && (
                <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm"
                    onClick={() => setLightbox(null)}>
                    <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                    <div className="bg-white rounded-2xl overflow-hidden max-w-full max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
                        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Receipt className="w-4 h-4 text-gray-400" /> Factura / Recibo adjunto</span>
                            <button onClick={() => setLightbox(null)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <img src={lightbox} alt="Factura" className="max-w-full max-h-[75vh] object-contain block" />
                    </div>
                </div>
            )}
        </div>
    );
}
