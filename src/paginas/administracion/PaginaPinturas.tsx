import { useRef, useState } from 'react';
import { FlaskConical, Package, Palette } from 'lucide-react';
import { DisenoAdministracion } from '@/componentes/administracion/DisenoAdministracion';
import { ControlPinturas } from '@/componentes/administracion/pinturas/ControlPinturas';
import { InventarioPinturas } from '@/componentes/administracion/pinturas/InventarioPinturas';
import '@/componentes/administracion/pinturas/pinturas.css';

const SECCIONES = [
    { id: 'solicitudes', titulo: 'Pedidos y muestras', icono: Package },
    { id: 'inventario', titulo: 'Pinturas sobrantes', icono: FlaskConical },
];

export function PaginaPinturas() {
    const [seccion, setSeccion] = useState('solicitudes');
    const pestanas = useRef<Array<HTMLButtonElement | null>>([]);
    return (
        <DisenoAdministracion className="admin-pinturas">
            <div className="pinturas-modulo relative isolate max-w-6xl mx-auto text-slate-800 dark:text-slate-100">
                <svg
                    className="pinturas-trazos"
                    viewBox="0 0 1200 1400"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path d="M850 -100C350 100 1200 200 1100 500S150 800 350 1100S1250 1300 1000 1550" />
                    <path d="M910 -100C410 100 1260 200 1160 500S210 800 410 1100S1310 1300 1060 1550" />
                    <path d="M970 -100C470 100 1320 200 1220 500S270 800 470 1100S1370 1300 1120 1550" />
                </svg>
                <header className="pinturas-portada relative mb-6 grid items-center gap-6 overflow-hidden rounded-[28px] border border-orange-200/60 p-5 sm:p-7 md:grid-cols-[0.85fr_1.15fr] lg:gap-8">
                    <div className="min-w-0 py-1 lg:py-3">
                        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-orange-800 dark:bg-slate-900/80 dark:text-orange-300">
                            <Palette size={14} /> Gestión de Pinturas del Taller
                        </span>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[42px] lg:leading-[1.08]">
                            Cada color,
                            <br />
                            en su lugar.
                        </h1>
                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            Controla tus pedidos, recupera las muestras y encuentra las pinturas
                            disponibles en el taller.
                        </p>
                    </div>
                    <div className="pinturas-ilustracion overflow-hidden rounded-[20px] border border-orange-200/60">
                        <img
                            src="/8.png"
                            alt="Preparación y mezcla de pintura en el taller SuColor"
                            width={1448}
                            height={1086}
                            decoding="async"
                            className="block h-auto w-full"
                        />
                    </div>
                </header>
                <section
                    className="pinturas-superficie p-4 sm:p-6"
                    aria-label="Control e inventario de pinturas"
                >
                    <div
                        role="tablist"
                        aria-label="Secciones de pinturas"
                        className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200/70 bg-white/80 p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:inline-flex"
                    >
                        {SECCIONES.map(({ id, titulo, icono: Icono }, indice) => (
                            <button
                                key={id}
                                id={`pestana-${id}`}
                                ref={elemento => {
                                    pestanas.current[indice] = elemento;
                                }}
                                role="tab"
                                aria-selected={seccion === id}
                                tabIndex={seccion === id ? 0 : -1}
                                aria-controls="contenido-pinturas"
                                onClick={() => setSeccion(id)}
                                onKeyDown={evento => {
                                    if (
                                        !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                                            evento.key
                                        )
                                    )
                                        return;
                                    evento.preventDefault();
                                    const siguiente =
                                        evento.key === 'Home'
                                            ? 0
                                            : evento.key === 'End'
                                                ? SECCIONES.length - 1
                                                : (indice +
                                                    (evento.key === 'ArrowRight' ? 1 : -1) +
                                                    SECCIONES.length) %
                                                SECCIONES.length;
                                    setSeccion(SECCIONES[siguiente].id);
                                    pestanas.current[siguiente]?.focus();
                                }}
                                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold transition-colors sm:px-5 sm:text-sm ${seccion === id ? 'bg-[#111111] text-white shadow-sm dark:bg-orange-500' : 'text-slate-500 hover:bg-orange-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                            >
                                <Icono size={16} className="hidden shrink-0 sm:block" />
                                {titulo}
                            </button>
                        ))}
                    </div>
                    <div
                        id="contenido-pinturas"
                        role="tabpanel"
                        aria-labelledby={`pestana-${seccion}`}
                        tabIndex={0}
                        className="pinturas-panel"
                    >
                        {seccion === 'solicitudes' ? <ControlPinturas /> : <InventarioPinturas />}
                    </div>
                </section>
            </div>
        </DisenoAdministracion>
    );
}
