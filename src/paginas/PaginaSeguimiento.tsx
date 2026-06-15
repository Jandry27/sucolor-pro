import { useParams, useSearchParams, Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useSeguimientoOrden } from '@/ganchos/useSeguimientoOrden';
import { EsqueletoCarga } from '@/componentes/EsqueletoCarga';
import { EstadoError } from '@/componentes/EstadoError';
import { EncabezadoOrden } from '@/componentes/EncabezadoOrden';
import { ProgresoOrden } from '@/componentes/ProgresoOrden';
import { GaleriaMedia } from '@/componentes/GaleriaMedia';
import { PanelGastosPublico } from '@/componentes/PanelGastosPublico';
import { NotasPublicas } from '@/componentes/NotasPublicas';
import { Phone, MapPin, Clock, MessageCircle } from 'lucide-react';

export function PaginaSeguimiento() {
    const { codigo } = useParams<{ codigo: string }>();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const { data, loading, error, refetch } = useSeguimientoOrden({ codigo: codigo ?? '', token });

    if (loading) return <EsqueletoCarga />;
    if (error || !data)
        return <EstadoError message={error ?? 'No se pudo cargar la orden.'} onRetry={refetch} />;

    const { order, gastos, media } = data;

    return (
        <div className="min-h-screen mesh-gradient flex flex-col">
            {/* ── Sticky Header with Logo ──── */}
            <header className="sticky top-0 z-40 bg-[#FFFAF6]/95 backdrop-blur-xl text-white border-b-[3px] border-[#FF5100] shadow-lg shadow-black/10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link to="/" className="flex-shrink-0">
                            <img
                                src="/logo.png"
                                alt="SuColor"
                                className="h-20 sm:h-20 w-auto object-contain"
                                style={{ filter: 'drop-shadow(0 2px 8px rgba(255,81,0,0.2))' }}
                            />
                        </Link>
                        <div className="hidden sm:block pl-4 border-l border-white/15">
                            <h1 className="text-[11px] sm:text-xs font-bold tracking-[0.15em] text-[#FF5100] uppercase">
                                Portal de seguimiento
                            </h1>
                            <p className="text-[10px] text-slate-400 tracking-wide uppercase">
                                De tu reparación
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* "Calidad que se nota" badge */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                            <div className="w-5 h-5 rounded-full bg-[#FF5100] flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <span className="text-[11px] font-medium text-slate-300">
                                <strong className="text-white">Calidad</strong> que se nota.
                            </span>
                        </div>
                        <button
                            onClick={refetch}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                            title="Actualizar"
                        >
                            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Content ───── */}
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16 space-y-5 sm:space-y-6">
                {/* 1. Encabezado (Image + Info + Dates) */}
                <EncabezadoOrden order={order} media={media} />

                {/* 2. Progreso y Notas en 2 columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                    <ProgresoOrden estado={order.estado} />
                    <NotasPublicas notes={order.notas_publicas} />
                </div>

                {/* 3. Galería */}
                <GaleriaMedia media={media} />

                {/* 4. Gastos (Si aplica) */}
                <PanelGastosPublico gastos={gastos} />
            </main>

            {/* ── Premium Footer ──── */}
            <footer className="bg-[#0B1220] text-white mt-auto relative overflow-hidden">
                {/* Top orange border */}
                <div className="h-1 bg-gradient-to-r from-[#FF5100] via-[#fb923c] to-[#FF5100]"></div>

                {/* Decorative blurs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5100]/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-[100px] pointer-events-none"></div>

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
                        {/* Info */}
                        <div>
                            <img
                                src="/logo.png"
                                alt="SuColor"
                                className="h-16 w-auto object-contain mb-4"
                                style={{ filter: 'drop-shadow(0 2px 8px rgba(255,81,0,0.2))' }}
                            />
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Taller automotriz especializado en latonería, pintura profesional y restauración estética de vehículos.
                            </p>
                        </div>

                        {/* Ubicación */}
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#FF5100]" />
                                Ubicación
                            </h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Machala y Jaramijo<br />
                                Loja — Ecuador
                            </p>
                        </div>

                        {/* Horario */}
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#FF5100]" />
                                Horario de Atención
                            </h4>
                            <div className="text-sm text-slate-400 space-y-2">
                                <p>
                                    <span className="text-white font-medium">Lunes – Viernes</span><br />
                                    08:00 – 18:00
                                </p>
                                <p>
                                    <span className="text-white font-medium">Sábados</span><br />
                                    08:00 – 14:00
                                </p>
                            </div>
                        </div>

                        {/* Contacto */}
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#FF5100]" />
                                Contáctanos
                            </h4>
                            <div className="text-sm text-slate-400 space-y-3">
                                <a
                                    href="tel:+593989575378"
                                    className="flex items-center gap-2 hover:text-white transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5 text-[#FF5100]" />
                                    +593 989 575 378
                                </a>
                                <a
                                    href="https://wa.me/593960255898"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all duration-150 hover:opacity-90 hover:-translate-y-px"
                                    style={{
                                        background: '#25D366',
                                        boxShadow: '0 2px 10px rgba(37,211,102,0.25)',
                                    }}
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner inferior naranjo */}
                <div className="bg-[#FF5100] text-white py-3 px-4 text-center text-xs sm:text-sm font-medium">
                    En <strong>SuColor</strong> cuidamos cada detalle de tu vehículo como si fuera nuestro.
                </div>
                <div className="bg-[#050914] text-slate-500 py-3 text-center text-[11px]">
                    © {new Date().getFullYear()} SuColor Taller Automotriz · Todos los derechos reservados
                </div>
            </footer>
        </div>
    );
}
