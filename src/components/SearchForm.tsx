import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Car, User, Loader2, AlertCircle } from 'lucide-react';
import { useSearchOrder } from '@/hooks/useSearchOrder';

type Tab = 'placa' | 'nombre';

export function SearchForm() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('placa');
    const [placa, setPlaca] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const { loading, error, search } = useSearchOrder();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let result;
        if (tab === 'placa') {
            if (!placa.trim()) return;
            result = await search({ placa: placa.trim().toUpperCase() });
        } else {
            if (!nombre.trim() || !apellido.trim()) return;
            result = await search({ nombre: nombre.trim(), apellido: apellido.trim() });
        }
        if (result?.ok && result.codigo && result.token) {
            navigate(`/track/${result.codigo}?token=${result.token}`);
        }
    };

    return (
        <div className="w-full">
            {/* Segmented control */}
            <div className="segmented-control w-full mb-4">
                {(['placa', 'nombre'] as Tab[]).map(t => (
                    <button key={t} type="button"
                        className={`seg-btn flex-1 flex items-center justify-center gap-1.5 ${tab === t ? 'active' : ''}`}
                        onClick={() => setTab(t)}>
                        {t === 'placa' ? <Car className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        {t === 'placa' ? 'Por Placa' : 'Por Nombre'}
                    </button>
                ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
                <AnimatePresence mode="wait">
                    {tab === 'placa' ? (
                        <motion.div key="placa" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(11,18,32,0.30)] pointer-events-none" />
                                <input type="text" value={placa} onChange={e => setPlaca(e.target.value)}
                                    placeholder="Ej. LAA-1362" maxLength={10}
                                    className="input-field pl-10 font-mono-code text-base tracking-widest uppercase"
                                    style={{ letterSpacing: '0.12em' }} />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="nombre" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                            className="space-y-3">
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(11,18,32,0.30)] pointer-events-none" />
                                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                                    placeholder="Nombre" className="input-field pl-10" />
                            </div>
                            <input type="text" value={apellido} onChange={e => setApellido(e.target.value)}
                                placeholder="Apellido" className="input-field" />
                        </motion.div>
                    )}
                </AnimatePresence>

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
