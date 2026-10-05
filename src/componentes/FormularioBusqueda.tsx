import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import {
    AlertCircle,
    ArrowRight,
    Loader2,
    Search,
} from 'lucide-react';

import { useBusquedaOrden } from '@/ganchos/useBusquedaOrden';

export function FormularioBusqueda() {
    const navigate = useNavigate();

    const [placa, setPlaca] = useState('');

    const {
        loading,
        error,
        search,
    } = useBusquedaOrden();

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const placaLimpia = placa
            .trim()
            .toUpperCase();

        if (!placaLimpia) {
            return;
        }

        const result = await search({
            placa: placaLimpia,
        });

        if (
            result?.ok &&
            result.codigo &&
            result.token
        ) {
            navigate(
                `/track/${result.codigo}?token=${result.token}`
            );
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full"
        >
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />

                    <input
                        type="text"
                        value={placa}
                        onChange={event =>
                            setPlaca(
                                event.target.value
                            )
                        }
                        maxLength={10}
                        autoComplete="off"
                        placeholder="Ej. LAA-1362"
                        aria-label="Placa del vehículo"
                        className="
                            h-12
                            w-full
                            border
                            border-black/[0.10]
                            bg-white
                            pl-11
                            pr-4
                            font-mono
                            text-base
                            font-medium
                            uppercase
                            tracking-normal
                            text-[#111111]
                            outline-none
                            transition-all
                            duration-300
                            placeholder:font-sans
                            placeholder:font-medium
                            placeholder:normal-case
                            placeholder:tracking-normal
                            placeholder:text-neutral-400
                            focus:border-[#F97316]
                            focus:ring-2
                            focus:ring-[#F97316]/10
                            rounded-md
                        "
                    />
                </div>

                <motion.button
                    type="submit"
                    disabled={
                        loading ||
                        !placa.trim()
                    }
                    whileTap={{
                        scale: 0.98,
                    }}
                    className="
                        flex
                        h-12
                        min-w-[155px]
                        items-center
                        justify-center
                        gap-3
                        bg-[#C94E0C]
                        px-6
                        text-sm
                        font-medium
                        tracking-normal
                        text-white
                        transition-colors
                        duration-300
                        hover:bg-[#111111]
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                        rounded-md
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

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: -5,
                            height: 0,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            height: 'auto',
                        }}
                        exit={{
                            opacity: 0,
                            y: -5,
                            height: 0,
                        }}
                        className="overflow-hidden"
                    >
                        <div role="alert" className="mt-3 flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
}
