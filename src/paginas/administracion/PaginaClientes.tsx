import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, AlertTriangle, Phone, Users, Trash2, Edit2, X, Save, CalendarDays, GitMerge, Copy } from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import { DisenoAdministracion } from '@/componentes/administracion/DisenoAdministracion';
import type { Cliente } from '@/tipos';
import { sonidoDetallesGuardados, sonidoOrdenEliminada, sonidoError } from '@/biblioteca/sonidos';

// Paleta de colores para los avatares según la inicial del nombre
const AVATAR_COLORS = [
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E',
    '#8B5CF6', '#0EA5E9', '#22C55E', '#EAB308', '#EC4899',
];

function avatarColor(name: string): string {
    const code = name?.charCodeAt(0) ?? 65;
    return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function PaginaClientes() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNombres, setEditNombres] = useState('');
    const [editTelefono, setEditTelefono] = useState('');
    const [saving, setSaving] = useState(false);
    const [merging, setMerging] = useState(false);

    // ── Detección de grupos duplicados (mismo nombre, case-insensitive) ───────
    const duplicados = useMemo(() => {
        const groups: Record<string, Cliente[]> = {};
        clientes.forEach(c => {
            const key = ((c as any).nombres ?? '').toLowerCase().trim();
            if (!key) return;
            if (!groups[key]) groups[key] = [];
            groups[key].push(c);
        });
        // Ordenar cada grupo por created_at asc (el más antiguo primero = el que se conserva)
        Object.values(groups).forEach(g =>
            g.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        );
        return Object.values(groups).filter(g => g.length > 1);
    }, [clientes]);

    const startEdit = (c: Cliente) => {
        setEditingId(c.id);
        setEditNombres((c as any).nombres || '');
        setEditTelefono(c.telefono || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditNombres('');
        setEditTelefono('');
    };

    const handleSave = async (id: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ nombres: editNombres, telefono: editTelefono })
                .eq('id', id);
            if (error) throw error;
            setClientes(prev =>
                prev.map(c =>
                    c.id === id
                        ? ({ ...c, nombres: editNombres, telefono: editTelefono } as any)
                        : c
                )
            );
            setEditingId(null);
            sonidoDetallesGuardados();
        } catch (err: any) {
            sonidoError();
            alert('Error al guardar: ' + (err.message || 'Error desconocido'));
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        supabase
            .from('clientes')
            .select('*')
            .order('nombres', { ascending: true })
            .then(({ data, error: err }) => {
                if (err) setError('No se pudo cargar los clientes.');
                else setClientes(data ?? []);
                setLoading(false);
            });
    }, []);

    const filtered = useMemo(() => {
        const s = q.toLowerCase();
        return clientes.filter(c =>
            (c as any).nombres?.toLowerCase().includes(s) ||
            c.email?.toLowerCase().includes(s) ||
            c.telefono?.includes(s)
        );
    }, [clientes, q]);

    const handleDelete = async (id: string, nombre: string) => {
        if (
            !window.confirm(
                `¿Eliminar el registro de "${nombre}"?\n\nSi tiene órdenes asociadas, se reasignarán automáticamente al otro cliente con el mismo nombre.`
            )
        ) {
            return;
        }

        try {
            // 1. ¿Tiene órdenes este cliente?
            const { data: ordenes } = await supabase
                .from('ordenes')
                .select('id')
                .eq('cliente_id', id);
            const tieneOrdenes = (ordenes ?? []).length > 0;

            // 2. ¿Hay otro cliente con el mismo nombre al que reasignar?
            let destinoId: string | null = null;
            if (tieneOrdenes) {
                const { data: otros } = await supabase
                    .from('clientes')
                    .select('id')
                    .ilike('nombres', nombre)
                    .neq('id', id)
                    .limit(1);
                destinoId = otros?.[0]?.id ?? null;

                if (!destinoId) {
                    sonidoError();
                    alert(
                        `No se puede eliminar "${nombre}" porque tiene órdenes registradas y no existe otro cliente con el mismo nombre al cual reasignarlas.\n\nEsta es la única copia de este cliente.`
                    );
                    return;
                }

                // 3a. Reasignar órdenes al cliente destino
                const { error: errOrdenes } = await supabase
                    .from('ordenes')
                    .update({ cliente_id: destinoId })
                    .eq('cliente_id', id);
                if (errOrdenes) throw new Error('Error al reasignar órdenes: ' + errOrdenes.message);
            }

            // 3b. Reasignar vehículos: al destino si existe, o null si la columna lo permite
            const vehiculoUpdate = destinoId
                ? { cliente_id: destinoId }
                : { cliente_id: null };
            await supabase.from('vehiculos').update(vehiculoUpdate).eq('cliente_id', id);

            // 4. Eliminar solo el cliente duplicado
            const { error } = await supabase.from('clientes').delete().eq('id', id);
            if (error) throw new Error('Error al eliminar cliente: ' + error.message);

            setClientes(prev => prev.filter(c => c.id !== id));
            sonidoOrdenEliminada();
        } catch (err: any) {
            sonidoError();
            alert(err.message || 'Error desconocido al eliminar el cliente');
        }
    };

    // ── Fusionar un grupo: conserva el más antiguo, reasigna y elimina el resto ─
    const mergeDuplicateGroup = useCallback(async (grupo: Cliente[]) => {
        if (grupo.length < 2) return;
        // El primero es el más antiguo (ordenado arriba), es el que conservamos
        const [keeper, ...duplicates] = grupo;

        for (const dup of duplicates) {
            try {
                // Reasignar órdenes
                await supabase
                    .from('ordenes')
                    .update({ cliente_id: keeper.id })
                    .eq('cliente_id', dup.id);
                // Reasignar vehículos
                await supabase
                    .from('vehiculos')
                    .update({ cliente_id: keeper.id })
                    .eq('cliente_id', dup.id);
                // Eliminar el duplicado
                await supabase.from('clientes').delete().eq('id', dup.id);
            } catch {
                // continuar con el siguiente si hay error en uno
            }
        }

        // Actualizar estado local
        const idsEliminados = new Set(duplicates.map(d => d.id));
        setClientes(prev => prev.filter(c => !idsEliminados.has(c.id)));
    }, []);

    const mergeAllDuplicates = useCallback(async () => {
        if (duplicados.length === 0) return;
        if (!window.confirm(
            `¿Fusionar todos los duplicados automáticamente?\n\n• Se conservará el registro más antiguo de cada nombre\n• Las órdenes y vehículos se reasignarán al registro conservado\n• Los registros duplicados serán eliminados\n\nGrupos a fusionar: ${duplicados.length}`
        )) return;

        setMerging(true);
        for (const grupo of duplicados) {
            await mergeDuplicateGroup(grupo);
        }
        setMerging(false);
        sonidoDetallesGuardados();
    }, [duplicados, mergeDuplicateGroup]);

    return (
        <DisenoAdministracion>
            <div className="space-y-5 animate-fade-in">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                            Clientes
                        </h1>
                        <p className="text-sm text-[rgba(15,23,42,0.60)] mt-0.5">
                            {clientes.length} registrados · A–Z
                            {duplicados.length > 0 && (
                                <span className="ml-2 text-[#F97316] font-semibold">
                                    · {duplicados.length} {duplicados.length === 1 ? 'grupo duplicado' : 'grupos duplicados'}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Buscador */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(11,18,32,0.30)] pointer-events-none" />
                        <input
                            id="buscar-cliente"
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Buscar cliente..."
                            className="input-field pl-9 pr-8 text-sm w-full sm:w-64"
                        />
                        {q && (
                            <button
                                onClick={() => setQ('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(11,18,32,0.30)] hover:text-[#0B1220] transition-colors"
                                title="Limpiar búsqueda"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Panel de duplicados ─────────────────────────────────────────── */}
                <AnimatePresence>
                    {!loading && duplicados.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-2xl border overflow-hidden"
                            style={{
                                background: 'rgba(249,115,22,0.04)',
                                borderColor: 'rgba(249,115,22,0.20)',
                            }}
                        >
                            {/* Cabecera del panel */}
                            <div className="flex items-center justify-between px-5 py-3.5 border-b"
                                style={{ borderColor: 'rgba(249,115,22,0.15)' }}>
                                <div className="flex items-center gap-2.5">
                                    <Copy className="w-4 h-4 text-[#F97316]" />
                                    <span className="text-sm font-bold text-[#0F172A]">
                                        {duplicados.length} {duplicados.length === 1 ? 'nombre duplicado detectado' : 'nombres duplicados detectados'}
                                    </span>
                                </div>
                                <button
                                    id="btn-fusionar-todos"
                                    onClick={mergeAllDuplicates}
                                    disabled={merging}
                                    className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
                                >
                                    {merging ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <GitMerge className="w-3.5 h-3.5" />
                                    )}
                                    Fusionar todos
                                </button>
                            </div>

                            {/* Lista de grupos duplicados */}
                            <div className="divide-y" style={{ borderColor: 'rgba(249,115,22,0.10)' }}>
                                {duplicados.map(grupo => {
                                    const nombre = (grupo[0] as any).nombres ?? '';
                                    const color = avatarColor(nombre);
                                    const keeper = grupo[0]; // el más antiguo
                                    return (
                                        <div key={nombre} className="flex items-center gap-3 px-5 py-3">
                                            {/* Avatar */}
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                                                style={{ background: color }}
                                            >
                                                {nombre[0]?.toUpperCase() ?? '?'}
                                            </div>

                                            {/* Info del grupo */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-[#0F172A] text-sm truncate">{nombre}</p>
                                                <p className="text-xs text-[rgba(15,23,42,0.50)]">
                                                    <span className="font-medium text-[#F97316]">{grupo.length} copias</span>
                                                    {' · '}Se conservará la del{' '}
                                                    {new Date(keeper.created_at).toLocaleDateString('es', {
                                                        day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>

                                            {/* Botón fusionar este grupo */}
                                            <button
                                                id={`btn-fusionar-${nombre.replace(/\s+/g, '-').toLowerCase()}`}
                                                onClick={() => mergeDuplicateGroup(grupo)}
                                                disabled={merging}
                                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                                style={{
                                                    background: 'rgba(249,115,22,0.10)',
                                                    color: '#C2550D',
                                                }}
                                            >
                                                <GitMerge className="w-3 h-3" />
                                                Fusionar
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Contenido */}
                {loading ? (

                    <div className="flex justify-center h-48 items-center">
                        <Loader2 className="w-7 h-7 text-[#FF5100] animate-spin" />
                    </div>
                ) : error ? (
                    <div className="glass-card flex flex-col items-center py-12 gap-3">
                        <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
                        <p className="text-sm text-[rgba(15,23,42,0.60)]">{error}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card flex flex-col items-center py-14 gap-3">
                        <Users className="w-8 h-8 text-[rgba(15,23,42,0.30)]" />
                        <p className="text-sm text-[rgba(15,23,42,0.60)]">
                            {q ? 'Sin resultados para tu búsqueda' : 'No hay clientes registrados'}
                        </p>
                    </div>
                ) : (
                    <div className="glass-card !p-0 overflow-hidden">
                        <AnimatePresence initial={false}>
                            {filtered.map((c, i) => {
                                const nombre = (c as any).nombres ?? '';
                                const letra = nombre[0]?.toUpperCase() ?? '?';
                                const color = avatarColor(nombre);
                                const prevLetra =
                                    i > 0
                                        ? ((filtered[i - 1] as any).nombres?.[0]?.toUpperCase() ?? '')
                                        : '';
                                const showDivider = letra !== prevLetra;

                                return (
                                    <motion.div
                                        key={c.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: Math.min(i * 0.012, 0.25) }}
                                    >
                                        {/* Separador de letra */}
                                        {showDivider && (
                                            <div className="px-5 py-1.5 bg-[rgba(15,23,42,0.025)] border-b border-[rgba(15,23,42,0.06)]">
                                                <span className="text-[11px] font-black text-[rgba(15,23,42,0.35)] tracking-[0.15em] uppercase">
                                                    {letra}
                                                </span>
                                            </div>
                                        )}

                                        {/* Fila del cliente */}
                                        <div
                                            className={`border-b border-[rgba(15,23,42,0.05)] last:border-0 transition-colors duration-150 ${
                                                editingId === c.id
                                                    ? 'bg-[rgba(249,115,22,0.03)]'
                                                    : 'hover:bg-[rgba(15,23,42,0.012)]'
                                            }`}
                                        >
                                            {editingId === c.id ? (
                                                /* ── Modo edición ── */
                                                <div className="px-5 py-4 space-y-3">
                                                    <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                                                        <div className="flex-1 min-w-[160px]">
                                                            <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">
                                                                Nombre
                                                            </label>
                                                            <input
                                                                id={`edit-nombre-${c.id}`}
                                                                value={editNombres}
                                                                onChange={e => setEditNombres(e.target.value)}
                                                                placeholder="Nombre del cliente"
                                                                className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[rgba(249,115,22,0.25)]"
                                                                disabled={saving}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-[140px]">
                                                            <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">
                                                                Teléfono
                                                            </label>
                                                            <input
                                                                id={`edit-telefono-${c.id}`}
                                                                value={editTelefono}
                                                                onChange={e => setEditTelefono(e.target.value)}
                                                                placeholder="0999999999"
                                                                className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA] focus:outline-none focus:ring-2 focus:ring-[rgba(249,115,22,0.25)]"
                                                                disabled={saving}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            id={`btn-guardar-${c.id}`}
                                                            onClick={() => handleSave(c.id)}
                                                            disabled={saving}
                                                            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                                                        >
                                                            {saving ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Save className="w-3 h-3" />
                                                            )}{' '}
                                                            Guardar
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            disabled={saving}
                                                            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs border-transparent hover:bg-[rgba(15,23,42,0.06)]"
                                                        >
                                                            <X className="w-3 h-3" /> Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* ── Vista normal ── */
                                                <div className="flex items-center gap-3.5 px-5 py-3.5">
                                                    {/* Avatar con color único por inicial */}
                                                    <div
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-sm"
                                                        style={{ background: color }}
                                                    >
                                                        {letra}
                                                    </div>

                                                    {/* Nombre y datos */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-[#0F172A] text-sm truncate leading-tight">
                                                            {nombre}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                            {c.telefono ? (
                                                                <span className="flex items-center gap-1 text-xs text-[rgba(15,23,42,0.55)]">
                                                                    <Phone className="w-3 h-3 text-[#F97316]" />
                                                                    {c.telefono}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-[rgba(15,23,42,0.28)] italic">
                                                                    Sin teléfono
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 text-xs text-[rgba(15,23,42,0.35)]">
                                                                <CalendarDays className="w-3 h-3" />
                                                                {new Date(c.created_at).toLocaleDateString('es', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Acciones */}
                                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                                        <button
                                                            id={`btn-editar-${c.id}`}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                startEdit(c);
                                                            }}
                                                            className="p-2 text-[rgba(11,18,32,0.28)] hover:text-[#0B1220] hover:bg-[rgba(15,23,42,0.05)] rounded-lg transition-colors"
                                                            title="Editar cliente"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            id={`btn-eliminar-${c.id}`}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleDelete(c.id, nombre);
                                                            }}
                                                            className="p-2 text-[rgba(11,18,32,0.28)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar cliente"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </DisenoAdministracion>
    );
}
