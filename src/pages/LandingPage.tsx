import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Shield, Clock, Eye, CheckCircle, CheckCircle2, Zap, MessageCircle, MapPin, Star, Phone, ArrowRight } from 'lucide-react';
import { SearchForm } from '@/components/SearchForm';

function FadeIn({ children, delay = 0, className = '' }: {
    children: React.ReactNode; delay?: number; className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '0px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay, ease: 'easeOut' }}
            className={className}>
            {children}
        </motion.div>
    );
}

const STEPS = [
    { num: '01', icon: <Search className="w-5 h-5 text-white" />, title: 'Busca tu vehículo', desc: 'Ingresa la placa o tu nombre en el buscador de la página principal.' },
    { num: '02', icon: <Zap className="w-5 h-5 text-white" />, title: 'Acceso instantáneo', desc: 'El sistema te lleva directamente al portal de seguimiento de tu orden.' },
    { num: '03', icon: <Eye className="w-5 h-5 text-white" />, title: 'Sigue el progreso', desc: 'Ve fotos, el timeline de trabajo y el estado actualizado de tu vehículo.' },
];

const BENEFITS = [
    'Fotos del proceso de reparación',
    'Timeline detallado de actividades',
    'Notificación cuando tu vehículo esté listo',
    'Notas técnicas comprensibles',
    'Acceso 24/7 sin necesidad de cuenta',
    'Enlace único y seguro por orden',
];

const STATS = [
    { value: '500+', label: 'Vehículos reparados' },
    { value: '98%', label: 'Satisfacción cliente' },
    { value: '15+', label: 'Años de experiencia' },
    { value: '24h', label: 'Tiempo de respuesta' },
];

export function LandingPage() {
    return (
        <div className="min-h-screen bg-transparent relative">
            {/* ── PROFESSIONAL HERO BACKGROUND ──────────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#FAFAFA] dark:bg-[#0B1220]">
                {/* Subtle technical grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                
                {/* Soft glowing accents matching brand color */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#F97316]/10 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#F97316]/10 blur-[120px]"></div>
                <div className="absolute top-[20%] right-[15%] w-[30%] h-[30%] rounded-full bg-[#0F172A]/5 blur-[100px]"></div>
                
                {/* Overlay gradient to fade the grid smoothly */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white dark:via-[#0B1220]/40 dark:to-[#0B1220]"></div>
            </div>
            {/* ── NAV ─────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-white/20 dark:border-slate-800/50"
                style={{ boxShadow: '0 8px 32px 0 rgba(31,38,135,0.07)' }}>
                <div className="max-w-5xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
                    {/* Marca — logo + texto */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logo.png" alt="SuColor"
                            className="h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                            style={{ maxHeight: '64px', filter: 'drop-shadow(0 2px 8px rgba(255,81,0,0.15))' }} />
                        <div className="hidden sm:flex flex-col leading-tight">
                            <span className="text-lg font-extrabold tracking-tight text-[#0F172A]">
                                Su<span className="text-[#F97316]">Color</span>
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(15,23,42,0.38)]">
                                Taller Automotriz
                            </span>
                        </div>
                    </Link>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">

                        <Link to="/admin/login"
                            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[rgba(15,23,42,0.55)] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-150">
                            Panel Admin <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <a href="https://wa.me/593989575378" target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-px"
                            style={{ background: '#25D366', boxShadow: '0 3px 12px rgba(37,211,102,0.30)' }}>
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                    </div>
                </div>
            </nav>

            {/* ── HERO ─────────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 pb-24 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-8 rounded-full text-xs font-semibold uppercase tracking-widest bg-white/50 backdrop-blur-sm border border-[#F97316]/20 text-[#F97316] shadow-[0_4px_14px_0_rgba(249,115,22,0.15)]">
                        <Zap className="w-3 h-3" /> Taller automotriz profesional
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0F172A] mb-5 leading-[1.08] tracking-tight">
                        Tu vehículo en{' '}
                        <span className="text-gradient-orange">manos expertas</span>
                    </h1>

                    <p className="text-[rgba(11,18,32,0.55)] text-lg max-w-xl mx-auto mb-12 leading-relaxed">
                        Sigue el estado de tu reparación en tiempo real.<br className="hidden sm:block" />
                        Transparencia total, sin llamadas, sin incertidumbre.
                    </p>
                </motion.div>

                {/* Search card */}
                <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.12 }}
                    className="max-w-md mx-auto glass-card relative z-10"
                    style={{ padding: '28px' }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-[#F97316]/10 border border-[#F97316]/20">
                            <Search className="w-4 h-4 text-[#F97316]" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-sm text-[#0F172A]">Consulta tu vehículo</p>
                            <p className="text-xs text-[rgba(15,23,42,0.45)]">Busca por placa o nombre del titular</p>
                        </div>
                    </div>
                    <SearchForm />
                </motion.div>

                {/* Trust indicators */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-[rgba(15,23,42,0.50)] relative z-10">
                    {[
                        { icon: <Shield className="w-3.5 h-3.5" />, label: 'Acceso seguro' },
                        { icon: <Clock className="w-3.5 h-3.5" />, label: 'Tiempo real' },
                        { icon: <Eye className="w-3.5 h-3.5" />, label: 'Sin registro requerido' },
                    ].map(b => (
                        <div key={b.label} className="flex items-center gap-1.5 text-[#F97316] bg-white/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                            {b.icon}
                            <span className="text-[rgba(15,23,42,0.60)] font-medium">{b.label}</span>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────── */}
            <section className="bg-transparent border-y border-white/20 relative z-10 pb-8">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20 pb-0">
                    <FadeIn className="text-center mb-12">
                        <p className="section-title mb-2 text-[#F97316] font-semibold tracking-widest text-xs uppercase">Cómo funciona</p>
                        <h2 className="text-3xl font-bold text-[#0F172A]">Tres pasos. Sin complicaciones.</h2>
                    </FadeIn>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {STEPS.map((s, i) => (
                            <FadeIn key={s.num} delay={i * 0.08}>
                                <div className="glass-card relative border border-white/30" style={{ padding: '24px' }}>
                                    <span className="absolute top-5 right-5 font-mono-code text-3xl font-bold text-[rgba(15,23,42,0.05)]">{s.num}</span>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br from-[#F97316] to-[#EA6C0A] shadow-[0_4px_14px_0_rgba(249,115,22,0.39)]">
                                        {s.icon}
                                    </div>
                                    <h3 className="font-semibold text-[#0F172A] mb-1.5">{s.title}</h3>
                                    <p className="text-sm text-[rgba(15,23,42,0.55)] leading-relaxed">{s.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BENEFITS ─────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20 relative z-10 pt-8">
                <div className="grid sm:grid-cols-2 gap-12 items-center">
                    <FadeIn>
                        <p className="section-title mb-3 text-[#F97316] font-semibold tracking-widest text-xs uppercase">Ventajas</p>
                        <h2 className="text-3xl font-bold text-[#0F172A] mb-4">
                            Sigue el progreso paso a paso
                        </h2>
                        <p className="text-[rgba(11,18,32,0.55)] leading-relaxed">
                            Nuestro portal de seguimiento pone en tus manos la información del estado de tu vehículo, sin llamadas ni esperas.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1} className="space-y-2.5">
                        {BENEFITS.map(item => (
                            <div key={item} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[rgba(15,23,42,0.07)]">
                                <CheckCircle2 className="w-5 h-5 text-[#F97316] flex-shrink-0" />
                                <span className="text-[#0F172A] font-medium">{item}</span>
                            </div>
                        ))}
                    </FadeIn>
                </div>
            </section>

            {/* ── STATS ────────────────────────────────────────────── */}
            <section className="bg-transparent relative z-10">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {STATS.map((s, i) => (
                            <FadeIn key={s.value} delay={i * 0.07}>
                                <div className="glass-card text-center">
                                    <p className="text-3xl font-extrabold text-gradient-orange mb-1">{s.value}</p>
                                    <p className="text-sm font-medium text-[rgba(15,23,42,0.60)] mt-1">{s.label}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CONTACT ──────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20 relative z-10">
                <FadeIn>
                    <div className="glass-card text-center max-w-2xl mx-auto p-12 md:p-16 border border-white/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 z-0 pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 bg-[#F97316]/10 border border-[#F97316]/20">
                                <Star className="w-5 h-5 text-[#F97316]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#0F172A] mb-3">¿Necesitas traer tu vehículo?</h2>
                            <p className="text-[rgba(11,18,32,0.55)] mb-8 leading-relaxed">
                                Contáctanos y agenda tu cita. Nuestro equipo está listo para atenderte con la calidad que mereces.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <a href="https://wa.me/593960255898" target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] font-semibold text-white text-sm transition-all duration-150 hover:-translate-y-0.5"
                                    style={{ background: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.25)' }}>
                                    <MessageCircle className="w-4 h-4" /> WhatsApp
                                </a>
                                <a href="tel:+593989575378"
                                    className="btn-secondary inline-flex items-center justify-center gap-2 text-sm px-6 py-3">
                                    <Phone className="w-4 h-4" /> Llamar
                                </a>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-[rgba(15,23,42,0.40)]">
                                <MapPin className="w-3 h-3 text-[#F97316]" />
                                Taller SuColor
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </section>

            {/* ── FOOTER PREMIUM ───────────────────────────────────── */}
            <footer className="relative z-10 bg-white border-t border-[rgba(15,23,42,0.07)]">
                <FadeIn>
                    <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-16 pb-10">

                        {/* Grid de 4 columnas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-14">

                            {/* ── Col 1: Marca ── */}
                            <div className="lg:col-span-1 space-y-4">
                                <img src="/logo.png" alt="SuColor" className="h-14 w-auto object-contain" />
                                <p className="text-sm text-[rgba(11,18,32,0.50)] leading-relaxed max-w-[220px]">
                                    Taller automotriz especializado en latonería, pintura profesional y restauración estética de vehículos.
                                </p>
                                <div className="flex items-start gap-2 text-sm text-[rgba(11,18,32,0.45)]">
                                    <MapPin className="w-3.5 h-3.5 text-[#FF5100] mt-0.5 flex-shrink-0" />
                                    <span>Machala y Jaramijo<br />Loja — Ecuador</span>
                                </div>
                                {/* CTA Consultar estado */}
                                <Link to="/"
                                    className="btn-primary w-full sm:w-auto mt-8 px-8 py-3.5 text-base">
                                    <Search className="w-3.5 h-3.5" />
                                    Consultar estado de vehículo
                                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>

                            {/* ── Col 2: Servicios ── */}
                            <div className="space-y-5">
                                <p className="text-xs font-bold text-[#0B1220] uppercase tracking-widest">Servicios</p>
                                <ul className="space-y-3">
                                    {[
                                        'Latonería automotriz',
                                        'Pintura profesional',
                                        'Pulido y detailing',
                                        'Restauración estética',
                                    ].map(s => (
                                        <li key={s}>
                                            <span className="text-sm text-[rgba(11,18,32,0.50)] hover:text-[#0B1220] transition-colors duration-150 cursor-default">
                                                {s}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* ── Col 3: Contacto ── */}
                            <div className="space-y-5">
                                <p className="text-xs font-bold text-[#0B1220] uppercase tracking-widest">Contacto</p>
                                <ul className="space-y-3">
                                    <li>
                                        <a href="tel:+593989575378"
                                            className="flex items-center gap-2 text-sm text-[rgba(11,18,32,0.50)] hover:text-[#0B1220] transition-colors duration-150 group">
                                            <Phone className="w-3.5 h-3.5 text-[#FF5100] group-hover:scale-110 transition-transform" />
                                            +593 989 575 378
                                        </a>
                                    </li>
                                    <li>
                                        <a href="https://wa.me/593960255898" target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all duration-150 hover:opacity-90 hover:-translate-y-px"
                                            style={{ background: '#25D366', boxShadow: '0 2px 10px rgba(37,211,102,0.25)' }}>
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            WhatsApp
                                        </a>
                                    </li>
                                    <li>
                                        <div className="flex items-start gap-2 text-sm text-[rgba(11,18,32,0.50)]">
                                            <MapPin className="w-3.5 h-3.5 text-[#FF5100] mt-0.5 flex-shrink-0" />
                                            <span>Loja, Ecuador</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* ── Col 4: Horario ── */}
                            <div className="space-y-5">
                                <p className="text-xs font-bold text-[#0B1220] uppercase tracking-widest">Horario</p>
                                <ul className="space-y-4">
                                    <li>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <Clock className="w-3.5 h-3.5 text-[#FF5100]" />
                                            <span className="text-xs font-semibold text-[#0B1220]">Lunes – Viernes</span>
                                        </div>
                                        <p className="text-sm text-[rgba(11,18,32,0.50)] pl-5">08:00 – 18:00</p>
                                    </li>
                                    <li>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <Clock className="w-3.5 h-3.5 text-[#FF5100]" />
                                            <span className="text-xs font-semibold text-[#0B1220]">Sábados</span>
                                        </div>
                                        <p className="text-sm text-[rgba(11,18,32,0.50)] pl-5">08:00 – 14:00</p>
                                    </li>
                                    <li>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[rgba(22,163,74,0.08)] text-[#16A34A]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                                            Abierto ahora
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Separador */}
                        <div className="border-t border-[rgba(15,23,42,0.06)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-xs text-[rgba(11,18,32,0.35)] text-center sm:text-left">
                                © {new Date().getFullYear()} SuColor Taller Automotriz · Todos los derechos reservados
                            </p>
                            <p className="text-xs text-[rgba(11,18,32,0.25)]">
                                Sistema de seguimiento de vehículos SuColor PRO
                            </p>
                            <Link to="/admin/login" className="text-xs text-[rgba(11,18,32,0.30)] hover:text-[#FF5100] transition-colors duration-150">
                                Panel Admin
                            </Link>
                        </div>
                    </div>
                </FadeIn>
            </footer>


            {/* WhatsApp FAB */}
            <motion.a href="https://wa.me/593989575378" target="_blank" rel="noopener noreferrer"
                className="fixed bottom-5 right-5 z-50 w-13 h-13 rounded-full flex items-center justify-center text-white"
                style={{ background: '#25D366', width: '52px', height: '52px', boxShadow: '0 4px 20px rgba(37,211,102,0.35)' }}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
                <MessageCircle className="w-6 h-6" />
            </motion.a>
        </div>
    );
}
