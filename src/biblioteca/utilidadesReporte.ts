/**
 * Utilidades compartidas para todos los reportes de SuColor.
 */

/** Formatea una fecha ISO a formato local legible */
export function formatearFecha(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Formatea una fecha ISO a formato corto (dd/mm/yyyy) */
export function formatearFechaCorta(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES');
}

/** Calcula los días entre dos fechas (o desde una fecha hasta hoy) */
export function calcularDiasEntre(
    fechaInicio: string,
    fechaFin?: string | null
): number {
    const inicio = new Date(fechaInicio).getTime();
    const fin = fechaFin ? new Date(fechaFin).getTime() : Date.now();
    return Math.floor((fin - inicio) / (1000 * 60 * 60 * 24));
}

/** Exporta datos como archivo CSV descargable */
export function exportarCSV(
    headers: string[],
    rows: (string | number)[][],
    filename: string
): void {
    if (rows.length === 0) return;

    const escapar = (val: string | number) => {
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvContent = [
        headers.map(escapar).join(','),
        ...rows.map(row => row.map(escapar).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/** Dispara la impresión del navegador */
export function imprimirReporte(): void {
    window.print();
}

/** Nombres de meses en español */
export const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/** Labels legibles para estados de orden */
export const ESTADO_LABELS: Record<string, string> = {
    RECIBIDO: 'Recibido',
    LATONERIA: 'Latonería',
    PREPARACION: 'Preparación',
    PINTURA: 'Pintura',
    SECADO: 'Secado',
    PULIDO_DETALLES: 'Pulido / Detalles',
    TERMINADO: 'Terminado',
    ENTREGADO: 'Entregado',
};

/** Colores para badges de estado */
export const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
    RECIBIDO: { bg: 'bg-blue-100', text: 'text-blue-700' },
    LATONERIA: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    PREPARACION: { bg: 'bg-orange-100', text: 'text-orange-700' },
    PINTURA: { bg: 'bg-purple-100', text: 'text-purple-700' },
    SECADO: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    PULIDO_DETALLES: { bg: 'bg-pink-100', text: 'text-pink-700' },
    TERMINADO: { bg: 'bg-green-100', text: 'text-green-700' },
    ENTREGADO: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

/** Formatea un número como moneda USD */
export function formatearMoneda(valor: number): string {
    return `$${valor.toFixed(2)}`;
}
