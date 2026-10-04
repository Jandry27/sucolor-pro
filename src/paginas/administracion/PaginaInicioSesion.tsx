import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

export function PaginaInicioSesion() {
    const { login } = useAutenticacion();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState<number | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_SECONDS = 60;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (lockedUntil && Date.now() < lockedUntil) {
            const secsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
            setError(`Demasiados intentos. Espera ${secsLeft} segundos.`);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const exito = await login(email, password);
            if (exito) {
                setAttempts(0);
                setIsSuccess(true);
                setTimeout(() => {
                    navigate('/administracion/orders');
                }, 1200);
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS) {
                    setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
                    setAttempts(0);
                    setError(`Cuenta bloqueada temporalmente por ${LOCKOUT_SECONDS} segundos.`);
                } else {
                    setError(`Credenciales incorrectas. Intentos restantes: ${MAX_ATTEMPTS - newAttempts}`);
                }
            }
        } catch {
            setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-[#FEF7F0] lg:bg-white overflow-hidden relative">
            
            {/* Ondas decorativas globales (visibles en móvil) */}
            <div className="absolute inset-0 pointer-events-none opacity-40 lg:hidden z-0">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute w-full h-full text-[#F97316]">
                    <path fill="currentColor" fillOpacity="0.05" d="M0,50 C30,70 70,30 100,50 L100,100 L0,100 Z" />
                    <path fill="currentColor" fillOpacity="0.05" d="M0,70 C40,90 60,40 100,70 L100,100 L0,100 Z" />
                    <path fill="currentColor" fillOpacity="0.05" d="M0,90 C50,100 50,70 100,90 L100,100 L0,100 Z" />

                    <path fill="none" stroke="currentColor" strokeWidth="0.2" strokeOpacity="0.3" d="M-10,40 C30,80 70,20 110,60" />
                    <path fill="none" stroke="currentColor" strokeWidth="0.1" strokeOpacity="0.2" d="M-10,50 C40,90 60,30 110,70" />
                    <path fill="none" stroke="currentColor" strokeWidth="0.15" strokeOpacity="0.2" d="M-10,60 C50,100 50,50 110,90" />
                </svg>
            </div>
            
            {/* Fondo del auto para MÓVIL (muy suave para no estorbar la lectura) */}
            <div className="absolute bottom-0 right-0 w-full max-w-[500px] pointer-events-none lg:hidden z-0 flex justify-end items-end opacity-70" style={{ mixBlendMode: 'darken' }}>
                <img src="/car-illustration.jpg" alt="" className="w-full object-contain select-none" draggable={false} />
            </div>
            


            <div className="absolute inset-0 bg-gradient-to-br from-[#FEF7F0]/80 via-transparent to-[#F97316]/5 pointer-events-none lg:hidden z-0" />

            {/* Lado Izquierdo: Formulario */}
            <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="w-full lg:w-5/12 xl:w-[42%] flex flex-col justify-start pt-8 sm:pt-16 lg:justify-center lg:pt-0 px-6 sm:px-14 md:px-20 lg:px-12 xl:px-20 relative z-10 bg-transparent lg:bg-white lg:shadow-[20px_0_40px_rgba(0,0,0,0.05)]"
            >
                <div className="w-full max-w-[380px] mx-auto">
                    {/* Logo */}
                    <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        src="/logo.png"
                        alt="SuColor"
                        className="w-56 sm:w-64 lg:w-52 xl:w-64 h-auto object-contain mb-6 sm:mb-8"
                        draggable={false}
                    />

                    {/* Título */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-6 sm:mb-8"
                    >
                        <h1 className="text-3xl sm:text-[2rem] leading-tight font-bold text-[#0B1220] tracking-tight">
                            Bienvenido a<br />
                            <span className="text-[#F97316]">SuColor</span>
                        </h1>
                        <p className="text-sm text-[#0B1220]/50 mt-2 sm:mt-3">
                            Inicia sesión para acceder al panel de gestión.
                        </p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6 px-4 py-3 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-100"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Input Correo */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                            <label className="block text-sm font-semibold text-[#0B1220] mb-2">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0B1220]/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="nombre@correo.com"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-[#F7F8FA] border border-[#0B1220]/8 rounded-xl text-sm text-[#0B1220] placeholder-[#0B1220]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all"
                                    autoComplete="email"
                                />
                            </div>
                        </motion.div>

                        {/* Input Contraseña */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-[#0B1220]">
                                    Contraseña
                                </label>
                                <a href="#" className="text-xs font-medium text-[#F97316] hover:text-[#EA6C0A] transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0B1220]/30" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Ingresa tu contraseña"
                                    required
                                    className="w-full pl-11 pr-12 py-3 bg-[#F7F8FA] border border-[#0B1220]/8 rounded-xl text-sm text-[#0B1220] placeholder-[#0B1220]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B1220]/30 hover:text-[#0B1220]/60 transition-colors"
                                >
                                    {showPw ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </motion.div>

                        {/* Botón */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="pt-3">
                            <button
                                type="submit"
                                disabled={loading || isSuccess}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white rounded-xl transition-all shadow-orange-sm ${isSuccess
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'bg-[#F97316] hover:bg-[#EA6C0A]'
                                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                {isSuccess ? (
                                    <motion.svg
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-5 h-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <motion.path
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.3 }}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </motion.svg>
                                ) : loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Iniciar sesión</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </form>


                </div>
            </motion.div>

            {/* Lado Derecho: Visual de Marca */}
            <div className="hidden lg:flex lg:w-7/12 xl:w-[58%] relative flex-col items-center overflow-hidden" style={{ backgroundColor: '#FEF7F0' }}>

                {/* Paisaje de montañas y auto (imagen proporcionada por el usuario) */}
                <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'darken' }}>
                    <img
                        src="/auto.png"
                        alt=""
                        className="w-full h-full object-cover object-bottom select-none opacity-90"
                        draggable={false}
                    />
                </div>

                {/* Gradiente adicional para suavizar */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#FEF7F0]/70 via-transparent to-[#FEF7F0]/40 pointer-events-none" />

                {/* Contenido superior: Logo + Texto */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 flex flex-col items-center text-center mt-3 xl:mt-5 mb-auto"
                >
                    <img
                        src="/logo.png"
                        alt="SuColor"
                        className="w-48 xl:w-64 object-contain select-none mb-6"
                        draggable={false}
                    />

                    <div className="flex flex-col items-center gap-1">
                        <h2 className="text-lg md:text-xl font-black text-[#FF4805] uppercase tracking-[0.2em]">
                            Gestión Automotriz
                        </h2>
                        <div className="w-12 h-[2px] bg-[#0B1220]/10 my-2" />
                        <p className="text-base text-[#0B1220]/50 font-medium tracking-wide">
                            Simple & Profesional
                        </p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}


