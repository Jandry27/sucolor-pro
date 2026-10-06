import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';

import {
    ArrowRight,
    Car,
    ChevronRight,
    Clock,
    Eye,
    MapPin,
    MessageCircle,
    Phone,
    Search,
    Sparkles,
    Wrench,
} from 'lucide-react';

import { FormularioBusqueda } from '@/componentes/FormularioBusqueda';
import { registrarEventoAnalytics } from '@/biblioteca/googleAnalytics';

const WHATSAPP = '593989575378';

const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({
    children,
    className = '',
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);

    const visible = useInView(ref, {
        once: true,
        margin: '-80px 0px',
    });

    return (
        <motion.div
            ref={ref}
            initial={{
                opacity: 0,
                y: 30,
            }}
            animate={
                visible
                    ? {
                        opacity: 1,
                        y: 0,
                    }
                    : {}
            }
            transition={{
                duration: 0.75,
                delay,
                ease: EASE,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

const SERVICIOS = [
    {
        numero: '01',
        titulo: 'Pintura automotriz',
        descripcion:
            'Preparación, igualación de color y acabados profesionales para recuperar la apariencia del vehículo.',
        icono: Sparkles,
    },
    {
        numero: '02',
        titulo: 'Latonería y enderezado',
        descripcion:
            'Corrección de golpes y deformaciones con atención precisa sobre la carrocería.',
        icono: Wrench,
    },
    {
        numero: '03',
        titulo: 'Restauración estética',
        descripcion:
            'Recuperación de piezas y detalles para devolver al vehículo una presentación cuidada.',
        icono: Car,
    },
    {
        numero: '04',
        titulo: 'Pulido y acabados',
        descripcion:
            'Terminación final, brillo y revisión de detalles antes de la entrega.',
        icono: Eye,
    },
];


function irASeccion(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const destino = event.currentTarget.getAttribute('href')?.slice(1);
    if (destino) document.getElementById(destino)?.scrollIntoView({ behavior: 'smooth' });
}

export function PaginaInicio() {
    const [headerDesplazado, setHeaderDesplazado] = useState(false);

    useEffect(() => {
        const actualizarHeader = () => setHeaderDesplazado(window.scrollY > 16);
        actualizarHeader();
        window.addEventListener('scroll', actualizarHeader, { passive: true });
        return () => window.removeEventListener('scroll', actualizarHeader);
    }, []);

    return (
        <div className="relative overflow-hidden bg-[#FAFAF9] text-[#111111]">
            {/* =========================================================
                NAV
            ========================================================= */}
            <header className="fixed inset-x-0 top-0 z-50">
                <div className="mx-auto mt-3 max-w-[1440px] px-4 sm:px-6 lg:px-10">
                    <nav
                        aria-label="Navegación principal"
                        className={`flex h-[72px] items-center justify-between rounded-[24px] border px-4 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 motion-reduce:transition-none sm:px-6 ${headerDesplazado
                            ? 'border-white/70 bg-white/95 supports-[backdrop-filter:blur(1px)]:bg-white/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
                            : 'border-black/[0.08] bg-white shadow-none'
                            }`}
                    >
                        <Link
                            to="/"
                            className="flex items-center gap-3"
                            aria-label="SuColor"
                        >
                            <img
                                src="/loja.PNG"
                                width="256"
                                height="256"
                                alt="SuColor"
                                decoding="async"
                                className="h-[48px] w-auto object-contain"
                            />

                            <span className="text-xs font-medium text-neutral-600 sm:text-sm">
                                Automotriz
                            </span>
                        </Link>

                        <div className="hidden items-center gap-8 lg:flex">
                            <a
                                href="#servicios" onClick={irASeccion}
                                className="text-[13px] font-semibold text-black/55 transition-colors hover:text-black"
                            >
                                Servicios
                            </a>

                            <a
                                href="#seguimiento" onClick={irASeccion}
                                className="text-[13px] font-semibold text-black/55 transition-colors hover:text-black"
                            >
                                Consulta tu vehículo
                            </a>

                            <a
                                href="#empresa" onClick={irASeccion}
                                className="text-[13px] font-semibold text-black/55 transition-colors hover:text-black"
                            >
                                Nosotros
                            </a>

                            <a
                                href="#contacto" onClick={irASeccion}
                                className="text-[13px] font-semibold text-black/55 transition-colors hover:text-black"
                            >
                                Contacto
                            </a>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                to="/administracion/login"
                                className="hidden rounded-md px-4 py-2.5 text-xs font-bold text-black/55 transition-colors hover:bg-black/[0.04] hover:text-black sm:block"
                            >
                                Panel Admin
                            </Link>

                            <a
                                aria-label="Contactar por WhatsApp"
                                href={`https://wa.me/${WHATSAPP}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() =>
                                    registrarEventoAnalytics('whatsapp_click', { ubicacion: 'header' })
                                }
                                className="inline-flex items-center gap-2 rounded-md bg-[#111111] px-4 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F97316]"
                            >
                                <MessageCircle className="h-4 w-4" />

                                <span className="hidden sm:inline">
                                    WhatsApp
                                </span>
                            </a>
                        </div>
                    </nav>
                </div>
            </header>

            {/* =========================================================
                HERO
            ========================================================= */}
            <section
                id="inicio"
                className="relative pt-[104px]"
            >
                <div className="relative isolate mx-auto min-h-[640px] max-w-[1600px] overflow-hidden bg-[#FFF4E3]">
                    <img
                        src="/taller.png"
                        alt=""
                        aria-hidden="true"
                        fetchPriority="high"
                        decoding="async"
                        className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center] lg:object-[right_bottom]"
                    />
                    {/* El degradado conserva el contraste sin ocultar el automóvil. */}
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,248,237,0.98)_0%,rgba(255,248,237,0.94)_30%,rgba(255,248,237,0.65)_48%,rgba(255,248,237,0.05)_72%)] max-lg:bg-[linear-gradient(180deg,rgba(255,248,237,0.96)_0%,rgba(255,248,237,0.9)_55%,rgba(255,248,237,0.3)_100%)]" />
                    {/* TEXTO */}
                    <div className="relative flex min-h-[640px] items-center px-5 py-12 pb-32 sm:px-10 sm:py-16 lg:px-14 xl:px-20">
                        <div className="w-full max-w-[520px]">
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 15,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.6,
                                    ease: EASE,
                                }}
                                className="mb-7 flex items-center gap-3"
                            >
                                <span className="h-[2px] w-9 bg-[#F97316]" />

                                <span className="text-[10px] font-semibold uppercase tracking-normal text-black/50">
                                    Taller automotriz · Loja
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{
                                    opacity: 0,
                                    y: 30,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.8,
                                    delay: 0.08,
                                    ease: EASE,
                                }}
                                className="text-[48px] font-semibold leading-[1.04] tracking-normal text-[#111111] sm:text-[56px]"
                            >
                                Precisión
                                <br />
                                en cada
                                <br />

                                <span className="text-[#F97316]">
                                    detalle.
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{
                                    opacity: 0,
                                    y: 20,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.7,
                                    delay: 0.2,
                                    ease: EASE,
                                }}
                                className="mt-7 max-w-[490px] text-[15px] leading-7 text-black/[0.60] sm:text-[17px]"
                            >
                                Taller automotriz en Loja especializado en pintura, latonería,
                                enderezado y restauración de carrocerías, desde la preparación
                                de cada pieza hasta el acabado final.
                            </motion.p>

                            {/* FORMULARIO PRINCIPAL */}
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 25,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.8,
                                    delay: 0.3,
                                    ease: EASE,
                                }}
                                id="seguimiento"
                                className="mt-8 scroll-mt-28 rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_40px_-16px_rgba(100,55,20,0.28)] backdrop-blur-md sm:p-6"
                            >
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[13px] font-semibold">
                                            Consulta el estado de tu vehículo
                                        </p>

                                        <p className="mt-1 text-xs text-black/60">
                                            Consulta el avance de tu vehículo ingresando únicamente la placa.
                                        </p>
                                    </div>

                                    <Search className="h-4 w-4 text-[#F97316]" />
                                </div>

                                <FormularioBusqueda />


                            </motion.div>
                        </div>
                    </div>

                </div>
            </section>

            {/* =========================================================
                SERVICIOS - EDITORIAL
            ========================================================= */}
            <section
                id="servicios"
                className="scroll-mt-28 relative bg-[#FAFAF9] py-16 sm:py-20"
            >
                <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-12">
                    <Reveal className="mb-16 grid gap-7 lg:grid-cols-2">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="h-[2px] w-8 bg-[#F97316]" />

                                <span className="text-[10px] font-semibold uppercase tracking-normal text-black/40">
                                    Servicios automotrices en Loja
                                </span>
                            </div>

                            <h2 className="mt-6 text-4xl font-semibold tracking-normal sm:text-4xl">
                                Cuidado profesional
                                <br />
                                para tu vehículo.
                            </h2>
                        </div>

                        <div className="flex items-end">
                            <p className="max-w-[470px] text-[15px] leading-7 text-black/[0.60]">
                                En SuColor atendemos vehículos en Loja con servicios de pintura
                                automotriz, latonería, enderezado, restauración estética y acabados.
                                Cada trabajo se revisa por etapas hasta la entrega final.
                            </p>
                        </div>
                    </Reveal>

                    <div className="border-t border-black/[0.10]">
                        {SERVICIOS.map((servicio, index) => {
                            const Icono = servicio.icono;

                            return (
                                <Reveal
                                    key={servicio.numero}
                                    delay={index * 0.04}
                                >
                                    <motion.div
                                        whileHover={{
                                            x: 5,
                                        }}
                                        className="group grid cursor-default gap-5 border-b border-black/[0.10] py-7 sm:grid-cols-[70px_1fr_1fr_40px] sm:items-center sm:py-9"
                                    >
                                        <span className="text-xs font-semibold text-[#F97316]">
                                            {servicio.numero}
                                        </span>

                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-black/10 transition-all duration-300 group-hover:border-[#F97316] group-hover:bg-[#F97316]">
                                                <Icono className="h-4 w-4 transition-colors duration-300 group-hover:text-white" />
                                            </div>

                                            <h3 className="text-xl font-semibold tracking-normal sm:text-2xl">
                                                {servicio.titulo}
                                            </h3>
                                        </div>

                                        <p className="max-w-[410px] text-sm leading-6 text-black/[0.60]">
                                            {servicio.descripcion}
                                        </p>

                                        <ChevronRight className="hidden h-5 w-5 text-black/20 transition-all group-hover:translate-x-1 group-hover:text-[#F97316] sm:block" />
                                    </motion.div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* =========================================================
                IMAGEN EDITORIAL
            ========================================================= */}
            <section
                id="empresa"
                className="scroll-mt-28 relative h-[70vh] min-h-[560px] overflow-hidden bg-[#171717]"
            >
                <img
                    src="/montañas.png"
                    alt="Ilustración de una carretera de montaña"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover object-[center_14%] opacity-75"
                    onError={event => {
                        event.currentTarget.style.display = 'none';
                    }}
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/5" />

                <div className="relative z-10 mx-auto flex h-full max-w-[1280px] items-end px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12">
                    <Reveal>
                        <p className="text-[10px] font-semibold uppercase tracking-normal text-[#F97316]">
                            Nuestra forma de trabajar
                        </p>

                        <h2 className="mt-5 max-w-[700px] text-4xl font-semibold leading-[0.98] tracking-normal text-white sm:text-4xl">
                            El detalle
                            <br />
                            marca la diferencia.
                        </h2>

                        <p className="mt-6 max-w-[500px] text-sm leading-7 text-white/60 sm:text-base">
                            Revisamos cada etapa del trabajo para obtener
                            un resultado cuidado, limpio y profesional.
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* =========================================================
                CONTACTO
            ========================================================= */}
            <section
                id="contacto"
                className="scroll-mt-28 relative overflow-hidden bg-[#F97316] py-24 text-white sm:py-28"
            >

                <div className="relative z-10 mx-auto grid max-w-[1280px] items-end gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:px-12">
                    <Reveal>
                        <p className="text-[10px] font-semibold uppercase tracking-normal text-white/60">
                            Hablemos
                        </p>

                        <h2 className="mt-5 max-w-[760px] text-4xl font-semibold leading-[0.95] tracking-normal sm:text-4xl">
                            Cuéntanos qué necesita
                            <br />
                            tu vehículo.
                        </h2>
                    </Reveal>

                    <Reveal
                        delay={0.1}
                        className="flex flex-col gap-3 sm:flex-row lg:flex-col"
                    >
                        <a
                            href={`https://wa.me/${WHATSAPP}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                                registrarEventoAnalytics('whatsapp_click', { ubicacion: 'contacto' })
                            }
                            className="inline-flex min-w-[220px] items-center justify-between rounded-md bg-[#111111] px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-1"
                        >
                            WhatsApp
                            <MessageCircle className="h-4 w-4" />
                        </a>

                        <a
                            href={`tel:+${WHATSAPP}`}
                            onClick={() =>
                                registrarEventoAnalytics('telefono_click', { ubicacion: 'contacto' })
                            }
                            className="inline-flex min-w-[220px] items-center justify-between rounded-md border border-white/40 px-6 py-4 text-sm font-semibold transition-colors hover:bg-white hover:text-[#F97316]"
                        >
                            Llamar
                            <Phone className="h-4 w-4" />
                        </a>
                    </Reveal>
                </div>
            </section>

            {/* =========================================================
                FOOTER
            ========================================================= */}
            <footer className="bg-[#111111] text-white">
                <div className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:px-12">
                    <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-3">
                        <div>
                            <img
                                src="/loja.PNG"
                                width="256"
                                height="256"
                                alt="SuColor"
                                loading="lazy"
                                decoding="async"
                                className="h-14 w-auto"
                            />

                            <p className="mt-4 max-w-[300px] text-sm leading-6 text-white/40">
                                Pintura automotriz, latonería y
                                restauración estética de vehículos.
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-normal text-white/30">
                                Ubicación
                            </p>

                            <div className="mt-5 flex gap-3">
                                <MapPin className="mt-0.5 h-4 w-4 text-[#F97316]" />

                                <p className="text-sm leading-6 text-white/55">
                                    Machala y Jaramijo
                                    <br />
                                    Loja, Ecuador
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-normal text-white/30">
                                Horario
                            </p>

                            <div className="mt-5 flex gap-3">
                                <Clock className="mt-0.5 h-4 w-4 text-[#F97316]" />

                                <p className="text-sm leading-6 text-white/55">
                                    Lunes – Viernes · 08:00 – 18:00
                                    <br />
                                    Sábados · 08:00 – 14:00
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between gap-3 pt-7 text-[10px] font-semibold uppercase tracking-normal text-white/25 sm:flex-row">
                        <p>
                            © {new Date().getFullYear()} SuColor Taller
                            Automotriz
                        </p>

                        <Link
                            to="/administracion/login"
                            className="transition-colors hover:text-[#F97316]"
                        >
                            Panel administrativo
                        </Link>
                    </div>
                </div>
            </footer>

            {/* WHATSAPP FLOTANTE */}
            <motion.a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar por WhatsApp"
                onClick={() =>
                    registrarEventoAnalytics('whatsapp_click', { ubicacion: 'flotante' })
                }
                initial={{
                    opacity: 0,
                    scale: 0.5,
                }}
                animate={{
                    opacity: 1,
                    scale: 1,
                }}
                transition={{
                    delay: 1,
                    type: 'spring',
                }}
                whileHover={{
                    scale: 1.08,
                }}
                whileTap={{
                    scale: 0.94,
                }}
                className="fixed bottom-5 right-5 z-50 flex h-[54px] w-[54px] items-center justify-center rounded-md bg-[#25D366] text-white shadow-[0_12px_35px_rgba(37,211,102,.35)]"
            >
                <MessageCircle className="h-6 w-6" />
            </motion.a>
        </div>
    );
}
