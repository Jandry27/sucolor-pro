import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ImageOff, ZoomIn } from 'lucide-react';
import type { MediaItem } from '@/types';
import { MEDIA_CATEGORIES } from '@/lib/constants';

interface MediaGalleryProps {
    media: MediaItem[];
}
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
    const goNext = useCallback(
        () => setLightboxIndex(p => (p === null ? 0 : (p + 1) % filtered.length)),
        [filtered.length]
    );
    const goPrev = useCallback(
        () => setLightboxIndex(p => (p === null ? 0 : (p - 1 + filtered.length) % filtered.length)),
        [filtered.length]
    );

    const counts = MEDIA_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
        acc[cat.key] = media.filter(m => m.categoria === cat.key).length;
        return acc;
    }, {});

    return (
        <>
            <motion.div
                className="glass-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.16, ease: 'easeOut' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        Galería de imágenes
                    </h3>
                    <span className="text-xs text-[rgba(11,18,32,0.40)] dark:text-slate-500">
                        {media.length} foto{media.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Segmented control tabs */}
                <div className="segmented-control mb-5">
                    {MEDIA_CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            className={`seg-btn flex items-center justify-center gap-1.5 ${activeTab === cat.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(cat.key as CategoryKey)}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                            {counts[cat.key] > 0 && (
                                <span
                                    className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{
                                        background:
                                            activeTab === cat.key
                                                ? 'rgba(249, 115, 22,0.15)'
                                                : 'rgba(15,23,42,0.06)',
                                        color:
                                            activeTab === cat.key
                                                ? '#F97316'
                                                : 'rgba(11,18,32,0.45)',
                                    }}
                                >
                                    {counts[cat.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <AnimatePresence mode="wait">
                    {filtered.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-3 py-14"
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                <ImageOff className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Sin imágenes aún
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                    Las fotos aparecerán aquí cuando el taller las suba
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                        >
                            {filtered.map((item, i) => (
                                <motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.04, duration: 0.25 }}
                                    onClick={() => openLightbox(i)}
                                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 cursor-pointer"
                                    style={{ display: 'block', textAlign: 'left' }}
                                >
                                    <img
                                        src={item.signed_url}
                                        alt={item.categoria}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
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
                    <motion.div
                        className="fixed top-0 left-0 w-full z-[100] flex items-center justify-center bg-zinc-950/95"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                        style={{
                            height: '100dvh',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                        }}
                    >
                        {/* Top bar (Fixed) */}
                        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex justify-between items-center z-50 pointer-events-none">
                            <a
                                href={filtered[lightboxIndex].signed_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pointer-events-auto bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs px-4 py-2.5 sm:py-2 rounded-full flex items-center gap-2 transition-all backdrop-blur-md shadow-lg"
                                onClick={e => e.stopPropagation()}
                            >
                                <ZoomIn className="w-4 h-4" />
                                <span className="hidden sm:inline font-medium">Ver original</span>
                                <span className="sm:hidden font-medium">Zoom</span>
                            </a>
                            <button
                                onClick={closeLightbox}
                                className="pointer-events-auto text-white/70 hover:text-white bg-white/10 hover:bg-white/20 hover:scale-110 p-3 sm:p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Image Container */}
                        <div
                            onClick={e => e.stopPropagation()}
                            className="relative w-full h-full flex items-center justify-center p-4 sm:p-16"
                        >
                            <motion.img
                                key={lightboxIndex}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                src={filtered[lightboxIndex].signed_url}
                                alt="Imagen de vehículo"
                                className="max-w-full object-contain rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.6)]"
                                style={{ maxHeight: 'calc(100dvh - 160px)', width: 'auto' }}
                            />

                            {/* Counter at bottom */}
                            <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-none">
                                <span className="text-xs font-semibold text-white/90 tracking-wide">
                                    {lightboxIndex + 1} / {filtered.length}
                                </span>
                            </div>
                        </div>

                        {/* Nav arrows (Fixed sides) */}
                        {filtered.length > 1 && (
                            <>
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        goPrev();
                                    }}
                                    className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full text-white/60 hover:text-white bg-zinc-800/40 hover:bg-white/10 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all shadow-xl group active:scale-95"
                                >
                                    <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        goNext();
                                    }}
                                    className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full text-white/60 hover:text-white bg-zinc-800/40 hover:bg-white/10 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all shadow-xl group active:scale-95"
                                >
                                    <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
