import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthState } from '@/types';

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data }) => {
            const session = data.session;
            setState({
                user: session?.user
                    ? { id: session.user.id, email: session.user.email }
                    : null,
                loading: false,
                error: null,
            });
        });

        // Subscribe to auth changes
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setState({
                user: session?.user
                    ? { id: session.user.id, email: session.user.email }
                    : null,
                loading: false,
                error: null,
            });
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Credenciales incorrectas. Verifica tu email y contraseña.',
            }));
            return false;
        }
        return true;
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    return { ...state, login, logout };
}
