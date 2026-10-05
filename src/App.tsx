import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PaginaSeguimiento } from '@/paginas/PaginaSeguimiento';
import { PaginaNoEncontrada } from '@/paginas/PaginaNoEncontrada';
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
import { PaginaPinturas } from '@/paginas/administracion/PaginaPinturas';
import { RutaProtegida } from '@/componentes/administracion/RutaProtegida';

import { ProveedorTema } from '@/componentes/ProveedorTema';
import { ProveedorNotificaciones } from '@/componentes/SistemaNotificaciones';

export default function App() {
    return (
        <ProveedorTema>
            <ProveedorNotificaciones>
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
                        element={
                            <Navigate to="/administracion/orders" replace />}
                    />

                    {/* ── Catch-all ───────────────────────────────────────────── */}
                    <Route path="*" element={<PaginaNoEncontrada />} />
                </Routes>
            </HashRouter>
            </ProveedorNotificaciones>
        </ProveedorTema>
    );
}
