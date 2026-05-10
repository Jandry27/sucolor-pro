import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Search } from 'lucide-react';
import type { OrdenGasto } from '@/types';
import { formatDateTime } from '@/lib/constants';
import { useState } from 'react';

// Lightbox for public view
const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div className="w-full max-w-3xl flex justify-between items-center mb-4 z-10" onClick={(e) => e.stopPropagation()}>
                <a href={src} target="_blank" rel="noopener noreferrer" className="bg-white/10 border border-white/10 hover:bg-white/20 text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" /> Ver original para hacer zoom
                </a>
                <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white p-2.5 rounded-full hover:bg-white/20 transition-colors bg-white/10 backdrop-blur-md"
                    aria-label="Cerrar factura"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
            </div>

            <div className="relative max-w-full" onClick={(e) => e.stopPropagation()}>
                <motion.img
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    src={src}
                    alt="Factura"
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                />
            </div>
        </motion.div>
    </AnimatePresence>
);

interface PublicGastosPanelProps {
    gastos: OrdenGasto[];
}

export function PublicGastosPanel({ gastos }: PublicGastosPanelProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const totalGastos = gastos?.reduce((sum, g) => sum + (g.monto || 0), 0) || 0;

    return (
        <motion.div className="glass-card"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24, ease: 'easeOut' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-[#F97316] dark:text-[#FB923C]">
                    <DollarSign className="w-5 h-5" />
                    <h3 className="font-semibold text-[#0F172A] dark:text-slate-100 text-sm">Repuestos y Gastos</h3>
                </div>
                {totalGastos > 0 && (
                    <span className="font-bold text-[#F97316] dark:text-[#FB923C] text-sm">
                        Total: ${(totalGastos).toFixed(2)}
                    </span>
                )}
            </div>

            {gastos && gastos.length > 0 ? (
                <div className="space-y-3">
                    {gastos.map((gasto, i) => (
                        <motion.div
                            key={gasto.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-xl border border-[rgba(15,23,42,0.06)] dark:border-[rgba(255,255,255,0.06)] bg-white/50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                        >
                            <div className="flex items-start sm:items-center gap-4">
                                {gasto.factura_url && (
                                    <div
                                        className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-slate-200/50 group-hover:border-[#F97316]/50 transition-colors"
                                        onClick={() => setSelectedImage(gasto.factura_url!)}
                                        title="Ver factura adjunta"
                                    >
                                        <img
                                            src={gasto.factura_url}
                                            alt="Miniatura factura"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://via.placeholder.com/150?text=Err";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Search className="w-4 h-4 text-white drop-shadow-md" />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-sm text-[rgba(11,18,32,0.9)] dark:text-slate-200">{gasto.descripcion}</p>
                                    <p className="text-xs text-[rgba(11,18,32,0.4)] dark:text-slate-500 mt-0.5">{formatDateTime(gasto.created_at)}</p>
                                </div>
                            </div>
                            <div className="font-mono-code font-bold text-[rgba(11,18,32,0.9)] dark:text-slate-200">
                                ${(gasto.monto || 0).toFixed(2)}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-[rgba(15,23,42,0.15)] dark:border-[rgba(255,255,255,0.15)] bg-[rgba(15,23,42,0.02)] dark:bg-[rgba(255,255,255,0.02)]">
                    <p className="text-sm text-[rgba(11,18,32,0.4)] dark:text-slate-500 mb-3">No hay registros de repuestos ni gastos adicionales en esta orden.</p>
                </div>
            )}

            {/* Lightbox for large image */}
            {selectedImage && <Lightbox src={selectedImage} onClose={() => setSelectedImage(null)} />}
        </motion.div>
    );
}
