import { useRef, useState } from 'react';
import { Plus, RefreshCw, Package, ArrowUpRight, Pencil } from 'lucide-react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    estadoMuestras,
    cantidadPintura,
    TAMANO_PAGINA_PINTURAS,
    type FiltrosPintura,
    type SolicitudPintura,
} from '@/biblioteca/solicitudesPintura';
import { useSolicitudesPintura } from '@/ganchos/useSolicitudesPintura';
import { FormularioSolicitudPintura } from './FormularioSolicitudPintura';

const inicial: FiltrosPintura = { busqueda: '', proveedor: '', estado: '', desde: '', hasta: '' };
const control = 'pinturas-campo w-full';
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
                    <h2 className="text-2xl font-bold tracking-tight">Encargos de pintura</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Pide el color, acuerda la hora y registra la recogida.
                    </p>
                </div>
                <button
                    disabled={cargando || !!error || !proveedores.length}
                    onClick={() => {
                        setMensaje('');
                        setModal({ solicitud: null });
                    }}
                    className="pinturas-boton-primario"
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
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-slate-500">
                    Pedidos y tapas en cada local · todo el historial
                </p>
                <button
                    onClick={() => setGestion(!gestion)}
                    className="pinturas-boton-secundario text-sm"
                >
                    {gestion ? 'Cerrar proveedores' : 'Gestionar proveedores'}
                </button>
            </div>
            {gestion && (
                <form onSubmit={guardarProveedor} className="pinturas-tarjeta p-5 space-y-4">
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
                            className="self-end pinturas-boton-oscuro"
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
                                    filtrar({
                                        ...inicial,
                                        proveedor: p.id,
                                        estado: 'en_preparacion',
                                    })
                                }
                                className="pinturas-tarjeta pinturas-proveedor text-left p-5 sm:p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-lg break-words">
                                        {p.nombre}
                                    </span>
                                    <Package size={21} className="text-orange-600" />
                                </div>
                                <p className="mt-4">
                                    <strong className="text-4xl tracking-tight">
                                        {p.pedidos_por_recoger}
                                    </strong>
                                    <span className="ml-2 text-sm text-slate-500">
                                        pinturas por recoger
                                    </span>
                                </p>
                                <p className="mt-2 text-sm text-slate-500">
                                    {p.muestras_pendientes} tapas / muestras pendientes ·{' '}
                                    {p.solicitudes} pedidos en total
                                </p>
                                <p className="mt-3 text-xs text-slate-500">
                                    Valor conocido: {dinero(p.valor_conocido)} ·{' '}
                                    {p.valores_pendientes} sin valor
                                </p>
                                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-700 dark:text-orange-400">
                                    Ver pedidos por recoger <ArrowUpRight size={16} />
                                </span>
                            </button>
                        ))}
                    </div>
                    {!proveedores.length && (
                        <p>Agrega un proveedor para comenzar a registrar pedidos.</p>
                    )}
                </>
            )}
            <div className="flex flex-wrap gap-2" aria-label="Estado de los pedidos">
                {[
                    ['', 'Todos'],
                    ['en_preparacion', 'Por recoger'],
                    ['recogida', 'En el taller'],
                ].map(([valor, etiqueta]) => (
                    <button
                        key={valor}
                        aria-pressed={filtros.estado === valor}
                        onClick={() => filtrar({ ...filtros, estado: valor })}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold ${filtros.estado === valor ? 'bg-[#111111] text-white dark:bg-orange-500' : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'}`}
                    >
                        {etiqueta}
                    </button>
                ))}
            </div>
            <form
                onSubmit={e => {
                    e.preventDefault();
                    filtrar(borrador);
                }}
                className="pinturas-tarjeta p-5 sm:p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
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
                        <option value="en_preparacion">Pinturas por recoger</option>
                        <option value="recogida">Pinturas en el taller</option>
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
                <div className="flex flex-wrap items-end gap-2">
                    <button className="pinturas-boton-oscuro">Buscar</button>
                    <button
                        type="button"
                        onClick={() => filtrar(inicial)}
                        className="pinturas-boton-secundario"
                    >
                        Limpiar
                    </button>
                    <button
                        type="button"
                        aria-label="Actualizar pedidos"
                        onClick={recargar}
                        className="pinturas-boton-secundario"
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
                                className="pinturas-tarjeta min-w-0 p-5 sm:p-6 space-y-3"
                            >
                                <div className="flex flex-wrap justify-between items-start gap-2">
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
                                        {s.estado_pedido === 'recogida'
                                            ? 'En el taller'
                                            : s.estado_pedido === 'en_preparacion'
                                              ? 'Por recoger'
                                              : 'Estado sin confirmar'}
                                    </span>
                                </div>
                                <p className="font-semibold text-orange-700 dark:text-orange-400">
                                    {cantidadPintura(s)}
                                </p>
                                <p className="font-medium break-words">{s.color}</p>
                                {s.fecha_recogida_prevista && (
                                    <p className="text-sm">
                                        <strong>Recogida acordada:</strong>{' '}
                                        {s.fecha_recogida_prevista.split('-').reverse().join('/')}
                                        {s.hora_recogida_prevista
                                            ? ` · ${s.hora_recogida_prevista}`
                                            : ' · Hora por confirmar'}
                                    </p>
                                )}
                                <p className="text-sm">
                                    Pago:{' '}
                                    <strong>
                                        {s.pagado === null
                                            ? 'Sin confirmar'
                                            : s.pagado
                                              ? 'Pagado'
                                              : 'Pendiente'}
                                    </strong>{' '}
                                    · Tapas: {estadoMuestras(s)}
                                </p>
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
                                    {s.estado_pedido === 'en_preparacion'
                                        ? 'Registrar recogida / editar'
                                        : 'Editar pedido'}
                                </button>
                            </article>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                            disabled={!pagina}
                            onClick={() => setPagina(p => p - 1)}
                            className="pinturas-boton-secundario disabled:opacity-40"
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
                            className="pinturas-boton-secundario disabled:opacity-40"
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
