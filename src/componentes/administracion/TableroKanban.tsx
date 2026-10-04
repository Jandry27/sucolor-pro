import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AdminOrder, OrderStatus } from '@/tipos';
import { TarjetaOrden } from './TarjetaOrden';
import { ChevronDown, ChevronUp } from 'lucide-react';

const COLUMNS: { estado: OrderStatus; label: string; color: string }[] = [
    { estado: 'RECIBIDO', label: 'Recibido', color: '#6B7280' },
    { estado: 'LATONERIA', label: 'Latonería', color: '#3B82F6' },
    { estado: 'PREPARACION', label: 'Preparación', color: '#8B5CF6' },
    { estado: 'PINTURA', label: 'Pintura', color: '#F59E0B' },
    { estado: 'SECADO', label: 'Secado', color: '#FB923C' },
    { estado: 'PULIDO_DETALLES', label: 'Pulido', color: '#EC4899' },
    { estado: 'TERMINADO', label: 'Terminado', color: '#16A34A' },
    { estado: 'ENTREGADO', label: 'Entregado', color: '#0EA5E9' },
];

interface TableroKanbanProps {
    orders: AdminOrder[];
    onDelete?: (id: string) => void;
}

// ── Vista acordeón para móvil ─────────────────────────────────────────────────
function ColumnaAcordeon({
    col,
    orders,
    onDelete,
}: {
    col: (typeof COLUMNS)[0];
    orders: AdminOrder[];
    onDelete?: (id: string) => void;
}) {
    const [open, setOpen] = useState(orders.length > 0);

    return (
        <div className="rounded-xl border border-slate-200/60 overflow-hidden bg-white/50 backdrop-blur-sm">
            {/* Header clickable */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3"
                style={{ background: `${col.color}0D` }}
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: col.color }}
                    />
                    <span className="text-sm font-semibold text-[#0F172A]">{col.label}</span>
                    <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: col.color, background: `${col.color}20` }}
                    >
                        {orders.length}
                    </span>
                </div>
                {open
                    ? <ChevronUp className="w-4 h-4 text-[rgba(15,23,42,0.40)]" />
                    : <ChevronDown className="w-4 h-4 text-[rgba(15,23,42,0.40)]" />
                }
            </button>

            {/* Tarjetas */}
            <AnimatePresence initial={false}>
                {open && (
                    <div className="flex flex-col gap-2 p-3">
                        <AnimatePresence>
                            {orders.map(order => (
                                <TarjetaOrden key={order.id} order={order} onDelete={onDelete} />
                            ))}
                        </AnimatePresence>
                        {orders.length === 0 && (
                            <div className="flex items-center justify-center h-12 rounded-xl border border-dashed border-[rgba(15,23,42,0.10)] text-[10px] text-[rgba(11,18,32,0.30)] font-medium">
                                Sin órdenes
                            </div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function TableroKanban({ orders, onDelete }: TableroKanbanProps) {
    return (
        <>
            {/* ── Vista escritorio: columnas horizontales ───────────────────── */}
            <div
                className="hidden md:flex gap-3.5 overflow-x-auto pb-4"
                style={{ scrollSnapType: 'x mandatory' }}
            >
                {COLUMNS.map(col => {
                    const colOrders = orders.filter(o => o.estado === col.estado);
                    return (
                        <div
                            key={col.estado}
                            className="flex-shrink-0 w-[260px] flex flex-col gap-2.5"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            {/* Column header */}
                            <div
                                className="flex items-center justify-between px-3 py-2 bg-white/60 backdrop-blur-md rounded-xl border border-slate-200/50"
                                style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: col.color }}
                                    />
                                    <span className="text-xs font-semibold text-[#0F172A]">
                                        {col.label}
                                    </span>
                                </div>
                                <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ color: col.color, background: `${col.color}18` }}
                                >
                                    {colOrders.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="flex flex-col gap-2 min-h-[80px]">
                                <AnimatePresence>
                                    {colOrders.map(order => (
                                        <TarjetaOrden
                                            key={order.id}
                                            order={order}
                                            onDelete={onDelete}
                                        />
                                    ))}
                                </AnimatePresence>
                                {colOrders.length === 0 && (
                                    <div className="flex items-center justify-center h-16 rounded-xl border border-dashed border-[rgba(15,23,42,0.10)] text-[10px] text-[rgba(11,18,32,0.30)] font-medium">
                                        Sin órdenes
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Vista móvil: acordeones apilados ─────────────────────────── */}
            <div className="flex md:hidden flex-col gap-2.5">
                {COLUMNS.map(col => (
                    <ColumnaAcordeon
                        key={col.estado}
                        col={col}
                        orders={orders.filter(o => o.estado === col.estado)}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </>
    );
}
