import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EncabezadoDetalleOrden } from '@/componentes/administracion/DetalleOrden/EncabezadoDetalleOrden';
import { ModalFactura } from '@/componentes/administracion/ModalFactura';
import type { AdminOrder } from '@/tipos';

const { emitir, modificarCliente } = vi.hoisted(() => ({
    emitir: vi.fn(),
    modificarCliente: vi.fn(),
}));
vi.mock('@/biblioteca/clienteSupabase', () => ({
    supabase: {
        functions: { invoke: emitir },
        from: (tabla: string) => ({
            update: modificarCliente,
            select: () => ({
                eq: () =>
                    tabla === 'invoices'
                        ? {
                              order: () => ({
                                  limit: () => ({ maybeSingle: async () => ({ data: null }) }),
                              }),
                          }
                        : tabla === 'clientes'
                          ? { abortSignal: () => ({ maybeSingle: async () => ({ data: null }) }) }
                          : Promise.resolve({ data: [] }),
            }),
        }),
    },
}));

const orden = {
    id: 'orden-sin-cliente',
    codigo: 'SC-PRUEBA',
    cliente_id: null,
    cliente: { id: '', nombres: 'Sin datos del cliente', created_at: '' },
    vehiculo: { placa: 'ABC1234', marca: 'Toyota', modelo: 'Corolla' },
    precio_total: 100,
    notas_publicas: 'Pintura de capó',
} as AdminOrder;

afterEach(() => {
    cleanup();
    vi.resetAllMocks();
});

describe('Factura de una orden sin contacto', () => {
    it('habilita el botón de factura y conserva el bloqueo mientras se guarda', () => {
        const abrir = vi.fn();
        const props = {
            order: orden,
            saving: false,
            onEditDetails: vi.fn(),
            onOpenInvoice: abrir,
            onDelete: vi.fn(),
        };
        const vista = render(<EncabezadoDetalleOrden {...props} />);
        fireEvent.click(screen.getByRole('button', { name: 'Abrir factura electrónica' }));
        expect(abrir).toHaveBeenCalledOnce();
        vista.rerender(<EncabezadoDetalleOrden {...props} saving />);
        expect(screen.getByRole('button', { name: 'Abrir factura electrónica' })).toBeDisabled();
    });

    it('permite completar al comprador y muestra el error concreto del servidor', async () => {
        emitir.mockResolvedValue({
            data: null,
            error: {
                message: 'Edge Function returned a non-2xx status code',
                context: Response.json(
                    { message: 'Completa la configuración de empresa.' },
                    { status: 400 }
                ),
            },
        });
        render(<ModalFactura isOpen onClose={vi.fn()} order={orden} />);
        await screen.findByLabelText('Nombre o razón social');
        expect(screen.getByLabelText('Nombre o razón social')).toHaveValue('');
        fireEvent.change(screen.getByLabelText('Documento'), { target: { value: '06' } });
        fireEvent.change(screen.getByLabelText('Número de identificación'), {
            target: { value: 'AB123' },
        });
        await waitFor(() => expect(screen.getByLabelText('Nombre o razón social')).toBeEnabled());
        fireEvent.change(screen.getByLabelText('Nombre o razón social'), {
            target: { value: 'Comprador de prueba' },
        });
        fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Loja' } });
        fireEvent.change(screen.getByLabelText('Correo para recibir la factura'), {
            target: { value: 'prueba@example.test' },
        });
        fireEvent.change(screen.getByLabelText('IVA de mano de obra'), { target: { value: '0' } });
        fireEvent.change(screen.getByLabelText('Forma de pago'), { target: { value: '01' } });
        fireEvent.click(screen.getByRole('button', { name: 'Emitir Factura al SRI' }));
        await waitFor(() => expect(emitir).toHaveBeenCalledOnce());
        expect(emitir).toHaveBeenCalledWith('sri-invoice', {
            body: expect.objectContaining({
                orden_id: orden.id,
                comprador: expect.objectContaining({
                    razon_social: 'Comprador de prueba',
                    identificacion: 'AB123',
                }),
            }),
        });
        expect(modificarCliente).not.toHaveBeenCalled();
        expect(
            await screen.findByText('Completa la configuración de empresa.')
        ).toBeInTheDocument();
    });
});
