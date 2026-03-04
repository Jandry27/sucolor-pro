import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Shield, Clock, Eye, CheckCircle, Zap, MessageCircle, MapPin, Star, Phone, ArrowRight } from 'lucide-react';
import { SearchForm } from '@/components/SearchForm';

function FadeIn({ children, delay = 0, className = '' }: {
    children: React.ReactNode; delay?: number; className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px 0px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay, ease: 'easeOut' }}
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
        <div className="min-h-screen bg-white overflow-x-hidden">
            {/* ── NAV ─────────────────────────────────────────────── */}
            <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[rgba(15,23,42,0.07)]">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
                    <img src="/logo.png" alt="SuColor" className="h-12 w-auto object-contain" style={{ maxHeight: '52px' }} />
                    <div className="flex items-center gap-2">
                        <Link to="/admin/login"
                            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[rgba(11,18,32,0.60)] hover:text-[#0B1220] hover:bg-[rgba(15,23,42,0.05)] transition-all duration-150">
                            Panel Admin <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <a href="https://wa.me/593989575378" target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-150"
                            style={{ background: '#25D366' }}>
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                    </div>
                </div>
            </nav>

            {/* ── HERO ─────────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-20 pb-24 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-8 rounded-full text-xs font-semibold uppercase tracking-widest"
                        style={{ background: 'rgba(255,81,0,0.08)', color: '#FF5100', border: '1px solid rgba(255,81,0,0.15)' }}>
                        <Zap className="w-3 h-3" /> Taller automotriz profesional
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0B1220] mb-5 leading-[1.08] tracking-tight">
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
                    className="max-w-md mx-auto card"
                    style={{ padding: '28px', boxShadow: '0 4px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,81,0,0.06)' }}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,81,0,0.10)' }}>
                            <Search className="w-4 h-4 text-[#FF5100]" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-sm text-[#0B1220]">Consulta tu vehículo</p>
                            <p className="text-xs text-[rgba(11,18,32,0.45)]">Busca por placa o nombre del titular</p>
                        </div>
                    </div>
                    <SearchForm />
                </motion.div>

                {/* Trust indicators */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-[rgba(11,18,32,0.50)]">
                    {[
                        { icon: <Shield className="w-3.5 h-3.5" />, label: 'Acceso seguro' },
                        { icon: <Clock className="w-3.5 h-3.5" />, label: 'Tiempo real' },
                        { icon: <Eye className="w-3.5 h-3.5" />, label: 'Sin registro requerido' },
                    ].map(b => (
                        <div key={b.label} className="flex items-center gap-1.5 text-[#FF5100]">
                            {b.icon}
                            <span className="text-[rgba(11,18,32,0.50)]">{b.label}</span>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────── */}
            <section className="bg-[#F7F8FA] border-y border-[rgba(15,23,42,0.07)]">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
                    <FadeIn className="text-center mb-12">
                        <p className="section-title mb-2">Cómo funciona</p>
                        <h2 className="text-3xl font-bold text-[#0B1220]">Tres pasos. Sin complicaciones.</h2>
                    </FadeIn>
                    <div className="grid sm:grid-cols-3 gap-5">
                        {STEPS.map((s, i) => (
                            <FadeIn key={s.num} delay={i * 0.08}>
                                <div className="card relative" style={{ padding: '24px' }}>
                                    <span className="absolute top-5 right-5 font-mono-code text-3xl font-bold text-[rgba(15,23,42,0.05)]">{s.num}</span>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                        style={{ background: '#FF5100', boxShadow: '0 4px 12px rgba(255,81,0,0.25)' }}>
                                        {s.icon}
                                    </div>
                                    <h3 className="font-semibold text-[#0B1220] mb-1.5">{s.title}</h3>
                                    <p className="text-sm text-[rgba(11,18,32,0.55)] leading-relaxed">{s.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BENEFITS ─────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
                <div className="grid sm:grid-cols-2 gap-12 items-center">
                    <FadeIn>
                        <p className="section-title mb-3">Ventajas</p>
                        <h2 className="text-3xl font-bold text-[#0B1220] mb-4 leading-tight">
                            Transparencia que genera confianza
                        </h2>
                        <p className="text-[rgba(11,18,32,0.55)] leading-relaxed">
                            Nuestro portal de seguimiento pone en tus manos la información del estado de tu vehículo, sin llamadas ni esperas.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.1} className="space-y-2.5">
                        {BENEFITS.map(b => (
                            <div key={b} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[rgba(15,23,42,0.07)]">
                                <CheckCircle className="w-4 h-4 text-[#FF5100] flex-shrink-0" />
                                <span className="text-sm text-[rgba(11,18,32,0.70)] font-medium">{b}</span>
                            </div>
                        ))}
                    </FadeIn>
                </div>
            </section>

            {/* ── STATS ────────────────────────────────────────────── */}
            <section className="bg-[#F7F8FA] border-y border-[rgba(15,23,42,0.07)]">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {STATS.map((s, i) => (
                            <FadeIn key={s.value} delay={i * 0.07}>
                                <div className="card text-center" style={{ padding: '20px' }}>
                                    <p className="text-3xl font-extrabold text-gradient-orange mb-1">{s.value}</p>
                                    <p className="text-xs text-[rgba(11,18,32,0.50)] font-medium">{s.label}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CONTACT ──────────────────────────────────────────── */}
            <section className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
                <FadeIn>
                    <div className="card text-center" style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 40px' }}>
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
                            style={{ background: 'rgba(255,81,0,0.08)' }}>
                            <Star className="w-5 h-5 text-[#FF5100]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0B1220] mb-3">¿Necesitas traer tu vehículo?</h2>
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
                        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-[rgba(11,18,32,0.40)]">
                            <MapPin className="w-3 h-3 text-[#FF5100]" />
                            Taller SuColor
                        </div>
                    </div>
                </FadeIn>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────── */}
            <footer className="border-t border-[rgba(15,23,42,0.07)] bg-[#F7F8FA]">
                <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <img src="/logo.png" alt="SuColor" className="h-8 w-auto object-contain" />
                    <p className="text-xs text-[rgba(11,18,32,0.35)] text-center">
                        © {new Date().getFullYear()} SuColor — Taller automotriz profesional
                    </p>
                    <Link to="/admin/login" className="text-xs text-[rgba(11,18,32,0.40)] hover:text-[#FF5100] transition-colors">
                        Panel Admin
                    </Link>
                </div>
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
