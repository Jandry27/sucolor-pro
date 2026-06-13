import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PaginaSeguimiento } from '@/paginas/PaginaSeguimiento';
import { PaginaInicio } from '@/paginas/PaginaInicio';
import { PaginaInicioSesion } from '@/paginas/administracion/PaginaInicioSesion';
import { PaginaPanel } from '@/paginas/administracion/PaginaPanel';
import { PaginaDetalleOrden } from '@/paginas/administracion/PaginaDetalleOrden';
import { PaginaListaOrdenes } from '@/paginas/administracion/PaginaListaOrdenes';
import { PaginaClientes } from '@/paginas/administracion/PaginaClientes';
import { PaginaVehiculos } from '@/paginas/administracion/PaginaVehiculos';
import { PaginaNuevaOrden } from '@/paginas/administracion/PaginaNuevaOrden';
import { PaginaReportes } from '@/paginas/administracion/PaginaReportes';
import { PaginaConfiguracion } from '@/paginas/administracion/PaginaConfiguracion';
import { RutaProtegida } from '@/componentes/administracion/RutaProtegida';

import { ProveedorTema } from '@/componentes/ProveedorTema';

export default function App() {
    return (
        <ProveedorTema>
            <HashRouter>
                <Routes>
                    {/* ── Public ──────────────────────────────────────────────── */}
                    <Route path="/" element={<PaginaInicio />} />
                    <Route path="/track/:codigo" element={<PaginaSeguimiento />} />

                    {/* ── Admin ───────────────────────────────────────────────── */}
                    <Route path="/administracion/login" element={<PaginaInicioSesion />} />
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

                    {/* ── Legacy redirect ─────────────────────────────────────── */}
                    <Route
                        path="/admin"
                        element={
                            <Navigate to="/administracion/orders" replace />}
                    />

                    {/* ── Catch-all ───────────────────────────────────────────── */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </HashRouter>
        </ProveedorTema>
    );
}

function NotFound() {
    return (
        <div className="min-h-screen mesh-gradient bg-[#0F172A] flex items-center justify-center px-4">
            <div className="text-center space-y-4">
                <p className="text-8xl font-display font-black text-brand-white/[0.04]">404</p>
                <h1 className="text-xl font-display font-semibold text-brand-white">
                    Página no encontrada
                </h1>
                <p className="text-brand-gray-lighter text-sm">
                    Usa el enlace de seguimiento que te proporcionó el taller.
                </p>
                <a href="#/" className="inline-block btn-primary mt-2">
                    Volver al inicio
                </a>
            </div>
        </div>
    );
}
