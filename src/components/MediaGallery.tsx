import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ImageOff, ZoomIn } from 'lucide-react';
import type { MediaItem } from '@/types';
import { MEDIA_CATEGORIES } from '@/lib/constants';

interface MediaGalleryProps { media: MediaItem[]; }
type CategoryKey = 'ANTES' | 'PROCESO' | 'DESPUES';

export function MediaGallery({ media }: MediaGalleryProps) {
    const [activeTab, setActiveTab] = useState<CategoryKey>('ANTES');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const filtered = media.filter(m => m.categoria === activeTab);

    const openLightbox = useCallback((i: number) => {
        setLightboxIndex(i);
        document.body.style.overflow = 'hidden';
    }, []);
    const closeLightbox = useCallback(() => {
        setLightboxIndex(null);
        document.body.style.overflow = '';
    }, []);
    const goNext = useCallback(() =>
        setLightboxIndex(p => p === null ? 0 : (p + 1) % filtered.length), [filtered.length]);
    const goPrev = useCallback(() =>
        setLightboxIndex(p => p === null ? 0 : (p - 1 + filtered.length) % filtered.length), [filtered.length]);

    const counts = MEDIA_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
        acc[cat.key] = media.filter(m => m.categoria === cat.key).length;
        return acc;
    }, {});

    return (
        <>
            <motion.div className="card" style={{ padding: '24px' }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.16, ease: 'easeOut' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-[#0B1220] text-sm">Galería de imágenes</h3>
                    <span className="text-xs text-[rgba(11,18,32,0.40)]">{media.length} foto{media.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Segmented control tabs */}
                <div className="segmented-control mb-5">
                    {MEDIA_CATEGORIES.map(cat => (
                        <button key={cat.key} className={`seg-btn ${activeTab === cat.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(cat.key as CategoryKey)}>
                            {cat.label}
                            {counts[cat.key] > 0 && (
                                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{
                                        background: activeTab === cat.key ? 'rgba(255,81,0,0.10)' : 'rgba(15,23,42,0.06)',
                                        color: activeTab === cat.key ? '#FF5100' : 'rgba(11,18,32,0.45)',
                                    }}>
                                    {counts[cat.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <AnimatePresence mode="wait">
                    {filtered.length === 0 ? (
                        <motion.div key="empty"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-3 py-14">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(15,23,42,0.05)' }}>
                                <ImageOff className="w-5 h-5 text-[rgba(11,18,32,0.30)]" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-[rgba(11,18,32,0.50)]">Sin imágenes aún</p>
                                <p className="text-xs text-[rgba(11,18,32,0.35)] mt-0.5">
                                    Las fotos aparecerán aquí cuando el taller las suba
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key={activeTab}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {filtered.map((item, i) => (
                                <motion.button key={item.id}
                                    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.04, duration: 0.25 }}
                                    onClick={() => openLightbox(i)}
                                    className="group relative aspect-square rounded-xl overflow-hidden bg-[rgba(15,23,42,0.04)] border border-[rgba(15,23,42,0.07)] cursor-pointer"
                                    style={{ display: 'block', textAlign: 'left' }}>
                                    <img src={item.signed_url} alt={item.categoria}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && filtered[lightboxIndex] && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
                        <div onClick={e => e.stopPropagation()} className="relative max-w-3xl w-full flex flex-col items-center">
                            {/* Actions Header */}
                            <div className="w-full flex justify-between items-center mb-4">
                                <a href={filtered[lightboxIndex].signed_url} target="_blank" rel="noopener noreferrer"
                                    className="bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors backdrop-blur-md">
                                    <ZoomIn className="w-3.5 h-3.5" /> Ver original para hacer zoom
                                </a>
                                <button onClick={closeLightbox}
                                    className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <img src={filtered[lightboxIndex].signed_url} alt=""
                                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
                            <p className="text-center text-xs text-white/50 mt-3">
                                {lightboxIndex + 1} / {filtered.length}
                            </p>
                        </div>
                        {/* Nav arrows */}
                        {filtered.length > 1 && (
                            <>
                                <button onClick={e => { e.stopPropagation(); goPrev(); }}
                                    className="absolute left-3 sm:left-6 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button onClick={e => { e.stopPropagation(); goNext(); }}
                                    className="absolute right-3 sm:right-6 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
