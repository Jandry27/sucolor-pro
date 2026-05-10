import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAutenticacion } from '@/ganchos/useAutenticacion';

// ─── Mock de Supabase ─────────────────────────────────────────────────────────
const mockUnsubscribe = vi.fn();

vi.mock('@/biblioteca/clienteSupabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
    },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getSupabaseMock() {
    const { supabase } = await import('@/biblioteca/clienteSupabase');
    return supabase;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useAutenticacion', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const supabase = await getSupabaseMock();

        // Defaults: sin sesión activa
        (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { session: null },
        });
        (supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>).mockReturnValue({
            data: { subscription: { unsubscribe: mockUnsubscribe } },
        });
    });

    it('inicia en estado loading', () => {
        const { result } = renderHook(() => useAutenticacion());
        expect(result.current.loading).toBe(true);
    });

    it('establece user como null cuando no hay sesión', async () => {
        const { result } = renderHook(() => useAutenticacion());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.user).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('establece el user desde una sesión existente', async () => {
        const supabase = await getSupabaseMock();
        (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { session: { user: { id: 'user-123', email: 'admin@sucolor.com' } } },
        });

        const { result } = renderHook(() => useAutenticacion());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.user).toEqual({ id: 'user-123', email: 'admin@sucolor.com' });
    });

    it('login retorna true con credenciales válidas', async () => {
        const supabase = await getSupabaseMock();
        (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
            error: null,
        });

        const { result } = renderHook(() => useAutenticacion());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let loginResult: boolean | undefined;
        await act(async () => {
            loginResult = await result.current.login('admin@sucolor.com', 'password123');
        });

        expect(loginResult).toBe(true);
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'admin@sucolor.com',
            password: 'password123',
        });
    });

    it('login retorna false y establece error con credenciales incorrectas', async () => {
        const supabase = await getSupabaseMock();
        (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
            error: { message: 'Invalid login credentials' },
        });

        const { result } = renderHook(() => useAutenticacion());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let loginResult: boolean | undefined;
        await act(async () => {
            loginResult = await result.current.login('wrong@test.com', 'badpass');
        });

        expect(loginResult).toBe(false);
        expect(result.current.error).toBe(
            'Credenciales incorrectas. Verifica tu email y contraseña.'
        );
    });

    it('logout llama a signOut', async () => {
        const supabase = await getSupabaseMock();
        (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const { result } = renderHook(() => useAutenticacion());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.logout();
        });

        expect(supabase.auth.signOut).toHaveBeenCalledOnce();
    });

    it('hace unsubscribe al desmontar', async () => {
        const { unmount } = renderHook(() => useAutenticacion());
        await waitFor(() => true);
        unmount();

        expect(mockUnsubscribe).toHaveBeenCalledOnce();
    });

    it('expone las funciones login y logout', async () => {
        const { result } = renderHook(() => useAutenticacion());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(typeof result.current.login).toBe('function');
        expect(typeof result.current.logout).toBe('function');
    });
});
