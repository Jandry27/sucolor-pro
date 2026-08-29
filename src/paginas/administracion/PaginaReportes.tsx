import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign,
    Car,
    Warehouse,
    BarChart3,
    RefreshCw,
    FileBarChart,
} from 'lucide-react';
import { DisenoAdministracion } from '@/componentes/administracion/DisenoAdministracion';
import { ReporteGanancias } from '@/componentes/administracion/reportes/ReporteGanancias';
import { ReporteHistorialVehiculo } from '@/componentes/administracion/reportes/ReporteHistorialVehiculo';
import { ReporteVehiculosTaller } from '@/componentes/administracion/reportes/ReporteVehiculosTaller';
import { ReporteRentabilidadMarca } from '@/componentes/administracion/reportes/ReporteRentabilidadMarca';
import { ReporteGarantiasRetrabajos } from '@/componentes/administracion/reportes/ReporteGarantiasRetrabajos';

const TABS = [
    {
        id: 'ganancias',
        label: 'Ganancias',
        shortLabel: 'Ganancias',
        icon: DollarSign,
        color: '#16A34A',
        description: 'Ingresos mensuales por trabajos entregados',
    },
    {
        id: 'historial',
        label: 'Historial Vehículo',
        shortLabel: 'Historial',
        icon: Car,
        color: '#F97316',
        description: 'Historial completo de servicios por vehículo',
    },
    {
        id: 'taller',
        label: 'En Taller',
        shortLabel: 'Taller',
        icon: Warehouse,
        color: '#6366F1',
        description: 'Vehículos actualmente en las instalaciones',
    },
    {
        id: 'rentabilidad',
        label: 'Rentabilidad',
        shortLabel: 'Marcas',
        icon: BarChart3,
        color: '#EAB308',
        description: 'Ingresos agrupados por marca de vehículo',
    },
    {
        id: 'garantias',
        label: 'Garantías',
        shortLabel: 'Garantías',
        icon: RefreshCw,
        color: '#EF4444',
        description: 'Detección de posibles retrabajos',
    },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function PaginaReportes() {
    const [activeTab, setActiveTab] = useState<TabId>('ganancias');
    const currentTab = TABS.find(t => t.id === activeTab)!;

    return (
        <DisenoAdministracion>
            <div className="space-y-6 animate-fade-in">
                {/* Page Header (print:hidden) */}
                <div className="print:hidden">
                    <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                        <FileBarChart className="w-6 h-6 text-[#F97316]" /> Centro de Reportes
                    </h1>
                    <p className="text-sm text-[rgba(15,23,42,0.60)] mt-0.5">
                        Genera, consulta e imprime reportes del taller.
                    </p>
                </div>

                {/* Tabs (print:hidden) */}
                <div className="print:hidden">
                    {/* Desktop tabs */}
                    <div className="hidden sm:flex gap-1.5 p-1.5 rounded-2xl bg-[rgba(15,23,42,0.03)] border border-[rgba(15,23,42,0.06)]">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'bg-white shadow-premium text-[#0F172A]'
                                            : 'text-[rgba(11,18,32,0.50)] hover:text-[#0F172A] hover:bg-white/50'
                                    }`}
                                >
                                    <Icon
                                        className="w-4 h-4 flex-shrink-0"
                                        style={{ color: isActive ? tab.color : undefined }}
                                    />
                                    <span className="hidden lg:inline">{tab.label}</span>
                                    <span className="lg:hidden">{tab.shortLabel}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                                            style={{ background: tab.color }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Mobile tabs (scrollable) */}
                    <div className="sm:hidden overflow-x-auto -mx-4 px-4 pb-1">
                        <div className="flex gap-2 min-w-max">
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                                            isActive
                                                ? 'text-white shadow-lg'
                                                : 'bg-[rgba(15,23,42,0.05)] text-[rgba(11,18,32,0.55)] hover:bg-[rgba(15,23,42,0.08)]'
                                        }`}
                                        style={
                                            isActive
                                                ? {
                                                      background: tab.color,
                                                      boxShadow: `0 8px 20px -5px ${tab.color}40`,
                                                  }
                                                : undefined
                                        }
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {tab.shortLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab description */}
                    <p className="text-xs text-[rgba(11,18,32,0.45)] mt-3 flex items-center gap-1.5">
                        <currentTab.icon className="w-3.5 h-3.5" style={{ color: currentTab.color }} />
                        {currentTab.description}
                    </p>
                </div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'ganancias' && <ReporteGanancias />}
                    {activeTab === 'historial' && <ReporteHistorialVehiculo />}
                    {activeTab === 'taller' && <ReporteVehiculosTaller />}
                    {activeTab === 'rentabilidad' && <ReporteRentabilidadMarca />}
                    {activeTab === 'garantias' && <ReporteGarantiasRetrabajos />}
                </motion.div>
            </div>

            {/* Estilos de impresión */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    @page { margin: 1.5cm; }
                    nav, aside, button { display: none !important; }
                    .DisenoAdministracion-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    .glass-card, .card { box-shadow: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; border: 1px solid #e2e8f0 !important; }
                }
            `,
                }}
            />
        </DisenoAdministracion>
    );
}
