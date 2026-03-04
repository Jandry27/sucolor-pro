import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TrackPage } from '@/pages/TrackPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/admin/LoginPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { OrderDetailPage } from '@/pages/admin/OrderDetailPage';
import { ClientesPage } from '@/pages/admin/ClientesPage';
import { VehiculosPage } from '@/pages/admin/VehiculosPage';
import { NuevaOrdenPage } from '@/pages/admin/NuevaOrdenPage';

export default function App() {
    return (
        <HashRouter>
            <Routes>
                {/* ── Public ──────────────────────────────────────────────── */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/track/:codigo" element={<TrackPage />} />

                {/* ── Admin ───────────────────────────────────────────────── */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/orders/nueva" element={<NuevaOrdenPage />} />
                <Route path="/admin/orders/:id" element={<OrderDetailPage />} />
                <Route path="/admin/clientes" element={<ClientesPage />} />
                <Route path="/admin/vehiculos" element={<VehiculosPage />} />

                {/* ── Legacy redirect ─────────────────────────────────────── */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

                {/* ── Catch-all ───────────────────────────────────────────── */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </HashRouter>
    );
}

function NotFound() {
    return (
        <div className="min-h-screen bg-brand-black flex items-center justify-center px-4">
            <div className="text-center space-y-4">
                <p className="text-8xl font-display font-black text-brand-white/[0.04]">404</p>
                <h1 className="text-xl font-display font-semibold text-brand-white">
                    Página no encontrada
                </h1>
                <p className="text-brand-gray-lighter text-sm">
                    Usa el enlace de seguimiento que te proporcionó el taller.
                </p>
                <a
                    href="#/"
                    className="inline-block btn-primary mt-2"
                >
                    Volver al inicio
                </a>
            </div>
        </div>
    );
}
