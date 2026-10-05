import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { PaginaInicio } from '@/paginas/PaginaInicio';
import { RutaProtegida } from '@/componentes/administracion/RutaProtegida';
import { ProveedorTema } from '@/componentes/ProveedorTema';
import { ProveedorNotificaciones } from '@/componentes/SistemaNotificaciones';

const PaginaSeguimiento = lazy(() =>
    import('@/paginas/PaginaSeguimiento').then(module => ({
        default: module.PaginaSeguimiento,
    }))
);
const PaginaNoEncontrada = lazy(() =>
    import('@/paginas/PaginaNoEncontrada').then(module => ({
        default: module.PaginaNoEncontrada,
    }))
);
const PaginaInicioSesion = lazy(() =>
    import('@/paginas/administracion/PaginaInicioSesion').then(module => ({
        default: module.PaginaInicioSesion,
    }))
);
const PaginaPanel = lazy(() =>
    import('@/paginas/administracion/PaginaPanel').then(module => ({
        default: module.PaginaPanel,
    }))
);
const PaginaDetalleOrden = lazy(() =>
    import('@/paginas/administracion/PaginaDetalleOrden').then(module => ({
        default: module.PaginaDetalleOrden,
    }))
);
const PaginaListaOrdenes = lazy(() =>
    import('@/paginas/administracion/PaginaListaOrdenes').then(module => ({
        default: module.PaginaListaOrdenes,
    }))
);
const PaginaClientes = lazy(() =>
    import('@/paginas/administracion/PaginaClientes').then(module => ({
        default: module.PaginaClientes,
    }))
);
const PaginaVehiculos = lazy(() =>
    import('@/paginas/administracion/PaginaVehiculos').then(module => ({
        default: module.PaginaVehiculos,
    }))
);
const PaginaNuevaOrden = lazy(() =>
    import('@/paginas/administracion/PaginaNuevaOrden').then(module => ({
        default: module.PaginaNuevaOrden,
    }))
);
const PaginaReportes = lazy(() =>
    import('@/paginas/administracion/PaginaReportes').then(module => ({
        default: module.PaginaReportes,
    }))
);
const PaginaConfiguracion = lazy(() =>
    import('@/paginas/administracion/PaginaConfiguracion').then(module => ({
        default: module.PaginaConfiguracion,
    }))
);
const PaginaPinturas = lazy(() =>
    import('@/paginas/administracion/PaginaPinturas').then(module => ({
        default: module.PaginaPinturas,
    }))
);

function CargandoRuta() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9]">
            <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[#F97316]"
                role="status"
                aria-label="Cargando"
            />
        </div>
    );
}

export default function App() {
    return (
        <ProveedorTema>
            <ProveedorNotificaciones>
                <HashRouter>
                    <Suspense fallback={<CargandoRuta />}>
                        <Routes>
                            {/* ── Public ──────────────────────────────────────────────── */}
                            <Route path="/" element={<PaginaInicio />} />
                            <Route path="/track/:codigo" element={<PaginaSeguimiento />} />

                            {/* ── Admin ───────────────────────────────────────────────── */}
                            <Route
                                path="/administracion/login"
                                element={<PaginaInicioSesion />}
                            />
                            <Route
                                path="/administracion/dashboard"
                                element={
                                    <RutaProtegida>
                                        <PaginaPanel />
                                    </RutaProtegida>
                                }
                            />
                            <Route
                                path="/administracion/orders"
                                element={
                                    <RutaProtegida>
                                        <PaginaListaOrdenes />
                                    </RutaProtegida>
                                }
                            />
                            <Route
                                path="/administracion/orders/nueva"
                                element={
                                    <RutaProtegida>
                                        <PaginaNuevaOrden />
                                    </RutaProtegida>
                                }
                            />
                            <Route
                                path="/administracion/orders/:id"
                                element={
                                    <RutaProtegida>
                                        <PaginaDetalleOrden />
                                    </RutaProtegida>
                                }
                            />
                            <Route
                                path="/administracion/clientes"
                                element={
                                    <RutaProtegida>
                                        <PaginaClientes />
                                    </RutaProtegida>
                                }
                            />
                            <Route
                                path="/administracion/vehiculos"
                                element={
                                    <RutaProtegida>
                                        <PaginaVehiculos />
                                    </RutaProtegida>
                                }
                            />
                            <Route
                                path="/administracion/reportes"
                                element={
                                    <RutaProtegida>
                                        <PaginaReportes />
                                    </RutaProtegida>
                                }
                            />
                            <Route
                                path="/administracion/configuracion"
                                element={
                                    <RutaProtegida>
                                        <PaginaConfiguracion />
                                    </RutaProtegida>
                                }
                            />
                            <Route
                                path="/administracion/pinturas"
                                element={
                                    <RutaProtegida>
                                        <PaginaPinturas />
                                    </RutaProtegida>
                                }
                            />

                            {/* ── Legacy redirect ─────────────────────────────────────── */}
                            <Route
                                path="/admin"
                                element={<Navigate to="/administracion/orders" replace />}
                            />

                            {/* ── Catch-all ───────────────────────────────────────────── */}
                            <Route path="*" element={<PaginaNoEncontrada />} />
                        </Routes>
                    </Suspense>
                </HashRouter>
            </ProveedorNotificaciones>
        </ProveedorTema>
    );
}
