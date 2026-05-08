import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, ImageOff, Trash2, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Categoria = 'ANTES' | 'PROCESO' | 'DESPUES';

interface MediaItem { id: string; url: string; categoria: Categoria; caption?: string; }
interface PhotoUploadPanelProps { ordenId: string; ordCodigo: string; }

const CATS: { key: Categoria; label: string }[] = [
    { key: 'ANTES', label: 'Antes' },
    { key: 'PROCESO', label: 'Proceso' },
    { key: 'DESPUES', label: 'Después' },
];

export function PhotoUploadPanel({ ordenId }: PhotoUploadPanelProps) {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Categoria>('ANTES');
    const [lightbox, setLightbox] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const loadMedia = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('media').select('id, url, categoria, caption, storage_path, storage_bucket')
            .eq('orden_id', ordenId).order('created_at', { ascending: true });
        if (data) {
            const items = await Promise.all(data.map(async (m) => {
                if (m.storage_path && m.storage_bucket) {
                    const { data: signed } = await supabase.storage.from(m.storage_bucket).createSignedUrl(m.storage_path, 3600);
                    return { ...m, url: signed?.signedUrl ?? m.url ?? '' };
                }
                return { ...m, url: m.url ?? '' };
            }));
            setMedia(items as MediaItem[]);
        }
        setLoading(false);
    }, [ordenId]);

    useEffect(() => { loadMedia(); }, [loadMedia]);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true); setUploadError(null);

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            setUploadError("Faltan credenciales de Cloudinary en el entorno.");
            setUploading(false);
            return;
        }

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', uploadPreset);
                formData.append('folder', `sucolor/ordenes/${ordenId}/${activeTab}`);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errTxt = await res.text();
                    throw new Error(`Cloudinary HTTP error ${res.status}: ${errTxt}`);
                }

                const data = await res.json();
                const secureUrl = data.secure_url;

                if (!secureUrl) throw new Error("Cloudinary no devolvió una secure_url");

                const { data: mediaRow, error: insertErr } = await supabase.from('media').insert({
                    orden_id: ordenId,
                    tipo: 'FOTO',
                    categoria: activeTab,
                    storage_bucket: null,
                    storage_path: null,
                    url: secureUrl,
                }).select('id').single();

                if (insertErr) throw new Error(`Foto subida pero no guardada en DB: ${insertErr.message}`);

                setMedia(prev => [...prev, { id: mediaRow?.id ?? `temp_${Date.now()}`, url: secureUrl, categoria: activeTab }]);

            } catch (err: any) {
                setUploadError(`Error al subir: ${err.message}`);
                console.error("Cloudinary upload error:", err);
            }
        }
        setUploading(false);
    };

    const deleteMedia = async (id: string) => {
        await supabase.from('media').delete().eq('id', id);
        setMedia(prev => prev.filter(m => m.id !== id));
    };

    const filtered = media.filter(m => m.categoria === activeTab);

    return (
        <div className="glass-card space-y-4" style={{ padding: '20px' }}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#F97316]" />
                <h3 className="font-semibold text-[#0F172A] text-sm">Galería de fotos</h3>
                <span className="ml-auto text-xs text-[rgba(15,23,42,0.40)]">{media.length} foto{media.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Error */}
            {uploadError && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-[#EF4444]"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <span className="flex-1">{uploadError}</span>
                    <button onClick={() => setUploadError(null)} className="text-[rgba(239,68,68,0.60)] hover:text-[#EF4444]">✕</button>
                </div>
            )}

            {/* Segmented tabs */}
            <div className="segmented-control">
                {CATS.map(c => (
                    <button key={c.key} className={`seg-btn flex items-center gap-1 ${activeTab === c.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(c.key)}>
                        {c.label}
                        {media.filter(m => m.categoria === c.key).length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1"
                                style={{
                                    background: activeTab === c.key ? 'rgba(249, 115, 22,0.12)' : 'rgba(15,23,42,0.07)',
                                    color: activeTab === c.key ? '#F97316' : 'rgba(15,23,42,0.50)',
                                }}>
                                {media.filter(m => m.categoria === c.key).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Drop zone */}
            <div
                className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all duration-150"
                style={{ borderColor: 'rgba(15,23,42,0.12)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#F97316')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(15,23,42,0.12)')}
                onClick={() => fileRef.current?.click()}
            >
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handleFiles(e.target.files)} />
                {uploading ? (
                    <><Loader2 className="w-5 h-5 text-[#F97316] animate-spin" /><p className="text-sm text-[rgba(15,23,42,0.50)]">Subiendo...</p></>
                ) : (
                    <>
                        <Upload className="w-5 h-5 text-[rgba(15,23,42,0.30)]" />
                        <p className="text-sm text-[rgba(15,23,42,0.50)] text-center">
                            Click o arrastra fotos de <span className="font-semibold text-[#F97316]">{activeTab.toLowerCase()}</span>
                        </p>
                    </>
                )}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2">
                    <ImageOff className="w-7 h-7 text-[rgba(15,23,42,0.20)]" />
                    <p className="text-sm text-[rgba(15,23,42,0.40)]">Sin fotos en esta categoría</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    <AnimatePresence>
                        {filtered.map(item => (
                            <motion.div key={item.id}
                                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                className="group relative aspect-square rounded-xl overflow-hidden bg-[rgba(15,23,42,0.04)] border border-[rgba(15,23,42,0.07)]">
                                <img src={item.url} alt="" className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setLightbox(item.url)} />
                                <button onClick={() => deleteMedia(item.id)}
                                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                                    <Trash2 className="w-3.5 h-3.5 text-[#EF4444] group-hover:text-white" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm"
                    onClick={() => setLightbox(null)}>
                    <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                    <img src={lightbox} alt="" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
                </div>
            )}
        </div>
    );
}
