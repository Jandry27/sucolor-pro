import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useSearchOrder } from '@/hooks/useSearchOrder';

export function SearchForm() {
    const navigate = useNavigate();
    const [placa, setPlaca] = useState('');
    const { loading, error, search } = useSearchOrder();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!placa.trim()) return;
        const result = await search({ placa: placa.trim().toUpperCase() });
        if (result?.ok && result.codigo && result.token) {
            navigate(`/track/${result.codigo}?token=${result.token}`);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(11,18,32,0.30)] pointer-events-none" />
                    <input type="text" value={placa} onChange={e => setPlaca(e.target.value)}
                        placeholder="Ej. LAA-1362" maxLength={10}
                        className="input-field pl-10 font-mono-code text-base tracking-widest uppercase"
                        style={{ letterSpacing: '0.12em' }} />
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm text-[#EF4444]"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit */}
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '12px 18px' }}>
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Buscando...</>
                    ) : (
                        <><Search className="w-4 h-4" /> Consultar estado</>
                    )}
                </button>
            </form>
        </div>
    );
}
