import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Printer, Search, FileBarChart, Calendar, DollarSign, Car } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { AdminOrder } from '@/types';

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function ReportesPage() {
    const { orders, loading } = useOrders('ENTREGADO'); // Solo queremos facturados/entregados
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');

    // Obtener años disponibles de las órdenes
    const availableYears = useMemo(() => {
        if (!orders.length) return [new Date().getFullYear()];
        const years = new Set(orders.map(o => new Date(o.updated_at).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [orders]);

    // Filtrar órdenes por mes, año y buscador
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const date = new Date(o.updated_at);
            if (date.getMonth() !== selectedMonth || date.getFullYear() !== selectedYear) return false;

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const codigo = o.codigo?.toLowerCase() || '';
                const cliente = o.cliente?.nombres?.toLowerCase() || '';
                const placa = o.vehiculo?.placa?.toLowerCase() || '';
                return codigo.includes(term) || cliente.includes(term) || placa.includes(term);
            }
            return true;
        }).sort((a, b) => {
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return dateB - dateA;
        });
    }, [orders, selectedMonth, selectedYear, searchTerm]);

    const totalIngresos = useMemo(() => {
        return filteredOrders.reduce((sum, o) => sum + (o.precio_total || o.monto_pagado || 0), 0);
    }, [filteredOrders]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadCSV = () => {
        if (filteredOrders.length === 0) return;

        const headers = ['Fecha de Entrega', 'Código', 'Cliente', 'Vehículo (Placa)', 'Ingreso ($)'];
        const rows = filteredOrders.map(o => [
            new Date(o.updated_at).toLocaleDateString(),
            o.codigo,
            `"${o.cliente?.nombres || '—'}"`,
            `"${o.vehiculo?.marca || ''} - ${o.vehiculo?.placa || ''}"`,
            (o.precio_total || o.monto_pagado || 0).toFixed(2)
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Reporte_SuColor_${MONTHS[selectedMonth]}_${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AdminLayout>
            <div className="space-y-6 animate-fade-in print:space-y-4">
                {/* Header (No imprimible) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0B1220] tracking-tight flex items-center gap-2">
                            <FileBarChart className="w-6 h-6 text-[#FF5100]" /> Reporte de Ganancias
                        </h1>
                        <p className="text-sm text-[rgba(11,18,32,0.50)] mt-0.5">
                            Consulta los trabajos entregados y calculados por mes.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handlePrint} className="btn-secondary text-sm">
                            <Printer className="w-4 h-4" /> Imprimir
                        </button>
                        <button onClick={handleDownloadCSV} className="btn-primary text-sm" disabled={filteredOrders.length === 0}>
                            <Download className="w-4 h-4" /> Exportar CSV
                        </button>
                    </div>
                </div>

                {/* Print Only Header */}
                <div className="hidden print:block text-center mb-6">
                    <img src="/logo.png" alt="SuColor" className="h-12 w-auto mx-auto mb-2" />
                    <h2 className="text-xl font-bold">Reporte de Ganancias - {MONTHS[selectedMonth]} {selectedYear}</h2>
                    <p className="text-sm text-gray-500">Generado el {new Date().toLocaleDateString()}</p>
                </div>

                {/* Filtros (No imprimible) */}
                <div className="card-sm flex flex-col md:flex-row gap-4 items-end print:hidden">
                    <div className="w-full md:w-auto">
                        <label className="form-label">Mes</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="input-field"
                        >
                            {MONTHS.map((col, idx) => (
                                <option key={col} value={idx}>{col}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="form-label">Año</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="input-field"
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full relative flex-1">
                        <label className="form-label">Buscar en este mes</label>
                        <Search className="absolute left-3.5 top-[34px] w-4 h-4 text-[rgba(11,18,32,0.30)] pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, placa o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="card-sm flex items-center gap-4 bg-[rgba(22,163,74,0.04)] border-[rgba(22,163,74,0.15)]">
                        <div className="w-12 h-12 rounded-xl bg-[#16A34A] flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Ingresos Totales ({MONTHS[selectedMonth]})</p>
                            <p className="text-3xl font-black text-[#16A34A] leading-none mt-1">${totalIngresos.toFixed(2)}</p>
                        </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
                        className="card-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(15,23,42,0.06)] flex items-center justify-center">
                            <Car className="w-6 h-6 text-[#0B1220]" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[rgba(11,18,32,0.50)] uppercase tracking-wider">Trabajos Entregados</p>
                            <p className="text-3xl font-bold text-[#0B1220] leading-none mt-1">{filteredOrders.length}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Tabla de Resultados */}
                <div className="card overflow-hidden p-0 print:border-none print:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#F7F8FA] border-b border-[rgba(15,23,42,0.07)] print:bg-transparent">
                                <tr>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">Fecha Entrega</th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">Código</th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">Cliente</th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)]">Vehículo</th>
                                    <th className="px-5 py-3.5 font-semibold text-[rgba(11,18,32,0.60)] text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-[rgba(11,18,32,0.40)]">
                                            Generando reporte...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-[rgba(11,18,32,0.40)]">
                                            No se encontraron trabajos entregados en {MONTHS[selectedMonth]} {selectedYear}.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr key={order.id} className="border-b border-[rgba(15,23,42,0.04)] hover:bg-[rgba(15,23,42,0.02)] transition-colors print:border-b-gray-200">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5 text-[rgba(11,18,32,0.70)]">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(order.updated_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 font-mono-code font-bold text-[#FF5100]">
                                                {order.codigo}
                                            </td>
                                            <td className="px-5 py-3 font-medium text-[#0B1220]">
                                                {order.cliente?.nombres || '—'}
                                            </td>
                                            <td className="px-5 py-3 text-[rgba(11,18,32,0.70)]">
                                                {order.vehiculo?.marca} <span className="text-[rgba(11,18,32,0.40)]">•</span> {order.vehiculo?.placa}
                                            </td>
                                            <td className="px-5 py-3 text-right font-black text-[#16A34A]">
                                                ${(order.precio_total || order.monto_pagado || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredOrders.length > 0 && (
                                <tfoot className="bg-[#F7F8FA] border-t-2 border-[rgba(15,23,42,0.07)] print:bg-transparent print:border-t-2 print:border-gray-800">
                                    <tr>
                                        <td colSpan={4} className="px-5 py-4 text-right font-bold text-[#0B1220] uppercase tracking-wider text-xs">
                                            Total Ingresos
                                        </td>
                                        <td className="px-5 py-4 text-right font-black text-xl text-[#16A34A]">
                                            ${totalIngresos.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
            {/* Ocultar elementos de navegación al imprimir usando estilos globales */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 1.5cm; }
                    nav, aside, button { display: none !important; }
                    .AdminLayout-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                }
            `}} />
        </AdminLayout>
    );
}
