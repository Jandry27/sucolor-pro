import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginaNuevaOrden } from '@/paginas/administracion/PaginaNuevaOrden';

const { insertarOrden, guardarOrden } = vi.hoisted(() => ({
    insertarOrden: vi.fn(),
    guardarOrden: vi.fn(),
}));
vi.mock('@/componentes/administracion/DisenoAdministracion', () => ({
    DisenoAdministracion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/biblioteca/sonidos', () => ({ sonidoOrdenCreada: vi.fn(), sonidoError: vi.fn() }));
vi.mock('@/biblioteca/clienteSupabase', () => ({
    supabase: { from: (tabla: string) => {
        if (tabla === 'vehiculos') return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({
                data: { id: 'vehiculo-1', placa: 'ABC-1234', marca: 'Toyota', cliente_id: 'cliente-1' },
            }) }) }),
        };
        if (tabla === 'media') return { insert: async () => ({ error: null }) };
        return {
            insert: insertarOrden,
            select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [] }) }) }) }),
        };
    } },
}));

function pendiente<T>() {
    let resolver!: (valor: T) => void;
    const promesa = new Promise<T>(resolve => { resolver = resolve; });
    return { promesa, resolver };
}
const creada = { data: { id: 'orden-1', codigo: 'SC-001' }, error: null };

async function prepararOrden(conFoto = false) {
    const vista = render(<MemoryRouter><PaginaNuevaOrden /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /Omitir este paso/ }));
    fireEvent.change(screen.getByPlaceholderText('ABC-1234'), { target: { value: 'ABC-1234' } });
    fireEvent.change(screen.getByPlaceholderText('Toyota'), { target: { value: 'Toyota' } });
    if (conFoto) fireEvent.change(vista.container.querySelector('input[type="file"]')!, {
        target: { files: [new File(['foto'], 'antes.jpg', { type: 'image/jpeg' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Continuar$/ }));
    return screen.findByRole('button', { name: /Crear Orden/ });
}

beforeEach(() => {
    vi.clearAllMocks();
    guardarOrden.mockReset().mockResolvedValue(creada);
    insertarOrden.mockImplementation(() => ({ select: () => ({ single: guardarOrden }) }));
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'pruebas');
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'pruebas');
    URL.createObjectURL = vi.fn(() => 'blob:foto-prueba');
    URL.revokeObjectURL = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Creación de órdenes sin envíos duplicados', () => {
    it('envía una sola orden ante clics repetidos mientras espera la respuesta', async () => {
        const respuesta = pendiente<typeof creada>();
        guardarOrden.mockReturnValue(respuesta.promesa);
        const boton = await prepararOrden();
        act(() => { for (let i = 0; i < 5; i++) fireEvent.click(boton); });
        expect(insertarOrden).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('button', { name: 'Creando orden…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Volver/ })).toBeDisabled();
        await act(async () => respuesta.resolver(creada));
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
    });

    it('mantiene el bloqueo durante la subida de fotos y permite otra orden solo tras reiniciar', async () => {
        const foto = pendiente<Response>();
        vi.stubGlobal('fetch', vi.fn(() => foto.promesa));
        const boton = await prepararOrden(true);
        fireEvent.click(boton);
        const subiendo = await screen.findByRole('button', { name: 'Subiendo fotos…' });
        for (let i = 0; i < 5; i++) fireEvent.click(subiendo);
        expect(subiendo).toBeDisabled();
        expect(insertarOrden).toHaveBeenCalledTimes(1);
        await act(async () => foto.resolver({ ok: true, json: async () => ({ secure_url: 'https://example.com/foto.jpg' }) } as Response));
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /^Nueva orden$/ }));
        expect(screen.getByRole('button', { name: /Omitir este paso/ })).toBeEnabled();
    });

    it.each(['respuesta', 'excepcion'])('libera el formulario tras un error de %s y permite reintentar', async tipo => {
        if (tipo === 'respuesta') guardarOrden.mockResolvedValueOnce({ data: null, error: { message: 'Servicio no disponible' } });
        else guardarOrden.mockRejectedValueOnce(new Error('Servicio no disponible'));
        fireEvent.click(await prepararOrden());
        expect(await screen.findByText(/Error al crear la orden: Servicio no disponible/)).toBeInTheDocument();
        const reintentar = screen.getByRole('button', { name: /Crear Orden/ });
        expect(reintentar).toBeEnabled();
        fireEvent.click(reintentar);
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
        expect(insertarOrden).toHaveBeenCalledTimes(2);
    });
});
