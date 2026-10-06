import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReporteFacturas } from '@/componentes/administracion/reportes/ReporteFacturas';
import {
    compradorFactura,
    fechaFactura,
    htmlFacturaArchivada,
    leerComprobante,
    type FacturaHistorial,
} from '@/biblioteca/historialFacturas';

const { consultar, llamadas } = vi.hoisted(() => ({
    consultar: vi.fn(),
    llamadas: [] as unknown[][],
}));
vi.mock('@/biblioteca/clienteSupabase', () => ({
    supabase: {
        from: () => {
            const cadena: Record<string, unknown> = {};
            for (const metodo of ['select', 'order', 'eq', 'gte', 'lt', 'or', 'range']) {
                cadena[metodo] = (...args: unknown[]) => {
                    llamadas.push([metodo, ...args]);
                    return cadena;
                };
            }
            cadena.abortSignal = () => consultar();
            return cadena;
        },
    },
}));
const factura: FacturaHistorial = {
    id: 'historica',
    orden_id: 'orden',
    secuencial: '001-001-000000050',
    clave_acceso: '1234',
    estado: 'AUTORIZADA',
    ambiente: 2,
    fecha_emision: '2026-10-06T03:00:00Z',
    autorizacion_fecha: null,
    importe_total: 115,
    xml_generado:
        '<factura><infoTributaria><razonSocial>Emisor histórico</razonSocial><ruc>123</ruc></infoTributaria><infoFactura><fechaEmision>05/10/2026</fechaEmision><razonSocialComprador>Comprador histórico &amp; Hijos</razonSocialComprador><identificacionComprador>0000000001</identificacionComprador><totalSinImpuestos>100.00</totalSinImpuestos><importeTotal>115.00</importeTotal><totalConImpuestos><totalImpuesto><codigo>2</codigo><codigoPorcentaje>4</codigoPorcentaje><baseImponible>100.00</baseImponible><valor>15.00</valor></totalImpuesto></totalConImpuestos></infoFactura><detalles><detalle><descripcion>Trabajo original</descripcion><cantidad>1</cantidad><precioUnitario>100.00</precioUnitario><precioTotalSinImpuesto>100.00</precioTotalSinImpuesto></detalle></detalles></factura>',
};
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    llamadas.length = 0;
});
const montar = () =>
    render(
        <MemoryRouter>
            <ReporteFacturas />
        </MemoryRouter>
    );

describe('Historial de facturas', () => {
    it('conserva emisor, comprador, detalles e importes del XML histórico', () => {
        expect(compradorFactura(factura).nombre).toBe('Comprador histórico & Hijos');
        const html = htmlFacturaArchivada(factura);
        for (const dato of [
            'Emisor histórico',
            'Comprador histórico &amp; Hijos',
            'Trabajo original',
            '115.00',
            '15.00',
        ])
            expect(html).toContain(dato);
        expect(fechaFactura(factura.fecha_emision)).toBe('5/10/2026');
    });
    it('rechaza XML inválido y escapa contenido en el comprobante', () => {
        expect(leerComprobante('<factura>')).toBeNull();
        expect(() => htmlFacturaArchivada({ ...factura, xml_generado: null })).toThrow();
        expect(
            htmlFacturaArchivada({
                ...factura,
                xml_generado: (factura.xml_generado || '').replace(
                    'Trabajo original',
                    '&lt;img src=x onerror=alert(1)&gt;'
                ),
            })
        ).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });
    it('consulta páginas del servidor y busca fuera de la página visible', async () => {
        consultar.mockResolvedValue({ data: [factura], count: 26, error: null });
        montar();
        await screen.findByText('Comprador histórico & Hijos');
        fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
        await waitFor(() => expect(llamadas).toContainEqual(['range', 25, 49]));
        fireEvent.change(screen.getByPlaceholderText(/Número, nombre/), {
            target: { value: '0000000001' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
        await waitFor(() =>
            expect(llamadas).toContainEqual([
                'or',
                'secuencial.ilike."%0000000001%",clave_acceso.ilike."%0000000001%",xml_generado.ilike."%0000000001%"',
            ])
        );
        expect(llamadas.filter(l => l[0] === 'range').slice(-1)[0]).toEqual(['range', 0, 24]);
    });
    it('incluye el día final completo en Ecuador y filtra estado y ambiente', async () => {
        consultar.mockResolvedValue({ data: [], count: 0, error: null });
        montar();
        await screen.findByText('No hay facturas para estos filtros.');
        fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-06' } });
        fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'AUTORIZADA' } });
        fireEvent.change(screen.getByLabelText('Ambiente'), { target: { value: '2' } });
        await waitFor(() =>
            expect(llamadas).toContainEqual(['lt', 'fecha_emision', '2026-10-07T05:00:00.000Z'])
        );
        expect(llamadas).toContainEqual(['eq', 'estado', 'AUTORIZADA']);
        expect(llamadas).toContainEqual(['eq', 'ambiente', 2]);
    });
    it('no presenta fallos de carga como un historial vacío y permite reintentar', async () => {
        consultar
            .mockResolvedValueOnce({ error: { message: 'sin conexión' } })
            .mockResolvedValue({ data: [factura], count: 1 });
        montar();
        expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar');
        expect(screen.queryByText('No hay facturas para estos filtros.')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
        await screen.findByText('Comprador histórico & Hijos');
    });
    it('descarta respuestas anteriores cuando cambia el filtro', async () => {
        let resolver!: (valor: unknown) => void;
        consultar
            .mockReturnValueOnce(
                new Promise(resolve => {
                    resolver = resolve;
                })
            )
            .mockResolvedValue({ data: [], count: 0 });
        montar();
        fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'RECHAZADA' } });
        await screen.findByText('No hay facturas para estos filtros.');
        resolver({ data: [factura], count: 1 });
        await waitFor(() =>
            expect(screen.queryByText('Comprador histórico & Hijos')).not.toBeInTheDocument()
        );
    });
    it('abre la factura seleccionada y no ofrece un RIDE autorizado para rechazadas', async () => {
        consultar.mockResolvedValue({ data: [{ ...factura, estado: 'RECHAZADA' }], count: 1 });
        montar();
        fireEvent.click(
            await screen.findByRole('button', { name: `Ver factura ${factura.secuencial}` })
        );
        expect(screen.getByText(/no consta como autorizado/)).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Imprimir / Guardar PDF' })
        ).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ver orden' })).toHaveAttribute(
            'href',
            '/administracion/orders/orden'
        );
    });
});
