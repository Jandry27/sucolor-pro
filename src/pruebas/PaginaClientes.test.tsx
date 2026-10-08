import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaginaClientes } from '@/paginas/administracion/PaginaClientes';

vi.mock('@/componentes/administracion/DisenoAdministracion', () => ({
    DisenoAdministracion: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/componentes/SistemaNotificaciones', () => ({ useNotif: () => ({ toast: vi.fn(), confirm: vi.fn() }) }));
vi.mock('@/biblioteca/sonidos', () => ({ sonidoDetallesGuardados: vi.fn(), sonidoOrdenEliminada: vi.fn(), sonidoError: vi.fn() }));
vi.mock('@/biblioteca/clienteSupabase', () => ({
    supabase: { from: () => ({ select: () => ({ order: async () => ({ data: [
        { id: '1', nombres: 'Ana Pérez', created_at: '2026-01-01' },
        { id: '2', nombres: 'Cliente Anónimo (Placa: ABC-123)', created_at: '2026-01-01' },
        { id: '3', nombres: 'LBA-9423', notas: 'Generado automáticamente por sistema al omitir cliente', created_at: '2026-01-01' },
        { id: '4', nombres: 'Cliente Anónimo (Placa: TEL-123)', telefono: '0991234567', created_at: '2026-01-01' },
    ], error: null }) }) }) },
}));
afterEach(cleanup);
describe('Agenda de clientes', () => {
    it('muestra contactos identificables y excluye los registros automáticos sin datos', async () => {
        render(<PaginaClientes />);
        expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
        expect(screen.getByText('0991234567')).toBeInTheDocument();
        expect(screen.queryByText('Cliente Anónimo (Placa: ABC-123)')).not.toBeInTheDocument();
        expect(screen.queryByText('LBA-9423')).not.toBeInTheDocument();
    });
});
