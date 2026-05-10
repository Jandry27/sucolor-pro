import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderProgress } from '@/components/OrderProgress';

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('OrderProgress', () => {
    it('muestra el título "Progreso del trabajo"', () => {
        render(<OrderProgress estado="RECIBIDO" />);
        expect(screen.getByText('Progreso del trabajo')).toBeInTheDocument();
    });

    it('calcula 0% para estado RECIBIDO (paso 0 de 6)', () => {
        render(<OrderProgress estado="RECIBIDO" />);
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('calcula 17% para estado LATONERIA (paso 1 de 6)', () => {
        render(<OrderProgress estado="LATONERIA" />);
        expect(screen.getByText('17%')).toBeInTheDocument();
    });

    it('calcula 50% para estado PINTURA (paso 3 de 6)', () => {
        render(<OrderProgress estado="PINTURA" />);
        expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('calcula 83% para estado PULIDO_DETALLES (paso 5 de 6)', () => {
        render(<OrderProgress estado="PULIDO_DETALLES" />);
        expect(screen.getByText('83%')).toBeInTheDocument();
    });

    it('calcula 100% para estado TERMINADO (paso 6 de 6)', () => {
        render(<OrderProgress estado="TERMINADO" />);
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renderiza los 7 pasos del progreso', () => {
        render(<OrderProgress estado="PREPARACION" />);
        const expectedLabels = ['Recibido', 'Latonería', 'Preparación', 'Pintura', 'Secado', 'Pulido', 'Terminado'];
        expectedLabels.forEach(label => {
            expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    it('usa STATUS_CONFIG de fallback para un estado desconocido', () => {
        // Forzamos un estado fuera del tipo para probar el fallback
        render(<OrderProgress estado={'INEXISTENTE' as any} />);
        // Debe mostrar 0% como el estado RECIBIDO (fallback)
        expect(screen.getByText('0%')).toBeInTheDocument();
    });
});
