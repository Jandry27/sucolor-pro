import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaginaFacturas } from '@/paginas/administracion/PaginaFacturas';

const { buscar, externa, abrirFactura } = vi.hoisted(() => ({
    buscar: vi.fn(),
    externa: vi.fn(),
    abrirFactura: vi.fn(),
}));
vi.mock('@/componentes/administracion/DisenoAdministracion', () => ({
    DisenoAdministracion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/componentes/administracion/reportes/ReporteFacturas', () => ({
    ReporteFacturas: () => <p>Historial disponible</p>,
}));
vi.mock('@/componentes/administracion/ModalFactura', () => ({
    ModalFactura: (props: { isOpen: boolean }) => {
        if (props.isOpen) abrirFactura(props);
        return props.isOpen ? <p>Revisión de factura</p> : null;
    },
}));
vi.mock('@/servicios/consultarPlaca', () => ({ consultarPlacaExterna: externa }));
vi.mock('@/biblioteca/clienteSupabase', () => ({
    supabase: { rpc: buscar },
}));
afterEach(() => {
    cleanup();
    vi.resetAllMocks();
});

it('prepara una factura sin orden, con varios conceptos e IVA por concepto', () => {
    render(<PaginaFacturas />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva factura' }));
    fireEvent.click(screen.getByLabelText('Incluir vehículo'));
    fireEvent.change(screen.getByLabelText('Descripción'), {
        target: { value: 'Cambio de color' },
    });
    fireEvent.change(screen.getByLabelText('Importe sin IVA ($)'), { target: { value: '350' } });
    fireEvent.change(screen.getByLabelText('IVA'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir concepto' }));
    fireEvent.change(screen.getAllByLabelText('Descripción')[1], { target: { value: 'Repuesto' } });
    fireEvent.change(screen.getAllByLabelText('Importe sin IVA ($)')[1], {
        target: { value: '20' },
    });
    fireEvent.change(screen.getAllByLabelText('IVA')[1], { target: { value: '15' } });
    expect(screen.getByText('Total $373.00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Datos del comprador y revisión' }));
    expect(abrirFactura).toHaveBeenLastCalledWith(
        expect.objectContaining({
            facturaLibre: {
                guardarVehiculo: false,
                vehiculo: undefined,
                items: [
                    expect.objectContaining({
                        descripcion: 'Cambio de color',
                        precio_total_sin_impuestos: 350,
                        tarifa_iva: 0,
                    }),
                    expect.objectContaining({
                        descripcion: 'Repuesto',
                        precio_total_sin_impuestos: 20,
                        tarifa_iva: 15,
                    }),
                ],
            },
        })
    );
    expect(buscar).not.toHaveBeenCalled();
    expect(externa).not.toHaveBeenCalled();
});

it('reutiliza el vehículo de SuColor y conserva sus datos sin gastar consultas externas', async () => {
    buscar.mockReturnValue({
        abortSignal: () => ({
            maybeSingle: async () => ({
                data: { marca: 'Toyota', modelo: 'Corolla', anio: 2020, color: 'Rojo' },
            }),
        }),
    });
    render(<PaginaFacturas />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva factura' }));
    fireEvent.change(screen.getByLabelText('Placa'), { target: { value: 'abc-1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar placa' }));
    await waitFor(() => expect(screen.getByLabelText('Marca')).toHaveValue('Toyota'));
    expect(buscar).toHaveBeenCalledWith('buscar_vehiculo_por_placa', { p_placa: 'ABC1234' });
    expect(externa).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Modelo')).toHaveValue('Corolla');
    expect(screen.getByLabelText('Año')).toHaveValue('2020');
});

it('rechaza los conceptos incompletos antes de preparar una factura', () => {
    render(<PaginaFacturas />);
    fireEvent.click(screen.getByRole('button', { name: 'Nueva factura' }));
    fireEvent.click(screen.getByRole('button', { name: 'Datos del comprador y revisión' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Completa el importe');
    expect(abrirFactura).not.toHaveBeenCalled();
});
