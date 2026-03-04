import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F7F8FA' }}>
            <div className="card max-w-sm w-full text-center" style={{ padding: '40px 32px' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(239,68,68,0.08)' }}>
                    <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
                </div>
                <h2 className="text-lg font-bold text-[#0B1220] mb-2">No encontrado</h2>
                <p className="text-sm text-[rgba(11,18,32,0.55)] mb-6 leading-relaxed">{message}</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {onRetry && (
                        <button onClick={onRetry} className="btn-secondary text-sm gap-2">
                            <RefreshCw className="w-4 h-4" /> Reintentar
                        </button>
                    )}
                    <Link to="/" className="btn-primary text-sm gap-2" style={{ textDecoration: 'none' }}>
                        <Home className="w-4 h-4" /> Ir al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
