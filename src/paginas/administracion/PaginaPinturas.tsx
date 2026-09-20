import { useState } from 'react';
import { DisenoAdministracion } from '@/componentes/administracion/DisenoAdministracion';
import { usePinturas } from '@/ganchos/usePinturas';
import type { PinturaSobrante, PinturaFormData } from '@/tipos';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    FlaskConical,
    X,
    Check,
    Droplets,
} from 'lucide-react';

const FORM_INICIAL: PinturaFormData = {
    placa: '',
    color: '',
    codigo_color: '',
};

// ─── Modal de Formulario ───────────────────────────────────────────────────────
function ModalPintura({
    pintura,
    onClose,
    onSave,
    guardando,
}: {
    pintura: PinturaSobrante | null;
    onClose: () => void;
    onSave: (data: PinturaFormData) => Promise<void>;
    guardando: boolean;
}) {
    const [form, setForm] = useState<PinturaFormData>(
        pintura
            ? {
                  placa: pintura.placa,
                  color: pintura.color,
                  codigo_color: pintura.codigo_color ?? '',
              }
            : FORM_INICIAL
    );

    const cambiar = (campo: keyof PinturaFormData, valor: string) =>
        setForm(prev => ({ ...prev, [campo]: valor }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center">
                            <Droplets className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                            {pintura ? 'Editar Pintura' : 'Nueva Pintura'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Placa */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Placa *
                        </label>
                        <input
                            required
                            value={form.placa}
                            onChange={e => cambiar('placa', e.target.value)}
                            placeholder="ABC-1234"
                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition font-mono uppercase tracking-widest"
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Color *
                        </label>
                        <input
                            required
                            value={form.color}
                            onChange={e => cambiar('color', e.target.value)}
                            placeholder="Rojo Cereza, Blanco Perla..."
                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition"
                        />
                    </div>

                    {/* Código de color */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Código de color
                        </label>
                        <input
                            value={form.codigo_color}
                            onChange={e => cambiar('codigo_color', e.target.value)}
                            placeholder="3R3 / 040 / NH731P..."
                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition font-mono"
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#F97316] text-white hover:bg-[#ea6c0e] disabled:opacity-60 transition flex items-center justify-center gap-2"
                        >
                            {guardando ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            {guardando ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Página Principal ──────────────────────────────────────────────────────────
export function PaginaPinturas() {
    const [busqueda, setBusqueda] = useState('');
    const [termino, setTermino] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState<PinturaSobrante | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const { pinturas, loading, error, addPintura, updatePintura, deletePintura } =
        usePinturas(termino);

    const handleBuscar = (e: React.FormEvent) => {
        e.preventDefault();
        setTermino(busqueda);
    };

    const abrirNueva = () => {
        setEditando(null);
        setModalAbierto(true);
    };

    const abrirEditar = (p: PinturaSobrante) => {
        setEditando(p);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setEditando(null);
    };

    const handleGuardar = async (data: PinturaFormData) => {
        setGuardando(true);
        const ok = editando
            ? await updatePintura(editando.id, data)
            : await addPintura(data);
        setGuardando(false);
        if (ok) cerrarModal();
    };

    const handleEliminar = async (id: string) => {
        await deletePintura(id);
        setConfirmDelete(null);
    };

    return (
        <DisenoAdministracion>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
                            <FlaskConical className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                Inventario de Pinturas
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {pinturas.length} botella{pinturas.length !== 1 ? 's' : ''} registrada{pinturas.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        id="btn-nueva-pintura"
                        onClick={abrirNueva}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c0e] text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-200 dark:shadow-orange-900/30 transition-all duration-150 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Pintura
                    </button>
                </div>

                {/* Buscador */}
                <form onSubmit={handleBuscar} className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            id="buscar-pintura"
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar por placa, color o código..."
                            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/40 focus:border-[#F97316] transition"
                        />
                        {busqueda && (
                            <button
                                type="button"
                                onClick={() => { setBusqueda(''); setTermino(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white text-sm font-medium rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition"
                    >
                        Buscar
                    </button>
                </form>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-4 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
                    </div>
                )}

                {/* Lista vacía */}
                {!loading && pinturas.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <FlaskConical className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                            {termino ? 'Sin resultados para esa búsqueda' : 'Aún no hay pinturas registradas'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {termino
                                ? 'Intenta con otra placa o código.'
                                : 'Haz clic en "Nueva Pintura" para agregar la primera.'}
                        </p>
                    </div>
                )}

                {/* Tabla */}
                {!loading && pinturas.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                    <th className="text-left px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Placa</th>
                                    <th className="text-left px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Color</th>
                                    <th className="text-left px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Código</th>
                                    <th className="text-right px-5 py-3 font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {pinturas.map(p => (
                                    <tr
                                        key={p.id}
                                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs tracking-widest">
                                                {p.placa}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3.5 h-3.5 rounded-full border border-[rgba(15,23,42,0.15)] dark:border-slate-600 shadow-sm"
                                                    style={{
                                                        background:
                                                            p.color?.toLowerCase() === 'blanco'
                                                                ? '#f9fafb'
                                                                : p.color?.toLowerCase() === 'negro'
                                                                  ? '#111827'
                                                                  : p.color?.toLowerCase() === 'rojo'
                                                                    ? '#ef4444'
                                                                    : p.color?.toLowerCase() === 'azul'
                                                                      ? '#3b82f6'
                                                                      : p.color?.toLowerCase() === 'verde'
                                                                        ? '#22c55e'
                                                                        : p.color?.toLowerCase() === 'amarillo'
                                                                          ? '#eab308'
                                                                          : p.color?.toLowerCase() === 'gris' || p.color?.toLowerCase() === 'plateado'
                                                                            ? '#9ca3af'
                                                                            : '#e2e8f0', // default fallback
                                                    }}
                                                />
                                                {p.color}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {p.codigo_color ? (
                                                <span className="font-mono text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1 rounded-lg">
                                                    {p.codigo_color}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => abrirEditar(p)}
                                                    title="Editar"
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                {confirmDelete === p.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleEliminar(p.id)}
                                                            className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                                        >
                                                            Eliminar
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(null)}
                                                            className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg transition"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDelete(p.id)}
                                                        title="Eliminar"
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalAbierto && (
                <ModalPintura
                    pintura={editando}
                    onClose={cerrarModal}
                    onSave={handleGuardar}
                    guardando={guardando}
                />
            )}
        </DisenoAdministracion>
    );
}
