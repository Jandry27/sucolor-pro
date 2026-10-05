import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { FormularioBusqueda } from '@/componentes/FormularioBusqueda';

const mockSearch = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/ganchos/useBusquedaOrden', () => ({
    useBusquedaOrden: vi.fn(() => ({
        loading: false,
        error: null,
        search: mockSearch,
        reset: vi.fn(),
        result: null,
    })),
}));

vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: () => mockNavigate };
});

const renderForm = () =>
    render(
        <MemoryRouter>
            <FormularioBusqueda />
        </MemoryRouter>
    );

describe('FormularioBusqueda', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renderiza el campo de placa', () => {
        renderForm();
        expect(screen.getByPlaceholderText('Ej. LAA-1362')).toBeInTheDocument();
    });

    it('renderiza el botón de envío', () => {
        renderForm();
        expect(screen.getByRole('button', { name: /consultar/i })).toBeInTheDocument();
    });

    it('limita la placa a 10 caracteres', () => {
        renderForm();
        expect(screen.getByPlaceholderText('Ej. LAA-1362')).toHaveAttribute('maxLength', '10');
    });

    it('no permite enviar sin placa', () => {
        renderForm();
        const button = screen.getByRole('button', { name: /consultar/i });
        expect(button).toBeDisabled();
        expect(mockSearch).not.toHaveBeenCalled();
    });

    it('envía la placa normalizada', async () => {
        mockSearch.mockResolvedValueOnce({ ok: false });
        renderForm();

        const placa = screen.getByPlaceholderText('Ej. LAA-1362');
        await userEvent.type(placa, 'laa1362');

        fireEvent.submit(placa.closest('form')!);

        await waitFor(() =>
            expect(mockSearch).toHaveBeenCalledWith({
                placa: 'LAA1362',
            })
        );
    });

    it('navega al seguimiento cuando la búsqueda tiene éxito', async () => {
        mockSearch.mockResolvedValueOnce({ ok: true, codigo: 'SC-0001', token: 'tok-abc123' });
        renderForm();

        const placa = screen.getByPlaceholderText('Ej. LAA-1362');
        await userEvent.type(placa, 'ABC1234');
        fireEvent.submit(placa.closest('form')!);

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/track/SC-0001?token=tok-abc123')
        );
    });

    it('no navega cuando la búsqueda falla', async () => {
        mockSearch.mockResolvedValueOnce({ ok: false });
        renderForm();

        const placa = screen.getByPlaceholderText('Ej. LAA-1362');
        await userEvent.type(placa, 'ABC1234');
        fireEvent.submit(placa.closest('form')!);

        await waitFor(() => expect(mockSearch).toHaveBeenCalled());
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('muestra el mensaje de error cuando el hook reporta un error', async () => {
        const { useBusquedaOrden } = await import('@/ganchos/useBusquedaOrden');
        (useBusquedaOrden as ReturnType<typeof vi.fn>).mockReturnValue({
            loading: false,
            error: 'No se encontró una orden activa para esa placa.',
            search: mockSearch,
            reset: vi.fn(),
            result: null,
        });

        renderForm();
        expect(screen.getByText('No se encontró una orden activa para esa placa.')).toBeInTheDocument();
    });

    it('muestra estado de carga mientras busca', async () => {
        const { useBusquedaOrden } = await import('@/ganchos/useBusquedaOrden');
        (useBusquedaOrden as ReturnType<typeof vi.fn>).mockReturnValue({
            loading: true,
            error: null,
            search: mockSearch,
            reset: vi.fn(),
            result: null,
        });

        renderForm();
        expect(screen.getByText(/buscando/i)).toBeInTheDocument();
    });

    it('el botón está deshabilitado durante la carga', async () => {
        const { useBusquedaOrden } = await import('@/ganchos/useBusquedaOrden');
        (useBusquedaOrden as ReturnType<typeof vi.fn>).mockReturnValue({
            loading: true,
            error: null,
            search: mockSearch,
            reset: vi.fn(),
            result: null,
        });

        renderForm();
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
