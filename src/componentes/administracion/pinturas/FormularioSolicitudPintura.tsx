import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
    fechaHoyEcuador,
    FRACCIONES_GALON,
    guardarSolicitudPintura,
    type DatosSolicitudPintura,
    type ProveedorPintura,
    type SolicitudPintura,
} from '@/biblioteca/solicitudesPintura';

const campo =
    'mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-base';
export function FormularioSolicitudPintura({
    solicitud,
    proveedores,
    cerrar,
    guardado,
}: {
    solicitud: SolicitudPintura | null;
    proveedores: ProveedorPintura[];
    cerrar: () => void;
    guardado: () => void;
}) {
    const [datos, setDatos] = useState<DatosSolicitudPintura>(
        solicitud ?? {
            fraccion_galon: null,
            unidades: 1,
            fecha_recogida_prevista: null,
            hora_recogida_prevista: null,
            estado_pedido: 'en_preparacion',
            pagado: false,
            placa: '',
            color: '',
            codigo_color: '',
            proveedor_id: '',
            fecha_solicitud: fechaHoyEcuador(),
            valor: null,
            muestras_dejadas: 0,
            muestras_retiradas: 0,
            observaciones: '',
        }
    );
    const [dejoMuestra, setDejoMuestra] = useState((solicitud?.muestras_dejadas ?? 0) > 0);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const bloqueo = useRef(false);
    const [id] = useState(() => solicitud?.id ?? crypto.randomUUID());
    const dialogo = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        dialogo.current?.showModal();
    }, []);
    function cambiar<K extends keyof DatosSolicitudPintura>(
        clave: K,
        valor: DatosSolicitudPintura[K]
    ) {
        setDatos(anterior => ({ ...anterior, [clave]: valor }));
    }
    async function guardar(e: React.FormEvent) {
        e.preventDefault();
        if (bloqueo.current) return;
        bloqueo.current = true;
        setGuardando(true);
        setError('');
        try {
            await guardarSolicitudPintura(id, datos, solicitud?.version);
            guardado();
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'No se pudo guardar. Revisa la conexión e inténtalo de nuevo.'
            );
        } finally {
            bloqueo.current = false;
            setGuardando(false);
        }
    }
    return (
        <dialog
            ref={dialogo}
            aria-labelledby="titulo-solicitud"
            onCancel={e => {
                e.preventDefault();
                if (!bloqueo.current) cerrar();
            }}
            className="m-auto w-[calc(100%_-_2rem)] max-w-xl max-h-[90dvh] rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-0 backdrop:bg-black/50"
        >
            <form onSubmit={guardar} className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <h2 id="titulo-solicitud" className="text-xl font-bold">
                        {solicitud ? 'Editar solicitud' : 'Nueva solicitud de pintura'}
                    </h2>
                    <button
                        type="button"
                        aria-label="Cerrar formulario"
                        disabled={guardando}
                        onClick={cerrar}
                        className="p-3"
                    >
                        <X size={20} />
                    </button>
                </div>
                <p className="text-sm text-slate-500">
                    Registra el pedido ahora y completa el valor cuando te lo entregue el proveedor.
                </p>
                {error && (
                    <p role="alert" className="rounded-xl bg-red-50 text-red-700 p-3">
                        {error}
                    </p>
                )}
                <fieldset disabled={guardando} className="space-y-4 disabled:opacity-60">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <label className="text-sm font-medium">
                            Placa *
                            <input
                                autoFocus
                                required
                                maxLength={20}
                                value={datos.placa}
                                onChange={e => cambiar('placa', e.target.value.toUpperCase())}
                                placeholder="ABC-1234"
                                className={campo}
                            />
                        </label>
                        <label className="text-sm font-medium">
                            Proveedor *
                            <select
                                required
                                value={datos.proveedor_id}
                                onChange={e => cambiar('proveedor_id', e.target.value)}
                                className={campo}
                            >
                                <option value="">Selecciona un local</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 p-4 space-y-3">
                        <label className="block text-sm font-medium">
                            Cantidad de pintura *
                            <select
                                required={!solicitud}
                                value={datos.fraccion_galon ?? ''}
                                onChange={e => cambiar('fraccion_galon', e.target.value || null)}
                                className={campo}
                            >
                                <option value="">Selecciona la medida</option>
                                {FRACCIONES_GALON.map(f => (
                                    <option key={f} value={f}>
                                        {f} de galón
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm font-medium">
                            Unidades de esa medida
                            <input
                                required
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                value={datos.unidades}
                                onChange={e => cambiar('unidades', Number(e.target.value))}
                                className={campo}
                            />
                        </label>
                    </div>
                    <label className="block text-sm font-medium">
                        Color o descripción *
                        <input
                            required
                            maxLength={300}
                            value={datos.color}
                            onChange={e => cambiar('color', e.target.value)}
                            placeholder="Blanco perla para guardafango"
                            className={campo}
                        />
                    </label>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <label className="text-sm font-medium">
                            Código de color
                            <input
                                maxLength={80}
                                value={datos.codigo_color}
                                onChange={e => cambiar('codigo_color', e.target.value)}
                                className={campo}
                            />
                        </label>
                        <label className="text-sm font-medium">
                            Fecha del pedido *
                            <input
                                type="date"
                                required
                                value={datos.fecha_solicitud}
                                onChange={e => cambiar('fecha_solicitud', e.target.value)}
                                className={campo}
                            />
                        </label>
                    </div>
                    <div className="rounded-xl border dark:border-slate-700 p-4 space-y-4">
                        <h3 className="font-semibold">Recoger la pintura</h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <label className="text-sm font-medium">
                                Fecha para recoger
                                <input
                                    type="date"
                                    min={datos.fecha_solicitud}
                                    value={datos.fecha_recogida_prevista ?? ''}
                                    onChange={e =>
                                        setDatos(d => ({
                                            ...d,
                                            fecha_recogida_prevista: e.target.value || null,
                                            hora_recogida_prevista: e.target.value
                                                ? d.hora_recogida_prevista
                                                : null,
                                        }))
                                    }
                                    className={campo}
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Hora acordada
                                <input
                                    type="time"
                                    disabled={!datos.fecha_recogida_prevista}
                                    value={datos.hora_recogida_prevista ?? ''}
                                    onChange={e =>
                                        cambiar('hora_recogida_prevista', e.target.value || null)
                                    }
                                    className={campo}
                                />
                            </label>
                        </div>
                        <label className="block text-sm font-medium">
                            Estado de la pintura
                            <select
                                value={datos.estado_pedido ?? ''}
                                onChange={e =>
                                    cambiar(
                                        'estado_pedido',
                                        (e.target.value ||
                                            null) as DatosSolicitudPintura['estado_pedido']
                                    )
                                }
                                className={campo}
                            >
                                <option value="">Sin confirmar</option>
                                <option value="en_preparacion">En preparación / por recoger</option>
                                <option value="recogida">Recogida / en el taller</option>
                            </select>
                        </label>
                        <p className="text-xs text-slate-500">
                            Recoger la pintura no marca la tapa como devuelta. Confirma abajo si
                            también la recuperaste.
                        </p>
                    </div>
                    <label className="block text-sm font-medium">
                        Valor de la pintura (USD)
                        <input
                            type="number"
                            min="0"
                            max="9999999999.99"
                            step="0.01"
                            value={datos.valor ?? ''}
                            onChange={e =>
                                cambiar(
                                    'valor',
                                    e.target.value === '' ? null : Number(e.target.value)
                                )
                            }
                            placeholder="Pendiente de conocer"
                            className={campo}
                        />
                        <span className="mt-1 block text-xs text-slate-500">
                            Déjalo vacío si aún no sabes el valor.
                        </span>
                    </label>
                    <label className="block text-sm font-medium">
                        Pago al proveedor
                        <select
                            value={
                                datos.pagado === null ? '' : datos.pagado ? 'pagado' : 'pendiente'
                            }
                            onChange={e =>
                                cambiar(
                                    'pagado',
                                    e.target.value === '' ? null : e.target.value === 'pagado'
                                )
                            }
                            className={campo}
                        >
                            <option value="">Sin confirmar</option>
                            <option value="pendiente">Pendiente de pago</option>
                            <option value="pagado">Pagado</option>
                        </select>
                    </label>
                    <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 p-4 space-y-3">
                        <label className="flex items-center gap-3 font-medium">
                            <input
                                type="checkbox"
                                checked={dejoMuestra}
                                onChange={e => {
                                    setDejoMuestra(e.target.checked);
                                    setDatos(d => ({
                                        ...d,
                                        muestras_dejadas: e.target.checked ? 1 : 0,
                                        muestras_retiradas: 0,
                                    }));
                                }}
                                className="h-5 w-5 accent-orange-600"
                            />
                            Dejé tapas o muestras en el local
                        </label>
                        {dejoMuestra && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="text-sm">
                                        Cantidad dejada
                                        <input
                                            type="number"
                                            min="1"
                                            max="1000"
                                            step="1"
                                            required
                                            value={datos.muestras_dejadas || ''}
                                            onChange={e =>
                                                cambiar('muestras_dejadas', Number(e.target.value))
                                            }
                                            className={campo}
                                        />
                                    </label>
                                    <label className="text-sm">
                                        Cantidad ya retirada
                                        <input
                                            type="number"
                                            min="0"
                                            max={datos.muestras_dejadas}
                                            step="1"
                                            required
                                            value={datos.muestras_retiradas}
                                            onChange={e =>
                                                cambiar(
                                                    'muestras_retiradas',
                                                    Number(e.target.value)
                                                )
                                            }
                                            className={campo}
                                        />
                                    </label>
                                </div>
                                <p className="text-sm font-semibold">
                                    Quedan en el local:{' '}
                                    {Math.max(0, datos.muestras_dejadas - datos.muestras_retiradas)}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Al recuperarlas, actualiza la cantidad total retirada. Puedes
                                    registrar retiros parciales.
                                </p>
                            </>
                        )}
                    </div>
                    <label className="block text-sm font-medium">
                        Observaciones
                        <textarea
                            rows={3}
                            maxLength={2000}
                            value={datos.observaciones}
                            onChange={e => cambiar('observaciones', e.target.value)}
                            placeholder="Tipo de muestra, referencia del pedido, factura del proveedor…"
                            className={campo}
                        />
                    </label>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={cerrar}
                            className="rounded-xl border px-4 py-3"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="rounded-xl bg-orange-600 text-white font-semibold px-4 py-3"
                        >
                            {guardando ? 'Guardando…' : 'Guardar solicitud'}
                        </button>
                    </div>
                </fieldset>
            </form>
        </dialog>
    );
}
