import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { DisenoAdministracion } from '@/componentes/administracion/DisenoAdministracion';
import { ModalFactura } from '@/componentes/administracion/ModalFactura';
import { ReporteFacturas } from '@/componentes/administracion/reportes/ReporteFacturas';
import { supabase } from '@/biblioteca/clienteSupabase';
import { normalizarPlaca } from '@/dominio/consultaPlaca';
import { consultarPlacaExterna } from '@/servicios/consultarPlaca';
import {
    calcularTotalesFactura,
    validarEmision,
    type ItemFacturable,
} from '../../../supabase/functions/_shared/reglasFacturacion';

type VehiculoFactura = {
    placa: string;
    marca: string;
    modelo: string;
    anio: string;
    color: string;
};
type Concepto = { id: string; descripcion: string; importe: string; iva: '' | 0 | 15 };
const vehiculoVacio: VehiculoFactura = { placa: '', marca: '', modelo: '', anio: '', color: '' };
const nuevoConcepto = (): Concepto => ({
    id: crypto.randomUUID(),
    descripcion: '',
    importe: '',
    iva: '',
});

export function PaginaFacturas() {
    const [nueva, setNueva] = useState(false);
    const [conVehiculo, setConVehiculo] = useState(true);
    const [guardarVehiculo, setGuardarVehiculo] = useState(true);
    const [vehiculo, setVehiculo] = useState(vehiculoVacio);
    const editados = useRef<Partial<Record<keyof VehiculoFactura, boolean>>>({});
    const [conceptos, setConceptos] = useState<Concepto[]>([nuevoConcepto()]);
    const [estado, setEstado] = useState('');
    const [error, setError] = useState('');
    const [buscando, setBuscando] = useState(false);
    const consulta = useRef<AbortController | null>(null);
    const [borrador, setBorrador] = useState<{
        items: ItemFacturable[];
        vehiculo?: VehiculoFactura;
        guardarVehiculo: boolean;
    } | null>(null);
    const [revision, setRevision] = useState(0);
    const emitida = useRef(false);
    useEffect(() => () => consulta.current?.abort(), []);

    const cambiarVehiculo = (campo: keyof VehiculoFactura, valor: string) => {
        if (campo === 'placa' && normalizarPlaca(valor) !== normalizarPlaca(vehiculo.placa)) {
            consulta.current?.abort();
            consulta.current = null;
            setBuscando(false);
            setEstado('');
            setVehiculo(actual => ({
                ...actual,
                marca: editados.current.marca ? actual.marca : '',
                modelo: editados.current.modelo ? actual.modelo : '',
                anio: editados.current.anio ? actual.anio : '',
                color: editados.current.color ? actual.color : '',
            }));
        }
        editados.current[campo] = true;
        setVehiculo(actual => ({ ...actual, [campo]: valor }));
    };

    const buscarPlaca = async () => {
        if (consulta.current) return;
        const placa = normalizarPlaca(vehiculo.placa);
        if (!/^[A-Z0-9]{2,10}$/.test(placa)) {
            setEstado('Ingresa una placa válida.');
            return;
        }
        const controlador = new AbortController();
        consulta.current = controlador;
        setBuscando(true);
        setEstado('Buscando en SuColor…');
        try {
            const { data, error: fallo } = await supabase
                .rpc('buscar_vehiculo_por_placa', { p_placa: placa })
                .abortSignal(controlador.signal)
                .maybeSingle<{
                    marca: string;
                    modelo: string | null;
                    anio: number | null;
                    color: string | null;
                }>();
            if (fallo) throw fallo;
            let encontrados: Partial<VehiculoFactura>;
            if (data) {
                encontrados = {
                    marca: data.marca,
                    modelo: data.modelo ?? '',
                    anio: data.anio ? String(data.anio) : '',
                    color: data.color ?? '',
                };
            } else {
                if (consulta.current !== controlador) return;
                setEstado('Consultando datos del vehículo…');
                const externo = await consultarPlacaExterna(placa, controlador.signal);
                if (!externo.marca || !externo.modelo || !externo.anio) {
                    throw new Error(
                        externo.codigo === 'cupo_agotado'
                            ? 'Se agotó el cupo de consultas. Completa los datos a mano.'
                            : 'No pudimos recuperar los datos. Puedes completarlos a mano.'
                    );
                }
                encontrados = { marca: externo.marca, modelo: externo.modelo, anio: externo.anio };
            }
            if (consulta.current !== controlador) return;
            for (const campo of Object.keys(editados.current) as (keyof VehiculoFactura)[])
                delete encontrados[campo];
            setVehiculo(actual => ({ ...actual, ...encontrados }));
            setEstado(
                data ? 'Vehículo encontrado en SuColor.' : 'Datos encontrados. Revisa la ficha.'
            );
        } catch (fallo) {
            if (consulta.current === controlador)
                setEstado(
                    fallo instanceof Error
                        ? fallo.message
                        : 'No pudimos buscar la placa. Puedes escribir los datos.'
                );
        } finally {
            if (consulta.current === controlador) {
                consulta.current = null;
                setBuscando(false);
            }
        }
    };

    const items = conceptos.map((concepto, indice) => ({
        codigo_principal: `SERV_${indice + 1}`,
        descripcion: concepto.descripcion.trim(),
        precio_total_sin_impuestos: Number(concepto.importe),
        tarifa_iva: concepto.iva === 15 ? (15 as const) : (0 as const),
    }));
    const totales = calcularTotalesFactura(items);
    const actualizarConcepto = (id: string, cambio: Partial<Concepto>) =>
        setConceptos(actual =>
            actual.map(concepto => (concepto.id === id ? { ...concepto, ...cambio } : concepto))
        );

    const continuar = () => {
        setError('');
        try {
            if (conceptos.some(concepto => concepto.importe.trim() === '' || concepto.iva === '')) {
                throw new Error('Completa el importe y selecciona el IVA de cada concepto.');
            }
            validarEmision(items, '01');
            if (
                conVehiculo &&
                (!/^[A-Z0-9]{2,10}$/.test(normalizarPlaca(vehiculo.placa)) ||
                    !vehiculo.marca.trim())
            ) {
                throw new Error('Completa una placa válida y la marca del vehículo.');
            }
            if (conVehiculo && vehiculo.anio && !/^\d{4}$/.test(vehiculo.anio))
                throw new Error('Ingresa un año de cuatro dígitos.');
            setBorrador({
                items,
                vehiculo: conVehiculo
                    ? { ...vehiculo, placa: normalizarPlaca(vehiculo.placa) }
                    : undefined,
                guardarVehiculo: conVehiculo && guardarVehiculo,
            });
        } catch (fallo) {
            setError(fallo instanceof Error ? fallo.message : 'Revisa los datos de la factura.');
        }
    };

    const comenzar = () => {
        emitida.current = false;
        consulta.current?.abort();
        consulta.current = null;
        setBuscando(false);
        setVehiculo(vehiculoVacio);
        editados.current = {};
        setConceptos([nuevoConcepto()]);
        setConVehiculo(true);
        setGuardarVehiculo(true);
        setEstado('');
        setError('');
        setNueva(true);
    };

    return (
        <DisenoAdministracion>
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Facturas</h1>
                    {!nueva && (
                        <button
                            type="button"
                            onClick={comenzar}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva factura
                        </button>
                    )}
                </div>
                {nueva && (
                    <section className="glass-card space-y-6 p-4 sm:p-6">
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <FileText className="h-5 w-5" />
                            Nueva factura
                        </h2>
                        <label className="flex min-h-11 items-center gap-2">
                            <input
                                type="checkbox"
                                checked={conVehiculo}
                                onChange={e => {
                                    consulta.current?.abort();
                                    consulta.current = null;
                                    setBuscando(false);
                                    setConVehiculo(e.target.checked);
                                }}
                            />
                            Incluir vehículo
                        </label>
                        {conVehiculo && (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="factura-placa" className="form-label">
                                        Placa
                                    </label>
                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 max-[359px]:grid-cols-1">
                                        <input
                                            id="factura-placa"
                                            className="input-field min-w-0 uppercase"
                                            value={vehiculo.placa}
                                            onChange={e => cambiarVehiculo('placa', e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    void buscarPlaca();
                                                }
                                            }}
                                            autoCapitalize="characters"
                                            autoComplete="off"
                                        />
                                        <button
                                            type="button"
                                            className="btn-secondary flex items-center justify-center gap-2"
                                            onClick={buscarPlaca}
                                            disabled={buscando}
                                        >
                                            {buscando ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Search className="h-4 w-4" />
                                            )}
                                            Buscar placa
                                        </button>
                                    </div>
                                    <p role="status" className="mt-2 text-sm text-slate-600">
                                        {estado}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {(
                                        [
                                            ['marca', 'Marca'],
                                            ['modelo', 'Modelo'],
                                            ['anio', 'Año'],
                                            ['color', 'Color'],
                                        ] as const
                                    ).map(([campo, etiqueta]) => (
                                        <div
                                            key={campo}
                                            className={
                                                campo === 'marca' || campo === 'modelo'
                                                    ? 'col-span-2 sm:col-span-1'
                                                    : ''
                                            }
                                        >
                                            <label
                                                htmlFor={`factura-vehiculo-${campo}`}
                                                className="form-label"
                                            >
                                                {etiqueta}
                                            </label>
                                            <input
                                                id={`factura-vehiculo-${campo}`}
                                                className="input-field"
                                                value={vehiculo[campo]}
                                                maxLength={campo === 'anio' ? 4 : 150}
                                                inputMode={campo === 'anio' ? 'numeric' : undefined}
                                                onChange={e =>
                                                    cambiarVehiculo(campo, e.target.value)
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                                <label className="flex min-h-11 items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={guardarVehiculo}
                                        onChange={e => setGuardarVehiculo(e.target.checked)}
                                    />
                                    Guardar este vehículo en SuColor al emitir
                                </label>
                            </div>
                        )}
                        <section className="space-y-4 border-t border-slate-200 pt-5">
                            <h3 className="font-semibold">Conceptos a facturar</h3>
                            {conceptos.map((concepto, indice) => (
                                <div
                                    key={concepto.id}
                                    className="space-y-3 rounded-xl border border-slate-200 p-3"
                                >
                                    <div>
                                        <label
                                            className="form-label"
                                            htmlFor={`concepto-${concepto.id}`}
                                        >
                                            Descripción
                                        </label>
                                        <textarea
                                            id={`concepto-${concepto.id}`}
                                            className="input-field block"
                                            rows={2}
                                            maxLength={300}
                                            value={concepto.descripcion}
                                            onChange={e =>
                                                actualizarConcepto(concepto.id, {
                                                    descripcion: e.target.value,
                                                })
                                            }
                                            placeholder="Ej. Cambio de color de amarillo a blanco"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-end gap-3">
                                        <div className="min-w-0 flex-1">
                                            <label
                                                className="form-label"
                                                htmlFor={`importe-${concepto.id}`}
                                            >
                                                Importe sin IVA ($)
                                            </label>
                                            <input
                                                id={`importe-${concepto.id}`}
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.01"
                                                className="input-field"
                                                value={concepto.importe}
                                                onChange={e =>
                                                    actualizarConcepto(concepto.id, {
                                                        importe: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className="form-label"
                                                htmlFor={`iva-${concepto.id}`}
                                            >
                                                IVA
                                            </label>
                                            <select
                                                id={`iva-${concepto.id}`}
                                                className="input-field min-h-11"
                                                value={concepto.iva}
                                                onChange={e =>
                                                    actualizarConcepto(concepto.id, {
                                                        iva:
                                                            e.target.value === ''
                                                                ? ''
                                                                : (Number(e.target.value) as
                                                                      | 0
                                                                      | 15),
                                                    })
                                                }
                                            >
                                                <option value="">Seleccionar</option>
                                                <option value="0">0 %</option>
                                                <option value="15">15 %</option>
                                            </select>
                                        </div>
                                        {conceptos.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn-secondary min-h-11"
                                                aria-label={`Eliminar concepto ${indice + 1}`}
                                                onClick={() =>
                                                    setConceptos(actual =>
                                                        actual.filter(
                                                            item => item.id !== concepto.id
                                                        )
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setConceptos(actual => [...actual, nuevoConcepto()])}
                                disabled={conceptos.length >= 1000}
                            >
                                Añadir concepto
                            </button>
                            <p className="text-right text-lg font-semibold">
                                Total $
                                {Number.isFinite(totales.total) ? totales.total.toFixed(2) : '0.00'}
                            </p>
                        </section>
                        {error && (
                            <p role="alert" className="text-sm text-red-600">
                                {error}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setNueva(false)}
                            >
                                Volver a facturas
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={continuar}
                                disabled={buscando}
                            >
                                Datos del comprador y revisión
                            </button>
                        </div>
                    </section>
                )}
                {!nueva && <ReporteFacturas key={revision} />}
            </div>
            <ModalFactura
                isOpen={!!borrador}
                onClose={() => {
                    setBorrador(null);
                    if (emitida.current) setNueva(false);
                }}
                facturaLibre={borrador ?? undefined}
                onEmitida={() => {
                    emitida.current = true;
                    setRevision(actual => actual + 1);
                }}
            />
        </DisenoAdministracion>
    );
}
