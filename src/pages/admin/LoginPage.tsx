import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            navigate('/admin/dashboard');
        } catch {
            setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F7F8FA' }}>
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="SuColor" className="h-12 w-auto object-contain mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-[#0B1220]">Panel de Administración</h1>
                    <p className="text-sm text-[rgba(11,18,32,0.50)] mt-1">Ingresa tus credenciales para continuar</p>
                </div>

                {/* Card */}
                <div className="card" style={{ padding: '32px' }}>
                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium text-[#EF4444]"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="form-label">Correo electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@sucolor.com"
                                required
                                className="input-field"
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="form-label">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="input-field pr-10"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(11,18,32,0.35)] hover:text-[rgba(11,18,32,0.65)] transition-colors"
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</>
                            ) : (
                                'Iniciar sesión'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-[rgba(11,18,32,0.35)] mt-6">
                    SuColor PRO v1.0 — Panel exclusivo para administradores
                </p>
            </motion.div>
        </div>
    );
}
