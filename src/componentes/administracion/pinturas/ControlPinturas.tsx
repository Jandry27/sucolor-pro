import { useRef, useState } from 'react';
import { Plus, RefreshCw, Package, ArrowUpRight, Pencil } from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    estadoMuestras,
    TAMANO_PAGINA_PINTURAS,
    type FiltrosPintura,
    type SolicitudPintura,
} from '@/biblioteca/solicitudesPintura';
import { useSolicitudesPintura } from '@/ganchos/useSolicitudesPintura';
import { FormularioSolicitudPintura } from './FormularioSolicitudPintura';

const inicial: FiltrosPintura = { busqueda: '', proveedor: '', estado: '', desde: '', hasta: '' };
const control =
    'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-base';
const dinero = (valor: number) =>
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(valor);
export function ControlPinturas() {
    const [filtros, setFiltros] = useState(inicial);
    const [borrador, setBorrador] = useState(inicial);
    const [pagina, setPagina] = useState(0);
    const [modal, setModal] = useState<{ solicitud: SolicitudPintura | null } | null>(null);
    const [gestion, setGestion] = useState(false);
    const [nombre, setNombre] = useState('');
    const [proveedorEditado, setProveedorEditado] = useState('');
    const [guardandoProveedor, setGuardandoProveedor] = useState(false);
    const bloqueo = useRef(false);
    const [mensaje, setMensaje] = useState('');
    const [errorProveedor, setErrorProveedor] = useState('');
    const { solicitudes, proveedores, total, cargando, error, recargar } = useSolicitudesPintura(
        filtros,
        pagina
    );
    function filtrar(nuevos: FiltrosPintura) {
        setPagina(0);
        setFiltros(nuevos);
        setBorrador(nuevos);
    }
    async function guardarProveedor(e: React.FormEvent) {
        e.preventDefault();
        if (bloqueo.current || !nombre.trim()) return;
        bloqueo.current = true;
        setGuardandoProveedor(true);
        setErrorProveedor('');
        try {
            const resultado = proveedorEditado
                ? await supabase
                      .from('proveedores_pintura')
                      .update({ nombre: nombre.trim() })
                      .eq('id', proveedorEditado)
                      .select('id')
                : await supabase
                      .from('proveedores_pintura')
                      .insert({ nombre: nombre.trim() })
                      .select('id');
            if (resultado.error || !resultado.data?.length) throw resultado.error;
            setNombre('');
            setProveedorEditado('');
            recargar();
            setMensaje('Proveedor guardado.');
        } catch {
            setErrorProveedor(
                'No se pudo guardar. Comprueba la conexión y que el nombre no esté repetido.'
            );
        } finally {
            bloqueo.current = false;
            setGuardandoProveedor(false);
        }
    }
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">Solicitudes y muestras</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Tu control de pedidos, incluso antes de recibir la factura.
                    </p>
                </div>
                <button
                    disabled={cargando || !!error || !proveedores.length}
                    onClick={() => {
                        setMensaje('');
                        setModal({ solicitud: null });
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                    <Plus size={18} />
                    Nueva solicitud
                </button>
            </div>
            {mensaje && (
                <p role="status" className="rounded-xl bg-emerald-50 text-emerald-800 p-3">
                    {mensaje}
                </p>
            )}
            <div className="flex justify-between items-center gap-3">
                <p className="text-sm text-slate-500">
                    Muestras actualmente en cada local · todo el historial
                </p>
                <button
                    onClick={() => setGestion(!gestion)}
                    className="text-sm text-orange-700 dark:text-orange-400 py-2 font-semibold"
                >
                    {gestion ? 'Cerrar proveedores' : 'Gestionar proveedores'}
                </button>
            </div>
            {gestion && (
                <form
                    onSubmit={guardarProveedor}
                    className="rounded-2xl border dark:border-slate-700 p-4 space-y-3"
                >
                    <h3 className="font-semibold">Locales / proveedores</h3>
                    <div className="flex gap-2 flex-wrap">
                        {proveedores.map(p => (
                            <button
                                type="button"
                                disabled={guardandoProveedor}
                                key={p.id}
                                onClick={() => {
                                    setProveedorEditado(p.id);
                                    setNombre(p.nombre);
                                }}
                                className="rounded-lg border px-3 py-2 text-sm"
                            >
                                Editar {p.nombre}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <label className="flex-1 text-sm">
                            {proveedorEditado ? 'Nuevo nombre' : 'Nombre del nuevo local'}
                            <input
                                required
                                maxLength={80}
                                value={nombre}
                                disabled={guardandoProveedor}
                                onChange={e => setNombre(e.target.value)}
                                className={control}
                            />
                        </label>
                        <button
                            disabled={guardandoProveedor}
                            className="self-end rounded-xl bg-slate-800 text-white px-4 py-3"
                        >
                            {guardandoProveedor ? 'Guardando…' : 'Guardar proveedor'}
                        </button>
                        {proveedorEditado && (
                            <button
                                type="button"
                                disabled={guardandoProveedor}
                                onClick={() => {
                                    setProveedorEditado('');
                                    setNombre('');
                                }}
                                className="px-3 py-2"
                            >
                                Cancelar edición
                            </button>
                        )}
                    </div>
                    {errorProveedor && (
                        <p role="alert" className="text-red-700">
                            {errorProveedor}
                        </p>
                    )}
                </form>
            )}
            {error ? (
                <div role="alert" className="rounded-xl bg-red-50 text-red-700 p-4">
                    {error}
                    <button onClick={recargar} className="ml-3 underline">
                        Reintentar
                    </button>
                </div>
            ) : cargando ? (
                <p role="status" className="py-5 text-slate-500">
                    Cargando pedidos y saldos…
                </p>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {proveedores.map(p => (
                            <button
                                key={p.id}
                                onClick={() =>
                                    filtrar({ ...inicial, proveedor: p.id, estado: 'pendientes' })
                                }
                                className="text-left rounded-2xl border border-orange-200 dark:border-orange-900 bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-900 p-5 hover:border-orange-500 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-lg">{p.nombre}</span>
                                    <Package size={21} className="text-orange-600" />
                                </div>
                                <p className="mt-4">
                                    <strong className="text-4xl">{p.muestras_pendientes}</strong>
                                    <span className="ml-2 text-sm text-slate-500">
                                        tapas / muestras pendientes
                                    </span>
                                </p>
                                <p className="mt-2 text-sm text-slate-500">
                                    En {p.solicitudes_pendientes} pedidos · {p.solicitudes} pedidos
                                    en total
                                </p>
                                <p className="mt-3 text-xs text-slate-500">
                                    Valor conocido: {dinero(p.valor_conocido)} ·{' '}
                                    {p.valores_pendientes} sin valor
                                </p>
                                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-700 dark:text-orange-400">
                                    Ver vehículos pendientes <ArrowUpRight size={16} />
                                </span>
                            </button>
                        ))}
                    </div>
                    {!proveedores.length && (
                        <p>Agrega un proveedor para comenzar a registrar pedidos.</p>
                    )}
                </>
            )}
            <form
                onSubmit={e => {
                    e.preventDefault();
                    filtrar(borrador);
                }}
                className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
                <label className="text-sm">
                    Buscar
                    <input
                        value={borrador.busqueda}
                        onChange={e => setBorrador({ ...borrador, busqueda: e.target.value })}
                        placeholder="Placa, color o código"
                        className={control}
                    />
                </label>
                <label className="text-sm">
                    Local
                    <select
                        value={borrador.proveedor}
                        onChange={e => setBorrador({ ...borrador, proveedor: e.target.value })}
                        className={control}
                    >
                        <option value="">Todos los locales</option>
                        {proveedores.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm">
                    Mostrar
                    <select
                        value={borrador.estado}
                        onChange={e => setBorrador({ ...borrador, estado: e.target.value })}
                        className={control}
                    >
                        <option value="">Todos los pedidos</option>
                        <option value="pendientes">Con muestras pendientes</option>
                        <option value="retiradas">Muestras retiradas</option>
                        <option value="sin_muestra">Sin muestras</option>
                        <option value="sin_valor">Valor por conocer</option>
                    </select>
                </label>
                <label className="text-sm">
                    Desde
                    <input
                        type="date"
                        value={borrador.desde}
                        max={borrador.hasta || undefined}
                        onChange={e => setBorrador({ ...borrador, desde: e.target.value })}
                        className={control}
                    />
                </label>
                <label className="text-sm">
                    Hasta
                    <input
                        type="date"
                        value={borrador.hasta}
                        min={borrador.desde || undefined}
                        onChange={e => setBorrador({ ...borrador, hasta: e.target.value })}
                        className={control}
                    />
                </label>
                <div className="flex items-end gap-2">
                    <button className="rounded-xl bg-slate-800 text-white px-4 py-3">Buscar</button>
                    <button
                        type="button"
                        onClick={() => filtrar(inicial)}
                        className="rounded-xl border px-3 py-3"
                    >
                        Limpiar
                    </button>
                    <button
                        type="button"
                        aria-label="Actualizar pedidos"
                        onClick={recargar}
                        className="p-3"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </form>
            {!cargando && !error && (
                <>
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Historial · {total} pedidos</h3>
                        <span className="text-xs text-slate-500">Más recientes primero</span>
                    </div>
                    {!solicitudes.length && (
                        <p className="text-center rounded-2xl border border-dashed p-10 text-slate-500">
                            {total
                                ? 'No hay pedidos en esta página. Regresa a la anterior.'
                                : 'No hay pedidos para mostrar. Registra una solicitud o cambia los filtros.'}
                        </p>
                    )}
                    <div className="grid lg:grid-cols-2 gap-4">
                        {solicitudes.map(s => (
                            <article
                                key={s.id}
                                className="min-w-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <p className="font-mono font-bold tracking-wide text-lg break-words">
                                            {s.placa}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {proveedores.find(p => p.id === s.proveedor_id)
                                                ?.nombre ?? 'Proveedor'}{' '}
                                            · {s.fecha_solicitud.split('-').reverse().join('/')}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${s.muestras_pendientes ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        {estadoMuestras(s)}
                                    </span>
                                </div>
                                <p className="font-medium break-words">{s.color}</p>
                                {s.codigo_color && (
                                    <p className="text-xs text-slate-500 break-words">
                                        Código: {s.codigo_color}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                                    <span>
                                        Valor:{' '}
                                        <strong>
                                            {s.valor === null ? 'Por conocer' : dinero(s.valor)}
                                        </strong>
                                    </span>
                                    <span>
                                        Dejadas: <strong>{s.muestras_dejadas}</strong>
                                    </span>
                                    <span>
                                        Retiradas: <strong>{s.muestras_retiradas}</strong>
                                    </span>
                                </div>
                                {s.muestras_pendientes > 0 && (
                                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                                        {s.muestras_pendientes} pendientes de recuperar
                                    </p>
                                )}
                                {s.observaciones && (
                                    <p className="text-sm text-slate-500 whitespace-pre-wrap break-words">
                                        {s.observaciones}
                                    </p>
                                )}
                                <button
                                    onClick={() => {
                                        setMensaje('');
                                        setModal({ solicitud: s });
                                    }}
                                    className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-orange-700 dark:text-orange-400"
                                >
                                    <Pencil size={16} />
                                    {s.muestras_pendientes
                                        ? 'Editar / registrar retiro'
                                        : 'Editar pedido'}
                                </button>
                            </article>
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <button
                            disabled={!pagina}
                            onClick={() => setPagina(p => p - 1)}
                            className="border rounded-xl px-4 py-2 disabled:opacity-40"
                        >
                            Anterior
                        </button>
                        <span className="text-sm">
                            Página {pagina + 1} de{' '}
                            {Math.max(1, Math.ceil(total / TAMANO_PAGINA_PINTURAS))}
                        </span>
                        <button
                            disabled={(pagina + 1) * TAMANO_PAGINA_PINTURAS >= total}
                            onClick={() => setPagina(p => p + 1)}
                            className="border rounded-xl px-4 py-2 disabled:opacity-40"
                        >
                            Siguiente
                        </button>
                    </div>
                </>
            )}
            {modal && (
                <FormularioSolicitudPintura
                    solicitud={modal.solicitud}
                    proveedores={proveedores}
                    cerrar={() => setModal(null)}
                    guardado={() => {
                        setModal(null);
                        setMensaje('Solicitud guardada.');
                        recargar();
                    }}
                />
            )}
        </div>
    );
}
