import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, Phone, Search } from 'lucide-react';

import { useBusquedaOrden } from '@/ganchos/useBusquedaOrden';

export function FormularioBusqueda() {
    const navigate = useNavigate();
    const [placa, setPlaca] = useState('');
    const [verificador, setVerificador] = useState('');

    const { loading, error, search } = useBusquedaOrden();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const placaLimpia = placa.trim().toUpperCase();
        const verificadorLimpio = verificador.replace(/\D/g, '').slice(0, 4);

        if (!placaLimpia || verificadorLimpio.length !== 4) {
            return;
        }

        const result = await search({
            placa: placaLimpia,
            verificador: verificadorLimpio,
        });

        if (result?.ok && result.codigo && result.token) {
            navigate(`/track/${result.codigo}?token=${result.token}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)_auto]">
                <div className="relative min-w-0">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />

                    <input
                        type="text"
                        value={placa}
                        onChange={event => setPlaca(event.target.value)}
                        maxLength={10}
                        autoComplete="off"
                        placeholder="Ej. LAA-1362"
                        aria-label="Placa del vehículo"
                        className="
                            h-12 w-full rounded-md border border-black/[0.10] bg-white
                            pl-11 pr-4 font-mono text-base font-medium uppercase
                            tracking-normal text-[#111111] outline-none transition-all
                            duration-300 placeholder:font-sans placeholder:font-medium
                            placeholder:normal-case placeholder:tracking-normal
                            placeholder:text-neutral-400 focus:border-[#F97316]
                            focus:ring-2 focus:ring-[#F97316]/10
                        "
                    />
                </div>

                <div className="relative min-w-0">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />

                    <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{4}"
                        value={verificador}
                        onChange={event =>
                            setVerificador(event.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        maxLength={4}
                        autoComplete="off"
                        placeholder="Últimos 4 del teléfono"
                        aria-label="Últimos 4 dígitos del teléfono registrado"
                        className="
                            h-12 w-full rounded-md border border-black/[0.10] bg-white
                            pl-11 pr-4 font-mono text-base font-medium tracking-[0.12em]
                            text-[#111111] outline-none transition-all duration-300
                            placeholder:font-sans placeholder:text-sm placeholder:font-medium
                            placeholder:normal-case placeholder:tracking-normal
                            placeholder:text-neutral-400 focus:border-[#F97316]
                            focus:ring-2 focus:ring-[#F97316]/10
                        "
                    />
                </div>

                <motion.button
                    type="submit"
                    disabled={loading || !placa.trim() || verificador.length !== 4}
                    whileTap={{ scale: 0.98 }}
                    className="
                        flex h-12 min-w-[155px] items-center justify-center gap-3
                        rounded-md bg-[#C94E0C] px-6 text-sm font-medium
                        tracking-normal text-white transition-colors duration-300
                        hover:bg-[#111111] disabled:cursor-not-allowed
                        disabled:opacity-60
                    "
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Buscando
                        </>
                    ) : (
                        <>
                            Consultar
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </motion.button>
            </div>

            <p className="mt-2 text-[11px] leading-5 text-black/45">
                Por seguridad, ingresa los últimos 4 dígitos del teléfono registrado en el taller.
            </p>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -5, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div
                            role="alert"
                            className="mt-3 flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600"
                        >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
}
