import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { FormularioBusqueda } from '@/componentes/FormularioBusqueda';

// ─── Mocks ────────────────────────────────────────────────────────────────────
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

// ─── Helper ───────────────────────────────────────────────────────────────────
const renderForm = () => render(<MemoryRouter><FormularioBusqueda /></MemoryRouter>);

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('FormularioBusqueda', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renderiza el campo de texto con placeholder correcto', () => {
        renderForm();
        expect(screen.getByPlaceholderText('Ej. LAA-1362')).toBeInTheDocument();
    });

    it('renderiza el botón de envío', () => {
        renderForm();
        expect(screen.getByRole('button', { name: /consultar estado/i })).toBeInTheDocument();
    });

    it('el input respeta maxLength de 10 caracteres', () => {
        renderForm();
        const input = screen.getByPlaceholderText('Ej. LAA-1362');
        expect(input).toHaveAttribute('maxLength', '10');
    });

    it('no llama a search si el campo está vacío', () => {
        renderForm();
        const button = screen.getByRole('button', { name: /consultar estado/i });
        fireEvent.click(button);
        expect(mockSearch).not.toHaveBeenCalled();
    });

    it('llama a search con la placa en mayúsculas al enviar', async () => {
        mockSearch.mockResolvedValueOnce({ ok: false });
        renderForm();

        const input = screen.getByPlaceholderText('Ej. LAA-1362');
        await userEvent.type(input, 'laa1362');

        fireEvent.submit(input.closest('form')!);

        await waitFor(() =>
            expect(mockSearch).toHaveBeenCalledWith({ placa: 'LAA1362' })
        );
    });

    it('navega a /track/:codigo?token=... cuando la búsqueda tiene éxito', async () => {
        mockSearch.mockResolvedValueOnce({ ok: true, codigo: 'SC-0001', token: 'tok-abc123' });
        renderForm();

        const input = screen.getByPlaceholderText('Ej. LAA-1362');
        await userEvent.type(input, 'ABC1234');

        fireEvent.submit(input.closest('form')!);

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/track/SC-0001?token=tok-abc123')
        );
    });

    it('no navega cuando la búsqueda falla', async () => {
        mockSearch.mockResolvedValueOnce({ ok: false });
        renderForm();

        const input = screen.getByPlaceholderText('Ej. LAA-1362');
        await userEvent.type(input, 'ABC1234');
        fireEvent.submit(input.closest('form')!);

        await waitFor(() => expect(mockSearch).toHaveBeenCalled());
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('muestra el mensaje de error cuando el hook reporta un error', async () => {
        const { useBusquedaOrden } = await import('@/ganchos/useBusquedaOrden');
        (useBusquedaOrden as ReturnType<typeof vi.fn>).mockReturnValue({
            loading: false,
            error: 'No se encontró una orden activa.',
            search: mockSearch,
            reset: vi.fn(),
            result: null,
        });

        renderForm();
        expect(screen.getByText('No se encontró una orden activa.')).toBeInTheDocument();
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
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });
});
