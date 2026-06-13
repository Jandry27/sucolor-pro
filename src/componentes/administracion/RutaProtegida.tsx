import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAutenticacion } from '@/ganchos/useAutenticacion';
import { Loader2 } from 'lucide-react';

interface RutaProtegidaProps {
    children: React.ReactNode;
}

export function RutaProtegida({ children }: RutaProtegidaProps) {
    const { user, loading } = useAutenticacion();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="w-8 h-8 text-[#FF5100] animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/administracion/login" replace />;
    }

    return <>{children}</>;
}
