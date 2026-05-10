import { Edit2, FileText, Trash2, Loader2 } from 'lucide-react';
import type { AdminOrder } from '@/tipos';

interface EncabezadoDetalleOrdenProps {
    order: AdminOrder;
    saving: boolean;
    onEditDetails: () => void;
    onOpenInvoice: () => void;
    onDelete: () => void;
}

export function EncabezadoDetalleOrden({
    order,
    saving,
    onEditDetails,
    onOpenInvoice,
    onDelete,
}: EncabezadoDetalleOrdenProps) {
    return (
        <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
                <span className="font-mono-code text-xs text-[#FF5100] font-bold">
                    {order.codigo}
                </span>
                <h1 className="text-xl font-bold text-[#0B1220] dark:text-white mt-1">
                    {(order.cliente as any).nombres}
                </h1>
                <p className="text-sm text-[rgba(11,18,32,0.50)] dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    {order.vehiculo.marca} {order.vehiculo.modelo} —{' '}
                    <span className="font-mono-code">{order.vehiculo.placa}</span>
                </p>
            </div>

            <div className="flex items-center gap-1.5">
                {saving && <Loader2 className="w-4 h-4 text-[#FF5100] animate-spin mt-1" />}

                <button
                    onClick={onEditDetails}
                    disabled={saving}
                    className="p-2 text-[rgba(11,18,32,0.40)] bg-[rgba(15,23,42,0.03)] hover:bg-[rgba(15,23,42,0.06)] hover:text-[#0B1220] rounded-lg transition-colors border border-transparent hover:border-[rgba(15,23,42,0.1)]"
                    title="Editar detalles del cliente y vehículo"
                >
                    <Edit2 className="w-4 h-4" />
                </button>

                <button
                    onClick={onOpenInvoice}
                    disabled={saving || !order.cliente_id}
                    className="p-2 text-brand-orange bg-[rgba(255,81,0,0.05)] border border-[rgba(255,81,0,0.1)] hover:bg-[rgba(255,81,0,0.1)] hover:border-[rgba(255,81,0,0.2)] rounded-lg transition-colors ml-1"
                    title="Emitir Factura Electrónica SRI"
                >
                    <FileText className="w-4 h-4" />
                </button>

                <button
                    onClick={onDelete}
                    disabled={saving}
                    className="p-2 text-[#EF4444] bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.1)] hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.2)] rounded-lg transition-colors ml-1"
                    title="Eliminar orden"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
