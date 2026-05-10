import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { InvoiceModal } from '@/components/admin/InvoiceModal';
import { GastosPanel } from '@/components/admin/GastosPanel';
import { PaymentPanel } from '@/components/admin/PaymentPanel';
import { PhotoUploadPanel } from '@/components/admin/PhotoUploadPanel';
import { OrderDetailHeader } from '@/components/admin/OrderDetail/OrderDetailHeader';
import { OrderDetailEditForm } from '@/components/admin/OrderDetail/OrderDetailEditForm';
import { OrderDetailStatusCard } from '@/components/admin/OrderDetail/OrderDetailStatusCard';
import { OrderDetailNotesCard } from '@/components/admin/OrderDetail/OrderDetailNotesCard';
import { useAdminOrder } from '@/hooks/useAdminOrder';

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        order,
        loading,
        saving,
        error,
        precioTotal,
        montoPagado,
        setPrecioTotal,
        setMontoPagado,
        updateEstado,
        toggleShare,
        deleteOrder,
        updateDetails,
        updateNotes,
        addNoteEntry,
        updatePaymentFields,
    } = useAdminOrder(id);

    const handleDelete = async () => {
        if (
            !window.confirm(
                '¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.'
            )
        )
            return;
        const success = await deleteOrder();
        if (success) navigate('/admin/orders');
        else alert('Asegúrese de eliminar primero los pagos y las fotos asociadas a la orden.');
    };

    const handleCopyLink = () => {
        if (!order?.share_token) return;
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/admin.*/, '');
        navigator.clipboard.writeText(
            `${baseUrl}#/track/${order.codigo}?token=${order.share_token}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const trackUrl = order?.share_token
        ? `${window.location.origin}${window.location.pathname.replace(/\/admin.*/, '')}#/track/${order.codigo}?token=${order.share_token}`
        : null;

    if (loading)
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-7 h-7 text-[#FF5100] animate-spin" />
                </div>
            </AdminLayout>
        );

    if (error || !order)
        return (
            <AdminLayout>
                <div className="glass-card flex flex-col items-center justify-center py-16 gap-3 max-w-sm mx-auto">
                    <AlertTriangle className="w-10 h-10 text-[#EF4444]" />
                    <p className="text-sm text-[rgba(15,23,42,0.60)] text-center">
                        {error || 'No se encontró la orden'}
                    </p>
                    <button onClick={() => navigate(-1)} className="btn-secondary text-sm">
                        Volver
                    </button>
                </div>
            </AdminLayout>
        );

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1.5 text-sm text-[rgba(11,18,32,0.45)] hover:text-[#FF5100] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al dashboard
                </button>

                {/* Header Card */}
                <motion.div
                    className="glass-card"
                    style={{ padding: '20px' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {isEditingDetails ? (
                        <OrderDetailEditForm
                            order={order}
                            saving={saving}
                            onSave={async updates => {
                                await updateDetails(updates);
                                setIsEditingDetails(false);
                            }}
                            onCancel={() => setIsEditingDetails(false)}
                        />
                    ) : (
                        <OrderDetailHeader
                            order={order}
                            saving={saving}
                            onEditDetails={() => setIsEditingDetails(true)}
                            onOpenInvoice={() => setIsInvoiceModalOpen(true)}
                            onDelete={handleDelete}
                        />
                    )}
                </motion.div>

                {/* Status + Share Card */}
                <OrderDetailStatusCard
                    orden={order}
                    saving={saving}
                    onUpdateEstado={updateEstado}
                    onToggleShare={toggleShare}
                    onCopyLink={handleCopyLink}
                    copied={copied}
                    trackUrl={trackUrl}
                />

                {/* Notes / Bitácora Card */}
                <OrderDetailNotesCard
                    order={order}
                    saving={saving}
                    onAddEntry={addNoteEntry}
                    onUpdateFull={updateNotes}
                />

                {/* Gastos y Repuestos */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                >
                    <GastosPanel ordenId={order.id} />
                </motion.div>

                {/* Pagos */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <PaymentPanel
                        ordenId={order.id}
                        precioTotal={precioTotal}
                        montoPagado={montoPagado}
                        notasInternas={order.notas_internas}
                        onUpdate={fields => {
                            updatePaymentFields(fields);
                            if (fields.precio_total !== undefined)
                                setPrecioTotal(fields.precio_total);
                            if (fields.monto_pagado !== undefined)
                                setMontoPagado(fields.monto_pagado);
                        }}
                    />
                </motion.div>

                {/* Fotos */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <PhotoUploadPanel ordenId={order.id} ordCodigo={order.codigo} />
                </motion.div>
            </div>

            <InvoiceModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                order={order}
            />
        </AdminLayout>
    );
}
