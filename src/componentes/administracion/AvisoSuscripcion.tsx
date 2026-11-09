import { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    avisoVigencia,
    validarVigencia,
    VIGENCIA_MAXIMA_MS,
    type VigenciaSuColor,
} from '@/dominio/vigenciaSuColor';

const avisosMostrados = new Set<string>();

function marcarAvisoComoMostrado(clave: string): boolean {
    try {
        if (localStorage.getItem(clave) === 'mostrado') return false;
        localStorage.setItem(clave, 'mostrado');
    } catch {
        if (avisosMostrados.has(clave)) return false;
        avisosMostrados.add(clave);
    }
    return true;
}

export function AvisoSuscripcion({
    usuarioId,
    habilitado = import.meta.env.VITE_AVISOS_SIXELA !== 'false',
}: {
    usuarioId?: string;
    habilitado?: boolean;
}) {
    const [respuesta, setRespuesta] = useState<{
        usuario: string;
        vigencia: VigenciaSuColor;
    } | null>(null);
    const [abierto, setAbierto] = useState(false);
    useEffect(() => {
        setRespuesta(null);
        setAbierto(false);
        if (!habilitado || !usuarioId) return;
        let vigente = true;
        let pendiente = false;
        let estadoAvisoAnterior: string | null = null;
        let caducidad: ReturnType<typeof setTimeout> | undefined;
        let controlador: AbortController | undefined;
        async function consultar() {
            if (pendiente || !vigente) return;
            pendiente = true;
            controlador = new AbortController();
            const timeout = setTimeout(() => controlador?.abort(), 8000);
            try {
                const { data, error } = await supabase.functions.invoke('aviso-suscripcion', {
                    body: {},
                    signal: controlador.signal,
                });
                if (!vigente) return;
                clearTimeout(caducidad);
                if (error || !validarVigencia(data)) {
                    setRespuesta(null);
                    return;
                }
                setRespuesta({ usuario: usuarioId!, vigencia: data });
                const aviso = avisoVigencia(data);
                const etapaAviso = aviso
                    ? aviso.vencida
                        ? 'vencida'
                        : aviso.dias_restantes === 0
                            ? 'vence-hoy'
                            : 'proximo-vencimiento'
                    : null;
                const claveAviso = etapaAviso
                    ? `sucolor:aviso-suscripcion:${usuarioId}:${data.fecha_fin}:${etapaAviso}`
                    : null;
                if (
                    etapaAviso !== null &&
                    etapaAviso !== estadoAvisoAnterior &&
                    claveAviso !== null &&
                    marcarAvisoComoMostrado(claveAviso)
                ) {
                    setAbierto(true);
                }
                estadoAvisoAnterior = etapaAviso;
                caducidad = setTimeout(
                    () => {
                        setRespuesta(null);
                        setAbierto(false);
                    },
                    Math.max(0, VIGENCIA_MAXIMA_MS - (Date.now() - Date.parse(data.consultado_en)))
                );
            } catch {
                if (vigente) {
                    setRespuesta(null);
                    setAbierto(false);
                }
            } finally {
                clearTimeout(timeout);
                pendiente = false;
            }
        }
        const reanudar = () => {
            setRespuesta(null);
            setAbierto(false);
            void consultar();
        };
        const visibilidad = () => {
            if (document.visibilityState === 'visible') reanudar();
        };
        const desconectar = () => {
            setRespuesta(null);
            setAbierto(false);
            controlador?.abort();
        };
        void consultar();
        const intervalo = setInterval(() => void consultar(), 120_000);
        window.addEventListener('online', reanudar);
        window.addEventListener('offline', desconectar);
        document.addEventListener('visibilitychange', visibilidad);
        const { data: escucha } = supabase.auth.onAuthStateChange(() => {
            setRespuesta(null);
            setAbierto(false);
        });
        return () => {
            vigente = false;
            controlador?.abort();
            clearInterval(intervalo);
            clearTimeout(caducidad);
            window.removeEventListener('online', reanudar);
            window.removeEventListener('offline', desconectar);
            document.removeEventListener('visibilitychange', visibilidad);
            escucha.subscription.unsubscribe();
        };
    }, [usuarioId, habilitado]);
    const vigencia = respuesta && respuesta.usuario === usuarioId ? respuesta.vigencia : null;
    if (!vigencia || !habilitado) return null;
    const aviso = avisoVigencia(vigencia);
    if (!aviso) return null;
    const fechaFin = new Intl.DateTimeFormat('es-EC', {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${vigencia.fecha_fin}T00:00:00Z`));
    const cerrar = () => setAbierto(false);
    return (
        <>
            <section
                role="status"
                aria-live="polite"
                className={`mb-5 flex items-start gap-3 rounded-xl border p-4 ${aviso.vencida ? 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100' : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100'}`}
            >
                <BellRing className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{aviso.titulo}</h2>
                    <p className="mt-1 text-sm leading-relaxed">
                        {aviso.mensaje}
                    </p>
                    <button
                        type="button"
                        className="mt-2 text-sm font-semibold underline underline-offset-2"
                        onClick={() => setAbierto(true)}
                    >
                        Ver detalles
                    </button>
                </div>
            </section>
            {abierto && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) cerrar();
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sucolor-suscripcion-titulo"
                        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
                    >
                        <div
                            className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${aviso.vencida ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}
                        >
                            <BellRing aria-hidden="true" />
                        </div>
                        <button
                            type="button"
                            aria-label="Cerrar aviso de suscripción"
                            onClick={cerrar}
                            className="absolute right-5 top-5 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X size={20} />
                        </button>
                        <h2
                            id="sucolor-suscripcion-titulo"
                            className="text-xl font-semibold text-slate-950 dark:text-white"
                        >
                            {aviso.titulo}
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {aviso.mensaje}
                        </p>
                        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <strong>Fecha de vencimiento:</strong> {fechaFin}
                        </p>
                        <button
                            type="button"
                            autoFocus
                            onClick={cerrar}
                            className="mt-6 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700"
                        >
                            Entendido
                        </button>
                    </section>
                </div>
            )}
        </>
    );
}
