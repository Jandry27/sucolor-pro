import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaginaNuevaOrden } from '@/paginas/administracion/PaginaNuevaOrden';

const {
    guardarOrden,
    buscarVehiculo,
    ejecutarBusqueda,
    consultarTablaVehiculos,
    buscarCliente,
    insertarCliente,
    insertarFoto,
    consultarVigencia,
    consultarPlacaExterna,
} = vi.hoisted(() => ({
    guardarOrden: vi.fn(),
    buscarVehiculo: vi.fn(),
    ejecutarBusqueda: vi.fn(),
    consultarTablaVehiculos: vi.fn(),
    buscarCliente: vi.fn(),
    insertarCliente: vi.fn(),
    insertarFoto: vi.fn(),
    consultarVigencia: vi.fn(),
    consultarPlacaExterna: vi.fn(),
}));
vi.mock('@/componentes/administracion/DisenoAdministracion', () => ({
    DisenoAdministracion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/servicios/consultarPlaca', () => ({ consultarPlacaExterna }));
vi.mock('@/biblioteca/sonidos', () => ({ sonidoOrdenCreada: vi.fn(), sonidoError: vi.fn() }));
vi.mock('@/biblioteca/clienteSupabase', () => ({
    supabase: {
        functions: { invoke: consultarVigencia },
        rpc: (nombre: string, parametros: unknown) =>
            nombre === 'buscar_vehiculo_por_placa'
                ? buscarVehiculo(parametros)
                : { single: () => guardarOrden(parametros) },
        from: (tabla: string) => {
            if (tabla === 'vehiculos')
                return {
                    select: () => ({
                        ilike: consultarTablaVehiculos,
                    }),
                };
            if (tabla === 'clientes')
                return {
                    select: () => ({ eq: () => ({ maybeSingle: buscarCliente }) }),
                    insert: insertarCliente,
                };
            if (tabla === 'media') return { insert: insertarFoto };
            return {
                select: () => ({
                    eq: () => ({
                        order: () => ({
                            limit: () => ({ abortSignal: async () => ({ data: [] }) }),
                        }),
                    }),
                }),
            };
        },
    },
}));

function pendiente<T>() {
    let resolver!: (valor: T) => void;
    const promesa = new Promise<T>(resolve => {
        resolver = resolve;
    });
    return { promesa, resolver };
}
const creada = { data: { id: 'orden-1', codigo: 'SC-001' }, error: null };

function abrirPasoVehiculo() {
    const vista = render(
        <MemoryRouter>
            <PaginaNuevaOrden />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Omitir este paso/ }));
    return vista;
}

async function prepararOrden(conFoto = false) {
    const vista = abrirPasoVehiculo();
    fireEvent.change(screen.getByPlaceholderText('ABC-1234'), { target: { value: 'ABC-1234' } });
    fireEvent.change(screen.getByPlaceholderText('Toyota'), { target: { value: 'Toyota' } });
    if (conFoto)
        fireEvent.change(vista.container.querySelector('input[type="file"]')!, {
            target: { files: [new File(['foto'], 'antes.jpg', { type: 'image/jpeg' })] },
        });
    fireEvent.click(screen.getByRole('button', { name: /^Continuar$/ }));
    return screen.findByRole('button', { name: /Crear Orden/ });
}

beforeEach(() => {
    vi.clearAllMocks();
    consultarPlacaExterna.mockReset().mockResolvedValue({ codigo: 'proveedor_no_disponible' });
    consultarVigencia.mockResolvedValue({
        data: {
            version: 1,
            producto: 'sucolor',
            fecha_inicio: '2026-01-01',
            fecha_fin: '2099-12-31',
            dias_aviso: 7,
            consultado_en: new Date().toISOString(),
        },
        error: null,
    });
    insertarFoto.mockReset().mockResolvedValue({ error: null });
    buscarVehiculo.mockReturnValue({
        abortSignal: () => ({ maybeSingle: ejecutarBusqueda }),
        maybeSingle: ejecutarBusqueda,
    });
    ejecutarBusqueda.mockReset().mockResolvedValue({
        data: { id: 'vehiculo-1', placa: 'ABC-1234', marca: 'Toyota', cliente_id: 'cliente-1' },
    });
    consultarTablaVehiculos.mockReset().mockImplementation(() => ({
        order: () => ({
            range: () => Object.assign(Promise.resolve({ data: [] }), { abortSignal: vi.fn() }),
        }),
    }));
    buscarCliente.mockResolvedValue({ data: { id: 'cliente-1', nombres: 'Ana Pérez' } });
    guardarOrden.mockReset().mockResolvedValue(creada);
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'pruebas');
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'pruebas');
    vi.stubGlobal('scrollTo', vi.fn());
    URL.createObjectURL = vi.fn(() => 'blob:foto-prueba');
    URL.revokeObjectURL = vi.fn();
});

it('impide ingresar a la creación de órdenes cuando la suscripción ya venció', async () => {
    consultarVigencia.mockResolvedValue({
        data: {
            version: 1,
            producto: 'sucolor',
            fecha_inicio: '2026-01-01',
            fecha_fin: '2026-10-29',
            dias_aviso: 7,
            consultado_en: new Date().toISOString(),
        },
        error: null,
    });
    render(
        <MemoryRouter>
            <PaginaNuevaOrden />
        </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: 'Suscripción vencida' })).toBeInTheDocument();
    expect(screen.getByText(/no puedes ingresar órdenes nuevas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver órdenes actuales' })).toBeInTheDocument();
    expect(screen.queryByText('Ingresa un vehículo al taller')).toBeNull();
    expect(guardarOrden).not.toHaveBeenCalled();
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe('Creación de órdenes sin envíos duplicados', () => {
    it('avisa si Cloudinary sube la foto pero la base de datos rechaza su registro', async () => {
        insertarFoto.mockResolvedValueOnce({ error: { message: 'Permiso denegado' } });
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ secure_url: 'https://example.com/foto.jpg' }),
            })
        );
        fireEvent.click(await prepararOrden(true));
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
        expect(
            screen.getByText(/La foto se subió, pero no se guardó en la orden: Permiso denegado/)
        ).toBeInTheDocument();
        expect(guardarOrden).toHaveBeenCalledTimes(1);
    });
    it('envía una sola orden ante clics repetidos mientras espera la respuesta', async () => {
        const respuesta = pendiente<typeof creada>();
        guardarOrden.mockReturnValue(respuesta.promesa);
        const boton = await prepararOrden();
        act(() => {
            for (let i = 0; i < 5; i++) fireEvent.click(boton);
        });
        await waitFor(() => expect(guardarOrden).toHaveBeenCalledTimes(1));
        expect(screen.getByRole('button', { name: 'Creando orden…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Volver/ })).toBeDisabled();
        await act(async () => respuesta.resolver(creada));
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
    });

    it('mantiene el bloqueo durante la subida de fotos y permite otra orden solo tras reiniciar', async () => {
        const foto = pendiente<Response>();
        vi.stubGlobal(
            'fetch',
            vi.fn(() => foto.promesa)
        );
        const boton = await prepararOrden(true);
        fireEvent.click(boton);
        const subiendo = await screen.findByRole('button', { name: 'Subiendo fotos…' });
        for (let i = 0; i < 5; i++) fireEvent.click(subiendo);
        expect(subiendo).toBeDisabled();
        expect(guardarOrden).toHaveBeenCalledTimes(1);
        await act(async () =>
            foto.resolver({
                ok: true,
                json: async () => ({ secure_url: 'https://example.com/foto.jpg' }),
            } as Response)
        );
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /^Nueva orden$/ }));
        expect(screen.getByRole('button', { name: /Omitir este paso/ })).toBeEnabled();
    });

    it.each(['respuesta', 'excepcion'])(
        'libera el formulario tras un error de %s y permite reintentar',
        async tipo => {
            if (tipo === 'respuesta')
                guardarOrden.mockResolvedValueOnce({
                    data: null,
                    error: { message: 'Servicio no disponible' },
                });
            else guardarOrden.mockRejectedValueOnce(new Error('Servicio no disponible'));
            fireEvent.click(await prepararOrden());
            expect(
                await screen.findByText(/Error al crear la orden: Servicio no disponible/)
            ).toBeInTheDocument();
            const reintentar = screen.getByRole('button', { name: /Crear Orden/ });
            expect(reintentar).toBeEnabled();
            fireEvent.click(reintentar);
            expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
            expect(guardarOrden).toHaveBeenCalledTimes(2);
        }
    );
});

describe('Órdenes sin contactos ficticios', () => {
    it('registra vehículo y orden sin insertar un cliente al omitir sus datos', async () => {
        ejecutarBusqueda.mockResolvedValue({ data: null });
        fireEvent.click(await prepararOrden());
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
        expect(insertarCliente).not.toHaveBeenCalled();
        expect(guardarOrden).toHaveBeenCalledWith(
            expect.objectContaining({
                p_vehiculo: expect.objectContaining({ placa: 'ABC1234', marca: 'Toyota' }),
                p_orden: expect.objectContaining({ cliente_id: null }),
            })
        );
    });

    it('reutiliza la ficha encontrada por placa y solo envía las ediciones manuales', async () => {
        ejecutarBusqueda.mockResolvedValue({
            data: {
                id: 'vehiculo-1',
                placa: 'abc-1234',
                marca: 'Toyota',
                modelo: 'Corolla',
                cliente_id: null,
            },
        });
        abrirPasoVehiculo();
        fireEvent.change(screen.getByLabelText('Placa *'), { target: { value: 'ABC1234' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar placa' }));
        await screen.findByText('Vehículo registrado en el taller.');
        expect(screen.getByLabelText('Modelo')).toHaveValue('Corolla');
        expect(screen.queryByText('Pegar resultado')).toBeNull();
        fireEvent.change(screen.getByLabelText('Modelo'), { target: { value: 'Corolla Cross' } });
        fireEvent.click(screen.getByRole('button', { name: /^Continuar$/ }));
        expect(guardarOrden).not.toHaveBeenCalled();
        fireEvent.click(await screen.findByRole('button', { name: /Crear Orden/ }));
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
        expect(insertarCliente).not.toHaveBeenCalled();
        expect(guardarOrden).toHaveBeenCalledWith(
            expect.objectContaining({
                p_vehiculo_editado: 'vehiculo-1',
                p_vehiculo: expect.objectContaining({ modelo: 'Corolla Cross' }),
                p_ediciones: { modelo: true },
                p_orden: expect.objectContaining({ cliente_id: null }),
            })
        );
    });

    it('no arrastra un cliente anónimo antiguo a una orden nueva', async () => {
        buscarCliente.mockResolvedValue({
            data: { id: 'cliente-1', nombres: 'Cliente Anónimo (Placa: ABC-1234)' },
        });
        fireEvent.click(await prepararOrden());
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
        expect(guardarOrden).toHaveBeenCalledWith(
            expect.objectContaining({ p_orden: expect.objectContaining({ cliente_id: null }) })
        );
        expect(insertarCliente).not.toHaveBeenCalled();
    });

    it('conserva el propietario conocido aunque no tenga teléfono', async () => {
        fireEvent.click(await prepararOrden());
        expect(await screen.findByText('¡Orden creada!')).toBeInTheDocument();
        expect(guardarOrden).toHaveBeenCalledWith(
            expect.objectContaining({
                p_orden: expect.objectContaining({ cliente_id: 'cliente-1' }),
            })
        );
    });
});

describe('Búsqueda de placas', () => {
    it.each(['LAA1362', 'LAA-1362', 'laa1362'])(
        'busca %s con Enter y aplica el resultado público sin sobrescribir la marca',
        async placa => {
            ejecutarBusqueda.mockResolvedValue({ data: null, error: null });
            abrirPasoVehiculo();
            const entrada = screen.getByLabelText('Placa *');
            fireEvent.change(entrada, { target: { value: placa } });
            fireEvent.change(screen.getByLabelText('Marca *'), {
                target: { value: 'Hyundai revisado' },
            });
            expect(buscarVehiculo).not.toHaveBeenCalled();
            expect(fireEvent.keyDown(entrada, { key: 'Enter' })).toBe(false);
            fireEvent.keyDown(entrada, { key: 'Enter' });
            expect(buscarVehiculo).toHaveBeenCalledTimes(1);
            expect(buscarVehiculo).toHaveBeenCalledWith({ p_placa: 'LAA1362' });
            await screen.findByText(/Placa nueva para el taller/);
            expect(screen.getByRole('link', { name: /Copiar placa/ })).toHaveAttribute(
                'target',
                '_blank'
            );
            fireEvent.click(screen.getByRole('button', { name: 'Pegar resultado' }));
            fireEvent.change(screen.getByLabelText('Resultado de Consultas Ecuador'), {
                target: {
                    value: 'Placa\nLAA1362\nMarca\nHYUNDAI\nModelo\nACCENT TM 1.4 4P 4X2 STD\nAño\n2013',
                },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Aplicar resultado' }));
            expect(screen.getByLabelText('Marca *')).toHaveValue('Hyundai revisado');
            expect(screen.getByLabelText('Modelo')).toHaveValue('ACCENT TM 1.4 4P 4X2 STD');
            expect(screen.getByLabelText('Año')).toHaveValue('2013');
            expect(
                consultarVigencia.mock.calls.every(([nombre]) => nombre === 'aviso-suscripcion')
            ).toBe(true);
            expect(guardarOrden).not.toHaveBeenCalled();
        }
    );

    it('completa la ficha con la API sin abrir otra pestaña y conserva el color manual', async () => {
        ejecutarBusqueda.mockResolvedValue({ data: null });
        consultarPlacaExterna.mockResolvedValue({
            marca: 'HYUNDAI',
            modelo: 'ELANTRA 4P 1.6 TM',
            anio: '2009',
        });
        abrirPasoVehiculo();
        fireEvent.change(screen.getByLabelText('Placa *'), { target: { value: 'PBL-9929' } });
        fireEvent.change(screen.getByLabelText('Color'), { target: { value: 'Gris' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar placa' }));
        await screen.findByText(/Datos encontrados/);
        expect(consultarPlacaExterna).toHaveBeenCalledWith('PBL9929', expect.any(AbortSignal));
        expect(screen.getByLabelText('Marca *')).toHaveValue('HYUNDAI');
        expect(screen.getByLabelText('Modelo')).toHaveValue('ELANTRA 4P 1.6 TM');
        expect(screen.getByLabelText('Año')).toHaveValue('2009');
        expect(screen.getByLabelText('Color')).toHaveValue('Gris');
        expect(screen.queryByRole('button', { name: 'Pegar resultado' })).toBeNull();
        expect(guardarOrden).not.toHaveBeenCalled();
    });

    it('busca en la tabla autenticada si la función todavía no está instalada', async () => {
        ejecutarBusqueda.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
        consultarTablaVehiculos.mockReturnValue({
            order: () => ({
                range: () =>
                    Object.assign(
                        Promise.resolve({
                            data: [
                                { id: 'otro', placa: 'PBL99299', marca: 'Otra marca' },
                                { id: 'exacto', placa: 'pbl -9929', marca: 'Hyundai' },
                            ],
                        }),
                        { abortSignal: vi.fn() }
                    ),
            }),
        });
        abrirPasoVehiculo();
        fireEvent.change(screen.getByLabelText('Placa *'), { target: { value: 'PBL-9929' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar placa' }));
        await screen.findByText('Vehículo registrado en el taller.');
        expect(consultarTablaVehiculos).toHaveBeenCalledWith('placa', '%P%B%L%9%9%2%9%');
        expect(screen.getByLabelText('Marca *')).toHaveValue('Hyundai');
        expect(consultarPlacaExterna).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: 'Pegar resultado' })).toBeNull();
    });

    it('tras un error del taller autocompleta al pegar el resultado de PBL-9929', async () => {
        ejecutarBusqueda.mockResolvedValue({ data: null, error: { code: '08006' } });
        abrirPasoVehiculo();
        fireEvent.change(screen.getByLabelText('Placa *'), { target: { value: 'PBL-9929' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar placa' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Pegar resultado' }));
        fireEvent.paste(screen.getByLabelText('Resultado de Consultas Ecuador'), {
            clipboardData: {
                getData: () =>
                    'Datos Vehículo\nPlaca\tPBL9929\nPlaca anterior\nMarca\tHYUNDAI\nModelo\tELANTRA 4P 1.6 TM\nAño\t2009\nClase\tAUTOMOVIL',
            },
        });
        expect(screen.getByLabelText('Marca *')).toHaveValue('HYUNDAI');
        expect(screen.getByLabelText('Modelo')).toHaveValue('ELANTRA 4P 1.6 TM');
        expect(screen.getByLabelText('Año')).toHaveValue('2009');
        expect(guardarOrden).not.toHaveBeenCalled();
    });

    it('rechaza el texto de otra placa y permite aplicar un resultado parcial', async () => {
        ejecutarBusqueda.mockResolvedValue({ data: null });
        abrirPasoVehiculo();
        fireEvent.change(screen.getByLabelText('Placa *'), { target: { value: 'LAA1362' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar placa' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Pegar resultado' }));
        const entrada = screen.getByLabelText('Resultado de Consultas Ecuador');
        const aplicar = screen.getByRole('button', { name: 'Aplicar resultado' });

        fireEvent.change(entrada, { target: { value: 'Placa: ABC1234\nMarca: Toyota' } });
        fireEvent.click(aplicar);
        expect(screen.getByRole('status')).toHaveTextContent(
            'El resultado corresponde a otra placa.'
        );
        expect(screen.getByLabelText('Marca *')).toHaveValue('');

        fireEvent.change(entrada, {
            target: { value: 'Placa: LAA-1362\nMarca: HYUNDAI\nModelo\nColor: Plata' },
        });
        fireEvent.click(aplicar);
        expect(screen.getByRole('status')).toHaveTextContent('Resultado parcial');
        expect(screen.getByLabelText('Marca *')).toHaveValue('HYUNDAI');
        expect(screen.getByLabelText('Modelo')).toHaveValue('');
        expect(screen.getByLabelText('Año')).toHaveValue('');
    });

    it('descarta la primera ficha si la placa cambia mientras se busca', async () => {
        const respuesta = pendiente<{ data: { id: string; placa: string; marca: string } }>();
        ejecutarBusqueda
            .mockReturnValueOnce(respuesta.promesa)
            .mockResolvedValueOnce({ data: null });
        abrirPasoVehiculo();
        const entrada = screen.getByLabelText('Placa *');
        fireEvent.change(entrada, { target: { value: 'ABC1234' } });
        fireEvent.keyDown(entrada, { key: 'Enter' });
        fireEvent.change(entrada, { target: { value: 'LAA1362' } });
        fireEvent.keyDown(entrada, { key: 'Enter' });
        await screen.findByText(/Placa nueva para el taller/);
        await act(async () =>
            respuesta.resolver({ data: { id: 'viejo', placa: 'ABC1234', marca: 'Toyota' } })
        );
        expect(screen.getByLabelText('Marca *')).toHaveValue('');
        expect(screen.getByText(/Placa nueva para el taller/)).toBeInTheDocument();
    });

    it('permite continuar a mano cuando el portal externo se queda sin respuesta', async () => {
        ejecutarBusqueda.mockResolvedValue({ data: null });
        abrirPasoVehiculo();
        fireEvent.change(screen.getByLabelText('Placa *'), { target: { value: 'LAA1362' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar placa' }));
        await screen.findByRole('link', { name: /Copiar placa/ });
        fireEvent.click(screen.getByRole('button', { name: 'Pegar resultado' }));
        fireEvent.change(screen.getByLabelText('Resultado de Consultas Ecuador'), {
            target: { value: 'El servicio no responde' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Aplicar resultado' }));
        expect(screen.getByRole('status')).toHaveTextContent('No encontramos marca, modelo ni año');
        fireEvent.change(screen.getByLabelText('Marca *'), { target: { value: 'Hyundai' } });
        fireEvent.click(screen.getByRole('button', { name: /^Continuar$/ }));
        expect(await screen.findByRole('button', { name: /Crear Orden/ })).toBeEnabled();
        expect(guardarOrden).not.toHaveBeenCalled();
    });
});
