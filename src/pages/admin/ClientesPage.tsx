import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, AlertTriangle, Phone, Users, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { Cliente } from '@/types';

export function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');

    useEffect(() => {
        supabase.from('clientes').select('*').order('created_at', { ascending: false })
            .then(({ data, error: err }) => {
                if (err) setError('No se pudo cargar los clientes.');
                else setClientes(data ?? []);
                setLoading(false);
            });
    }, []);

    const filtered = clientes.filter(c => {
        const s = q.toLowerCase();
        return (c as any).nombres?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.telefono?.includes(s);
    });

    const handleDelete = async (id: string, nombre: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${nombre}"?\nEsta acción es irreversible y eliminará también sus vehículos y órdenes asociadas si las tuviera.`)) {
            return;
        }

        try {
            const { error } = await supabase.from('clientes').delete().eq('id', id);
            if (error) throw error;
            setClientes(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            alert('Error al eliminar cliente: ' + (err.message || 'Error desconocido'));
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-5 animate-fade-in">
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Clientes</h1>
                        <p className="text-sm text-[rgba(15,23,42,0.60)] mt-0.5">{clientes.length} registrados</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(11,18,32,0.30)] pointer-events-none" />
                        <input value={q} onChange={e => setQ(e.target.value)}
                            placeholder="Buscar cliente..." className="input-field pl-9 text-sm w-full sm:w-60" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center h-48 items-center">
                        <Loader2 className="w-7 h-7 text-[#FF5100] animate-spin" />
                    </div>
                ) : error ? (
                    <div className="glass-card flex flex-col items-center py-12 gap-3">
                        <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
                        <p className="text-sm text-[rgba(15,23,42,0.60)]">{error}</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filtered.map((c, i) => (
                            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="glass-card-hover !p-4 !rounded-xl !border-slate-200/50">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 w-full">
                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                                            style={{ background: '#FF6A00' }}>
                                            {(c as any).nombres?.[0]?.toUpperCase() ?? '?'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-[#0F172A] text-sm truncate">{(c as any).nombres}</p>
                                            <p className="text-xs text-[rgba(15,23,42,0.60)]">
                                                {new Date(c.created_at).toLocaleDateString('es')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id, (c as any).nombres); }}
                                            className="p-1.5 text-[rgba(11,18,32,0.30)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar Cliente"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {c.telefono && (
                                    <div className="flex items-center gap-2 text-xs text-[rgba(15,23,42,0.60)]">
                                        <Phone className="w-3 h-3 text-[#FF6A00]" /> {c.telefono}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="sm:col-span-2 lg:col-span-3 glass-card flex flex-col items-center py-14 gap-3">
                                <Users className="w-8 h-8 text-[rgba(15,23,42,0.30)]" />
                                <p className="text-sm text-[rgba(15,23,42,0.60)]">No se encontraron clientes</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
