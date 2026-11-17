import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronDown,
    User,
    Car,
    FileText,
    CheckCircle,
    Loader2,
    AlertTriangle,
    Search,
    Upload,
    Camera,
    Trash2,
    ClipboardList,
    Calendar,
    CalendarCheck,
} from 'lucide-react';
import { esClienteRegistrado } from '@/biblioteca/clientes';
import { supabase } from '@/biblioteca/clienteSupabase';
import { sanitizarTexto, sanitizarTelefono } from '@/biblioteca/sanitizar';
import { DisenoAdministracion } from '@/componentes/administracion/DisenoAdministracion';
import { sonidoOrdenCreada, sonidoError } from '@/biblioteca/sonidos';
import { consultarPlacaExterna } from '@/servicios/consultarPlaca';
import { avisoVigencia } from '@/dominio/vigenciaSuColor';
import {
    extraerResultadoPlaca,
    normalizarPlaca,
    URL_CONSULTAS_ECUADOR,
} from '@/dominio/consultaPlaca';

const fichaVacia = { marca: '', modelo: '', anio: '', color: '' };
type CampoVehiculo = keyof typeof fichaVacia;

type Step = 'cliente' | 'vehiculo' | 'orden' | 'confirmado';
const PRIORIDADES = ['NORMAL', 'URGENTE'];
const PASOS = [
    { id: 'cliente', label: 'Cliente', icon: User },
    { id: 'vehiculo', label: 'Vehículo', icon: Car },
    { id: 'orden', label: 'Orden', icon: FileText },
];

interface ClienteResult {
    id: string;
    nombres: string;
    telefono?: string;
}
interface VehiculoResult {
    id: string;
    placa: string;
    marca: string;
    modelo?: string;
    anio?: number;
    color?: string;
    cliente_id?: string | null;
}
interface PhotoPreview {
    file: File;
    preview: string;
}
interface OrdenHistorial {
    id: string;
    codigo: string;
    estado: string;
    fecha_ingreso: string;
    fecha_estimada: string | null;
    notas_publicas: string | null;
    precio_total: number | null;
}

export function PaginaNuevaOrden() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('cliente');
    const [saving, setSaving] = useState(false);
    const envioOrdenBloqueado = useRef(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [suscripcionVencida, setSuscripcionVencida] = useState(false);

    useEffect(() => {
        let vigente = true;
        let consultando = false;
        const consultarVigencia = async () => {
            if (!vigente || consultando) return;
            consultando = true;
            try {
                const { data, error } = await supabase.functions.invoke('aviso-suscripcion', {
                    body: {},
                });
                if (vigente && !error)
                    setSuscripcionVencida(avisoVigencia(data)?.vencida === true);
            } catch {
                // RLS mantiene el control definitivo aunque falle la consulta visual.
            } finally {
                consultando = false;
            }
        };
        const alVolver = () => {
            if (document.visibilityState === 'visible') void consultarVigencia();
        };
        void consultarVigencia();
        const intervalo = window.setInterval(() => void consultarVigencia(), 120_000);
        window.addEventListener('focus', consultarVigencia);
        document.addEventListener('visibilitychange', alVolver);
        return () => {
            vigente = false;
            window.clearInterval(intervalo);
            window.removeEventListener('focus', consultarVigencia);
            document.removeEventListener('visibilitychange', alVolver);
        };
    }, []);

    // IDs guardados
    const [clienteId, setClienteId] = useState<string | null>(null);
    const [ordenId, setOrdenId] = useState<string | null>(null);
    const [nuevaOrdenCodigo, setNuevaOrdenCodigo] = useState('');

    // ── Paso 1: Cliente ──────────────────────────────────────────────────────
    const [clienteBusqueda, setClienteBusqueda] = useState('');
    const [buscandoCliente, setBuscandoCliente] = useState(false);
    const [clientesEncontrados, setClientesEncontrados] = useState<ClienteResult[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteResult | null>(null);
    const [cNombres, setCNombres] = useState('');
    const [cTel, setCTel] = useState('');

    // ── Paso 2: Vehículo ─────────────────────────────────────────────────────
    const [vPlaca, setVPlaca] = useState('');
    const [ficha, setFicha] = useState(fichaVacia);
    const camposEditados = useRef<Partial<Record<CampoVehiculo, true>>>({});
    const consultaPlaca = useRef<AbortController | null>(null);
    const [buscandoVehiculo, setBuscandoVehiculo] = useState(false);
    const [estadoPlaca, setEstadoPlaca] = useState('');
    const [mostrarRespaldo, setMostrarRespaldo] = useState(false);
    const [mostrarPegado, setMostrarPegado] = useState(false);
    const [resultadoPegado, setResultadoPegado] = useState('');
    const [vehiculoExistente, setVehiculoExistente] = useState<VehiculoResult | null>(null);

    useEffect(() => () => consultaPlaca.current?.abort(), []);

    // ── Paso 3: Orden ────────────────────────────────────────────────────────
    const [oPrioridad, setOPrioridad] = useState('NORMAL');
    const [oFechaEst, setOFechaEst] = useState('');
    const [oNotasPublicas, setONotasPublicas] = useState('');
    const [oNotasInternas, setONotasInternas] = useState('');
    const [oPrecio, setOPrecio] = useState('');
    const [oEntrada, setOEntrada] = useState('');

    // ── Historial del vehículo ────────────────────────────────────────────────
    const [historialVehiculo, setHistorialVehiculo] = useState<OrdenHistorial[]>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [historialAbierto, setHistorialAbierto] = useState(true);

    // ── Fotos del ANTES ──────────────────────────────────────────────────────
    const [photos, setPhotos] = useState<PhotoPreview[]>([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // ── Buscar cliente por nombre, teléfono O placa ──────────────────────────
    const buscarCliente = async () => {
        const q = clienteBusqueda.trim();
        if (q.length < 2) return;
        setBuscandoCliente(true);
        setClientesEncontrados([]);

        // Buscar por nombre / teléfono
        const { data: byNombre } = await supabase
            .from('clientes')
            .select('id, nombres, telefono, email, cedula, notas')
            .or(`nombres.ilike.%${q}%,telefono.ilike.%${q}%`)
            .limit(5);

        // Buscar por placa (busca el cliente dueño del vehículo)
        const { data: byPlaca } = await supabase
            .from('vehiculos')
            .select('cliente_id, placa')
            .ilike('placa', `%${q}%`)
            .limit(3);

        let extra: ClienteResult[] = [];
        if (byPlaca && byPlaca.length > 0) {
            const ids = byPlaca.map(v => v.cliente_id).filter(Boolean);
            if (ids.length) {
                const { data: clientesPorPlaca } = await supabase
                    .from('clientes')
                    .select('id, nombres, telefono, email, cedula, notas')
                    .in('id', ids);
                extra = clientesPorPlaca ?? [];
            }
        }

        // Unir y deduplicar
        const todos = [...(byNombre ?? []), ...extra];
        const uniq = todos.filter((c, i) => todos.findIndex(x => x.id === c.id) === i);
        setClientesEncontrados(uniq.filter(esClienteRegistrado));
        setBuscandoCliente(false);
    };

    // ── Seleccionar cliente existente ─────────────────────────────────────────
    const seleccionarCliente = (c: ClienteResult) => {
        setClienteSeleccionado(c);
        setClienteId(c.id);
        setClientesEncontrados([]);
        setStep('vehiculo');
    };

    // ── Guardar cliente nuevo ─────────────────────────────────────────────────
    const guardarCliente = async () => {
        setErrorMsg(null);
        if (!cNombres.trim()) {
            setErrorMsg('El nombre completo es obligatorio.');
            return;
        }
        setSaving(true);

        const nombreNorm = sanitizarTexto(cNombres);
        const telefonoNorm = sanitizarTelefono(cTel) || null;

        // 1. Buscar por nombre exacto (case-insensitive), limit(1) para tolerar duplicados ya existentes
        const { data: porNombre } = await supabase
            .from('clientes')
            .select('id, nombres, telefono, email, cedula, notas')
            .ilike('nombres', nombreNorm)
            .limit(1);

        // 2. Si no se encontró por nombre y hay teléfono, buscar por teléfono
        let existente = porNombre?.[0] ?? null;
        if (!existente && telefonoNorm) {
            const { data: porTel } = await supabase
                .from('clientes')
                .select('id, nombres, telefono, email, cedula, notas')
                .eq('telefono', telefonoNorm)
                .limit(1);
            existente = porTel?.[0] ?? null;
        }

        if (existente) {
            // Cliente ya registrado → reutilizar sin crear duplicado
            setSaving(false);
            setClienteSeleccionado(existente);
            setClienteId(existente.id);
            setStep('vehiculo');
            return;
        }

        const { data, error } = await supabase
            .from('clientes')
            .insert({ nombres: nombreNorm, telefono: telefonoNorm })
            .select('id, nombres, telefono, email, cedula, notas')
            .single();
        setSaving(false);
        if (error) {
            sonidoError();
            setErrorMsg('Error al guardar el cliente: ' + error.message);
            return;
        }
        setClienteSeleccionado(data);
        setClienteId(data.id);
        setStep('vehiculo');
    };

    const saltarCliente = () => {
        setClienteSeleccionado(null);
        setClienteId(null);
        setStep('vehiculo');
    };

    const editarFicha = (campo: CampoVehiculo, valor: string) => {
        camposEditados.current[campo] = true;
        setFicha(actual => ({ ...actual, [campo]: valor }));
    };

    const aplicarFicha = (datos: Partial<typeof fichaVacia>) => {
        const sugerencias = { ...datos };
        for (const campo of Object.keys(camposEditados.current) as CampoVehiculo[]) {
            delete sugerencias[campo];
        }
        setFicha(actual => ({ ...actual, ...sugerencias }));
    };

    const cambiarPlaca = (placa: string) => {
        setVPlaca(placa);
        if (normalizarPlaca(placa) === normalizarPlaca(vPlaca)) return;

        consultaPlaca.current?.abort();
        consultaPlaca.current = null;
        setBuscandoVehiculo(false);
        setVehiculoExistente(null);
        setHistorialVehiculo([]);
        setCargandoHistorial(false);
        setEstadoPlaca('');
        setMostrarRespaldo(false);
        setMostrarPegado(false);
        setResultadoPegado('');
        aplicarFicha(fichaVacia);
    };

    const buscarFichaPorPlaca = async (placa: string, signal?: AbortSignal) => {
        const rpc = supabase.rpc('buscar_vehiculo_por_placa', { p_placa: placa });
        const { data, error } = await (signal ? rpc.abortSignal(signal) : rpc).maybeSingle<VehiculoResult>();
        if (!error) return data;
        if (error.code !== 'PGRST202') throw error;

        // Permite consultar la tabla con la sesión actual mientras se instala la migración.
        const patron = `%${[...placa].join('%')}%`;
        const porPagina = 100;
        for (let inicio = 0; ; inicio += porPagina) {
            const consulta = supabase
                .from('vehiculos')
                .select('id, placa, marca, modelo, anio, color, cliente_id')
                .ilike('placa', patron)
                .order('id')
                .range(inicio, inicio + porPagina - 1);
            if (signal) consulta.abortSignal(signal);
            const { data: fichas, error: fallo } = await consulta;
            if (fallo) throw fallo;
            const ficha = fichas.find(vehiculo => normalizarPlaca(vehiculo.placa) === placa);
            if (ficha) return ficha;
            if (fichas.length < porPagina) return null;
        }
    };

    const buscarVehiculo = async () => {
        if (consultaPlaca.current || saving) return;
        const placa = normalizarPlaca(vPlaca);
        if (!/^[A-Z0-9]{2,10}$/.test(placa)) {
            setEstadoPlaca('Ingresa una placa válida. Ejemplo: ABC-1234.');
            return;
        }

        const consulta = new AbortController();
        consultaPlaca.current = consulta;
        const vigente = () => consultaPlaca.current === consulta && !consulta.signal.aborted;
        setBuscandoVehiculo(true);
        setEstadoPlaca('Buscando en el taller…');
        setMostrarRespaldo(false);

        try {
            const vehiculo = await buscarFichaPorPlaca(placa, consulta.signal);
            if (!vigente()) return;

            setVehiculoExistente(vehiculo);
            setHistorialVehiculo([]);
            if (!vehiculo) {
                setEstadoPlaca('Consultando datos del vehículo…');
                try {
                    const resultado = await consultarPlacaExterna(placa, consulta.signal);
                    if (!vigente()) return;
                    if (resultado.marca && resultado.modelo && resultado.anio) {
                        aplicarFicha({ marca: resultado.marca, modelo: resultado.modelo, anio: resultado.anio });
                        setEstadoPlaca('Datos encontrados. Revisa la ficha y completa el color si lo necesitas.');
                        return;
                    }
                    const mensajes: Record<string, string> = {
                        sin_resultado: 'La fuente externa no encontró la placa. Puedes completar los campos.',
                        cupo_agotado: 'Se agotó el cupo de consultas de hoy. Puedes completar los campos.',
                    };
                    setEstadoPlaca(mensajes[resultado.codigo ?? ''] ??
                        'Placa nueva para el taller. La consulta automática no está disponible. Puedes completar los campos.');
                } catch {
                    if (!vigente()) return;
                    setEstadoPlaca('Placa nueva para el taller. La consulta automática no respondió. Puedes completar los campos.');
                }
                setMostrarRespaldo(true);
                return;
            }

            setBuscandoVehiculo(false);
            aplicarFicha({
                marca: vehiculo.marca,
                modelo: vehiculo.modelo ?? '',
                anio: vehiculo.anio ? String(vehiculo.anio) : '',
                color: vehiculo.color ?? '',
            });
            setMostrarPegado(false);
            setResultadoPegado('');
            setEstadoPlaca('Vehículo registrado en el taller.');
            setCargandoHistorial(true);
            const { data: historial } = await supabase
                .from('ordenes')
                .select('id, codigo, estado, fecha_ingreso, fecha_estimada, notas_publicas, precio_total')
                .eq('vehiculo_id', vehiculo.id)
                .order('fecha_ingreso', { ascending: false })
                .limit(10)
                .abortSignal(consulta.signal);
            if (!vigente()) return;
            setHistorialVehiculo(historial ?? []);
            setHistorialAbierto(true);
        } catch {
            if (vigente()) {
                setEstadoPlaca('No pudimos consultar el taller. Puedes pegar el resultado del portal o llenar los campos.');
                setMostrarRespaldo(true);
            }
        } finally {
            if (vigente()) {
                consultaPlaca.current = null;
                setBuscandoVehiculo(false);
                setCargandoHistorial(false);
            }
        }
    };

    const copiarPlaca = () => {
        const texto = normalizarPlaca(vPlaca);
        const consulta = navigator.clipboard?.writeText(texto);
        if (!consulta) {
            setEstadoPlaca(`Copia esta placa para consultarla: ${texto}.`);
            return;
        }
        void consulta.catch(() => {
            setEstadoPlaca(`Copia esta placa para consultarla: ${texto}.`);
        });
    };

    const aplicarResultado = (texto: string) => {
        const { placa, marca, modelo, anio } = extraerResultadoPlaca(texto);
        if (placa && normalizarPlaca(placa) !== normalizarPlaca(vPlaca)) {
            setEstadoPlaca('El resultado corresponde a otra placa.');
            return;
        }
        if (!marca && !modelo && !anio) {
            setEstadoPlaca('No encontramos marca, modelo ni año. Copia los datos con sus etiquetas o ingrésalos a mano.');
            return;
        }
        aplicarFicha({
            ...(marca && { marca }),
            ...(modelo && { modelo }),
            ...(anio && { anio }),
        });
        setEstadoPlaca(marca && modelo && anio
            ? 'Resultado importado. Revisa los datos del vehículo.'
            : 'Resultado parcial. Completa los datos que falten.');
        setMostrarPegado(false);
        setResultadoPegado('');
    };

    const obtenerClienteDelVehiculo = async (vehiculo: VehiculoResult | null) => {
        if (clienteId || !vehiculo?.cliente_id) return clienteId;
        const { data, error } = await supabase
            .from('clientes')
            .select('id, nombres, telefono, email, cedula, notas')
            .eq('id', vehiculo.cliente_id)
            .maybeSingle();
        if (error) throw new Error('No se pudo comprobar el cliente del vehículo. Intenta nuevamente.');
        return data && esClienteRegistrado(data) ? data.id : null;
    };

    const continuarConVehiculo = () => {
        const placa = normalizarPlaca(vPlaca);
        if (!/^[A-Z0-9]{2,10}$/.test(placa) || !sanitizarTexto(ficha.marca)) {
            setErrorMsg('Ingresa una placa válida y la marca del vehículo.');
            return;
        }
        if (ficha.anio && !/^\d{4}$/.test(ficha.anio)) {
            setErrorMsg('Ingresa un año de cuatro dígitos.');
            return;
        }
        setErrorMsg(null);
        setStep('orden');
    };

    // ── Manejar fotos locales (preview antes de crear orden) ──────────────────
    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const nuevas: PhotoPreview[] = Array.from(files).map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setPhotos(prev => [...prev, ...nuevas]);
    };

    const removePhoto = (i: number) => {
        setPhotos(prev => {
            URL.revokeObjectURL(prev[i].preview);
            return prev.filter((_, idx) => idx !== i);
        });
    };

    // ── Subir fotos a Cloudinary después de crear la orden ───────────────────────
    const uploadPhotos = async (oid: string) => {
        if (photos.length === 0) return;
        setUploadingPhotos(true);
        setPhotoError(null);

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            setPhotoError('Faltan credenciales de Cloudinary en el entorno.');
            setUploadingPhotos(false);
            return;
        }

        for (const photo of photos) {
            try {
                const formData = new FormData();
                formData.append('file', photo.file);
                formData.append('upload_preset', uploadPreset);
                formData.append('folder', `sucolor/ordenes/${oid}`);

                const res = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

                if (!res.ok) {
                    const errTxt = await res.text();
                    throw new Error(`Cloudinary HTTP error ${res.status}: ${errTxt}`);
                }

                const data = await res.json();
                const secureUrl = data.secure_url;

                if (!secureUrl) throw new Error('Cloudinary no devolvió una secure_url');

                // Guardar la URL optimizada en la base de datos (anulando bucket y path de supabase)
                const { error: errorFoto } = await supabase.from('media').insert({
                    orden_id: oid,
                    tipo: 'FOTO',
                    categoria: 'ANTES',
                    storage_bucket: null,
                    storage_path: null,
                    url: secureUrl,
                });
                if (errorFoto) throw new Error('La foto se subió, pero no se guardó en la orden: ' + errorFoto.message);
            } catch (err: any) {
                setPhotoError(`Error al subir foto: ${err.message}`);
                console.error('Cloudinary upload error:', err);
            }
        }
        setUploadingPhotos(false);
    };

    // ── Guardar orden ─────────────────────────────────────────────────────────
    const guardarOrden = async () => {
        // El ref bloquea también los clics que llegan antes del siguiente render.
        if (envioOrdenBloqueado.current) return;
        envioOrdenBloqueado.current = true;
        setErrorMsg(null);
        setSaving(true);
        let ordenCreada = false;

        try {
            let vehiculo = vehiculoExistente;
            if (!vehiculo && !clienteId) {
                // También conserva el propietario al continuar sin pulsar «Buscar placa».
                vehiculo = await buscarFichaPorPlaca(normalizarPlaca(vPlaca));
            }
            const clienteOrden = await obtenerClienteDelVehiculo(vehiculo);
            const { data, error } = await supabase
                .rpc('crear_orden_con_vehiculo', {
                    p_vehiculo: {
                        placa: normalizarPlaca(vPlaca),
                        marca: sanitizarTexto(ficha.marca),
                        modelo: sanitizarTexto(ficha.modelo) || null,
                        anio: ficha.anio ? Number(ficha.anio) : null,
                        color: sanitizarTexto(ficha.color) || null,
                    },
                    p_vehiculo_editado: vehiculoExistente?.id ?? null,
                    p_ediciones: camposEditados.current,
                    p_orden: {
                        cliente_id: clienteOrden,
                        prioridad: oPrioridad,
                        fecha_estimada: oFechaEst || null,
                        notas_publicas: oNotasPublicas ? sanitizarTexto(oNotasPublicas) : null,
                        notas_internas: oNotasInternas ? sanitizarTexto(oNotasInternas) : null,
                        precio_total: oPrecio ? Number(oPrecio) : null,
                        monto_entrada: oEntrada ? Number(oEntrada) : null,
                        monto_pagado: oEntrada ? Number(oEntrada) : null,
                    },
                })
                .single<{ codigo: string; id: string }>();
            if (error) throw new Error(error.message);
            if (!data) throw new Error('No se recibió la confirmación de la orden.');

            ordenCreada = true;
            setOrdenId(data.id);
            setNuevaOrdenCodigo(data.codigo);
            await uploadPhotos(data.id);
            setStep('confirmado');
            sonidoOrdenCreada();
        } catch (error) {
            if (ordenCreada) {
                // Un fallo posterior al guardado no debe permitir otra inserción.
                setPhotoError('La orden se creó, pero no se pudo completar el proceso. Revisa sus fotos desde Ver Orden.');
                setStep('confirmado');
            } else {
                setErrorMsg('Error al crear la orden: ' + (error instanceof Error ? error.message : 'Inténtalo nuevamente.'));
                sonidoError();
            }
        } finally {
            setUploadingPhotos(false);
            setSaving(false);
            // Tras el éxito solo «Nueva orden» habilita una nueva creación.
            if (!ordenCreada) envioOrdenBloqueado.current = false;
        }
    };

    // ── Reset completo ────────────────────────────────────────────────────────
    const reset = () => {
        envioOrdenBloqueado.current = false;
        setErrorMsg(null);
        setPhotoError(null);
        setOEntrada('');
        setStep('cliente');
        setClienteId(null);
        setOrdenId(null);
        setClienteSeleccionado(null);
        setVehiculoExistente(null);
        setCNombres('');
        setCTel('');
        setClienteBusqueda('');
        camposEditados.current = {};
        cambiarPlaca('');
        setFicha(fichaVacia);
        setHistorialVehiculo([]);
        setOPrioridad('NORMAL');
        setOFechaEst('');
        setONotasPublicas('');
        setONotasInternas('');
        setOPrecio('');
        photos.forEach(p => URL.revokeObjectURL(p.preview));
        setPhotos([]);
    };

    if (suscripcionVencida) {
        return (
            <DisenoAdministracion>
                <section className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
                        <div>
                            <h1 className="text-xl font-semibold">Suscripción vencida</h1>
                            <p className="mt-2 text-sm leading-relaxed">
                                No puedes ingresar órdenes nuevas hasta renovar tu suscripción.
                                Puedes consultar y terminar las órdenes que ya están en el taller.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/administracion/orders')}
                                className="mt-5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
                            >
                                Ver órdenes actuales
                            </button>
                        </div>
                    </div>
                </section>
            </DisenoAdministracion>
        );
    }

    return (
        <DisenoAdministracion>
            <div className="max-w-xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                        Nueva Orden
                    </h1>
                    <p className="text-sm text-[rgba(15,23,42,0.60)] mt-0.5">
                        Ingresa un vehículo al taller
                    </p>
                </div>

                {/* Stepper */}
                {step !== 'confirmado' && (
                    <div className="flex items-center gap-1 sm:gap-2">
                        {PASOS.map((p, i) => {
                            const done =
                                (step === 'vehiculo' && i === 0) || (step === 'orden' && i <= 1);
                            const active = p.id === step;
                            return (
                                <div key={p.id} className="flex flex-1 items-center gap-1 sm:gap-2">
                                    <div
                                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-full transition-all sm:gap-1.5 sm:px-3 ${active ? 'text-white' : done ? 'text-[#F97316]' : 'text-[rgba(15,23,42,0.50)] bg-[rgba(15,23,42,0.05)]'}`}
                                        style={
                                            active
                                                ? { background: '#F97316' }
                                                : done
                                                    ? { background: 'rgba(249, 115, 22,0.10)' }
                                                    : {}
                                        }
                                    >
                                        <p.icon className="w-3 h-3" />
                                        {p.label}
                                    </div>
                                    {i < PASOS.length - 1 && (
                                        <ChevronRight className="w-3 h-3 text-[rgba(11,18,32,0.25)] flex-shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {errorMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-[#EF4444]"
                        style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.15)',
                        }}
                    >
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {errorMsg}
                    </motion.div>
                )}

                {/* ── PASO 1: CLIENTE ──────────────────────────────────────────── */}
                {step === 'cliente' && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card space-y-5"
                        style={{ padding: '24px' }}
                    >
                        <h2 className="text-sm font-semibold text-[#0F172A]">Datos del cliente</h2>

                        {/* Búsqueda por nombre, teléfono o placa */}
                        <div className="space-y-2">
                            <label className="form-label">¿Cliente existente?</label>
                            <p className="text-[11px] text-[rgba(15,23,42,0.60)] -mt-1">
                                Búsqueda por nombre, teléfono{' '}
                                <span className="font-semibold text-[#F97316]">
                                    o número de placa
                                </span>
                            </p>
                            <div className="flex gap-2">
                                <input
                                    value={clienteBusqueda}
                                    onChange={e => setClienteBusqueda(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && buscarCliente()}
                                    placeholder="Ej: Juan Pérez, 0989..., ABC-1234"
                                    className="input-field flex-1"
                                />
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={buscarCliente}
                                    disabled={buscandoCliente}
                                    className="btn-secondary text-sm px-4 flex items-center gap-1.5"
                                >
                                    {buscandoCliente ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Search className="w-3.5 h-3.5" /> Buscar
                                        </>
                                    )}
                                </motion.button>
                            </div>
                            <AnimatePresence>
                                {clientesEncontrados.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="border border-[rgba(15,23,42,0.08)] rounded-xl overflow-hidden bg-white shadow-sm"
                                    >
                                        {clientesEncontrados.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => seleccionarCliente(c)}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-[rgba(255,81,0,0.04)] transition-colors flex items-center justify-between border-b border-[rgba(15,23,42,0.06)] last:border-0"
                                            >
                                                <span className="font-medium text-[#0B1220]">
                                                    {c.nombres}
                                                </span>
                                                <span className="text-[rgba(11,18,32,0.40)] text-xs">
                                                    {c.telefono}
                                                </span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="border-t border-[rgba(15,23,42,0.07)] pt-4 space-y-4">
                            <p className="form-label">O registra uno nuevo</p>
                            <div>
                                <label className="form-label">Nombre completo *</label>
                                <input
                                    value={cNombres}
                                    onChange={e => setCNombres(e.target.value)}
                                    placeholder="Jandry Saritama"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="form-label">Teléfono</label>
                                <input
                                    value={cTel}
                                    onChange={e => setCTel(e.target.value)}
                                    placeholder="0989575378"
                                    className="input-field"
                                />
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={guardarCliente}
                                disabled={saving}
                                className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Registrar y continuar <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={saltarCliente}
                                disabled={saving}
                                className="btn-secondary w-full text-sm"
                            >
                                Omitir este paso / Registro Rápido
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ── PASO 2: VEHÍCULO ─────────────────────────────────────────── */}
                {step === 'vehiculo' && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card space-y-5"
                        style={{ padding: '24px' }}
                    >
                        {clienteSeleccionado ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(249, 115, 22,0.06)] border border-[rgba(249, 115, 22,0.12)]">
                                <User className="w-3.5 h-3.5 text-[#F97316] flex-shrink-0" />
                                <span className="text-xs font-medium text-[#F97316]">
                                    {clienteSeleccionado.nombres}
                                </span>
                                {clienteSeleccionado.telefono && (
                                    <span className="text-xs text-[rgba(11,18,32,0.40)] ml-auto">
                                        {clienteSeleccionado.telefono}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.04)] border border-[rgba(15,23,42,0.08)]">
                                <User className="w-3.5 h-3.5 text-[rgba(11,18,32,0.40)] flex-shrink-0" />
                                <span className="text-xs font-medium text-[rgba(11,18,32,0.50)]">
                                    Sin datos del cliente · No se creará un contacto
                                </span>
                            </div>
                        )}

                        <h2 className="text-sm font-semibold text-[#0B1220]">Datos del vehículo</h2>

                        <div className="space-y-2">
                            <label className="form-label" htmlFor="orden-placa">Placa *</label>
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 max-[359px]:grid-cols-1">
                                <input
                                    id="orden-placa"
                                    value={vPlaca}
                                    onChange={e => cambiarPlaca(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
                                        e.preventDefault();
                                        void buscarVehiculo();
                                    }}
                                    placeholder="ABC-1234"
                                    autoCapitalize="characters"
                                    autoComplete="off"
                                    aria-describedby="orden-estado-placa"
                                    className="input-field min-w-0 font-mono uppercase"
                                />
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.96 }}
                                    onClick={buscarVehiculo}
                                    disabled={buscandoVehiculo || cargandoHistorial}
                                    className="btn-secondary flex items-center justify-center gap-1.5 whitespace-nowrap px-3 text-sm"
                                >
                                    {buscandoVehiculo ? (
                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Search className="w-3.5 h-3.5" aria-hidden="true" />
                                    )}
                                    Buscar placa
                                </motion.button>
                            </div>
                            <p id="orden-estado-placa" role="status" className="text-sm text-slate-600">
                                {estadoPlaca}
                            </p>
                            {mostrarRespaldo && (
                                <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                                    <p className="text-sm text-slate-600">
                                        Consulta la placa en la otra pestaña y copia los datos con sus etiquetas.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <a
                                            href={URL_CONSULTAS_ECUADOR}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={copiarPlaca}
                                            className="btn-secondary inline-flex text-sm"
                                        >
                                            Copiar placa y abrir Consultas Ecuador
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setMostrarPegado(!mostrarPegado)}
                                            aria-expanded={mostrarPegado}
                                            className="btn-secondary text-sm"
                                        >
                                            Pegar resultado
                                        </button>
                                    </div>
                                    {mostrarPegado && (
                                        <div className="space-y-2">
                                            <label className="form-label" htmlFor="orden-resultado-placa">
                                                Resultado de Consultas Ecuador
                                            </label>
                                            <textarea
                                                id="orden-resultado-placa"
                                                className="input-field"
                                                rows={4}
                                                maxLength={12000}
                                                value={resultadoPegado}
                                                onChange={e => setResultadoPegado(e.target.value)}
                                                onPaste={e => {
                                                    const texto = e.clipboardData.getData('text/plain').slice(0, 12000);
                                                    if (!texto) return;
                                                    e.preventDefault();
                                                    setResultadoPegado(texto);
                                                    aplicarResultado(texto);
                                                }}
                                                placeholder={'Marca: …\nModelo: …\nAño: …'}
                                            />
                                            <button type="button" onClick={() => aplicarResultado(resultadoPegado)} className="btn-secondary text-sm">
                                                Aplicar resultado
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {vehiculoExistente && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-2"
                                >
                                    {/* Tarjeta vehículo encontrado */}
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(22,163,74,0.25)] bg-[rgba(22,163,74,0.05)]">
                                        <Car className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[#0B1220]">
                                                {vehiculoExistente.placa} · {vehiculoExistente.marca}{' '}
                                                {vehiculoExistente.modelo}
                                            </p>
                                            <p className="text-xs text-[rgba(11,18,32,0.45)]">
                                                {vehiculoExistente.anio} · {vehiculoExistente.color}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Historial médico del vehículo */}
                                    <div
                                        className="rounded-xl border border-[rgba(249,115,22,0.18)] overflow-hidden"
                                        style={{ background: 'rgba(249,115,22,0.03)' }}
                                    >
                                        {/* Encabezado colapsable */}
                                        <button
                                            onClick={() => setHistorialAbierto(h => !h)}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[rgba(249,115,22,0.05)] transition-colors"
                                        >
                                            <ClipboardList className="w-3.5 h-3.5 text-[#F97316]" />
                                            <span className="text-xs font-semibold text-[#F97316] flex-1 text-left">
                                                Historial de visitas
                                            </span>
                                            {cargandoHistorial ? (
                                                <Loader2 className="w-3.5 h-3.5 text-[#F97316] animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="text-[10px] text-[rgba(11,18,32,0.40)] mr-1">
                                                        {historialVehiculo.length} {historialVehiculo.length === 1 ? 'visita' : 'visitas'}
                                                    </span>
                                                    <ChevronDown
                                                        className="w-3.5 h-3.5 text-[rgba(11,18,32,0.35)] transition-transform"
                                                        style={{ transform: historialAbierto ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                                    />
                                                </>
                                            )}
                                        </button>

                                        {/* Lista de órdenes */}
                                        <AnimatePresence>
                                            {historialAbierto && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    {cargandoHistorial ? (
                                                        <div className="flex justify-center py-6">
                                                            <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
                                                        </div>
                                                    ) : historialVehiculo.length === 0 ? (
                                                        <p className="text-xs text-[rgba(11,18,32,0.40)] text-center py-5">
                                                            Primera vez en el taller 🎉
                                                        </p>
                                                    ) : (
                                                        <div className="divide-y divide-[rgba(15,23,42,0.06)]">
                                                            {historialVehiculo.map((orden, idx) => {
                                                                const estadoColors: Record<string, { bg: string; text: string }> = {
                                                                    RECIBIDO: { bg: 'rgba(59,130,246,0.10)', text: '#2563EB' },
                                                                    LATONERIA: { bg: 'rgba(234,179,8,0.10)', text: '#A16207' },
                                                                    PREPARACION: { bg: 'rgba(249,115,22,0.10)', text: '#C2550D' },
                                                                    PINTURA: { bg: 'rgba(168,85,247,0.10)', text: '#7E22CE' },
                                                                    SECADO: { bg: 'rgba(99,102,241,0.10)', text: '#4338CA' },
                                                                    PULIDO_DETALLES: { bg: 'rgba(236,72,153,0.10)', text: '#BE185D' },
                                                                    TERMINADO: { bg: 'rgba(22,163,74,0.10)', text: '#15803D' },
                                                                    ENTREGADO: { bg: 'rgba(15,23,42,0.07)', text: 'rgba(11,18,32,0.50)' },
                                                                };
                                                                const estadoLabels: Record<string, string> = {
                                                                    RECIBIDO: 'Recibido', LATONERIA: 'Latonería',
                                                                    PREPARACION: 'Preparación', PINTURA: 'Pintura',
                                                                    SECADO: 'Secado', PULIDO_DETALLES: 'Pulido',
                                                                    TERMINADO: 'Terminado', ENTREGADO: 'Entregado',
                                                                };
                                                                const col = estadoColors[orden.estado] ?? { bg: 'rgba(15,23,42,0.07)', text: 'rgba(11,18,32,0.50)' };
                                                                const fmtFecha = (d: string | null) => {
                                                                    if (!d) return '—';
                                                                    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                                                                };
                                                                return (
                                                                    <div key={orden.id} className="px-4 py-3">
                                                                        {/* Código + estado */}
                                                                        <div className="flex items-center justify-between mb-1.5">
                                                                            <span
                                                                                className="font-mono text-[11px] font-bold tracking-widest cursor-pointer hover:text-[#F97316] transition-colors text-[#0B1220]"
                                                                                onClick={() => navigate(`/administracion/orders/${orden.id}`)}
                                                                            >
                                                                                #{idx + 1} · {orden.codigo}
                                                                            </span>
                                                                            <span
                                                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                                                style={{ background: col.bg, color: col.text }}
                                                                            >
                                                                                {estadoLabels[orden.estado] ?? orden.estado}
                                                                            </span>
                                                                        </div>
                                                                        {/* Fechas */}
                                                                        <div className="flex items-center gap-3 mb-1">
                                                                            <div className="flex items-center gap-1">
                                                                                <Calendar className="w-3 h-3 text-[rgba(15,23,42,0.30)]" />
                                                                                <span className="text-[11px] text-[rgba(11,18,32,0.50)]">
                                                                                    {fmtFecha(orden.fecha_ingreso)}
                                                                                </span>
                                                                            </div>
                                                                            {orden.fecha_estimada && (
                                                                                <div className="flex items-center gap-1">
                                                                                    <CalendarCheck className="w-3 h-3 text-[rgba(15,23,42,0.30)]" />
                                                                                    <span className="text-[11px] text-[rgba(11,18,32,0.50)]">
                                                                                        {fmtFecha(orden.fecha_estimada)}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            {orden.precio_total != null && (
                                                                                <span className="ml-auto text-[11px] font-semibold text-[#0B1220]">
                                                                                    ${orden.precio_total.toFixed(2)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {/* Notas */}
                                                                        {orden.notas_publicas && (
                                                                            <p className="text-[11px] text-[rgba(11,18,32,0.45)] leading-relaxed line-clamp-2">
                                                                                {orden.notas_publicas}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {([
                                ['marca', 'Marca *', 'Toyota'],
                                ['modelo', 'Modelo', 'Corolla'],
                                ['anio', 'Año', '2020'],
                                ['color', 'Color', 'Rojo'],
                            ] as const).map(([campo, etiqueta, ejemplo]) => {
                                const id = `orden-vehiculo-${campo}`;
                                const filaCompleta = campo === 'modelo' || campo === 'marca';
                                return (
                                    <div key={campo} className={filaCompleta ? 'col-span-2 sm:col-span-1' : ''}>
                                        <label className="form-label" htmlFor={id}>{etiqueta}</label>
                                        {campo === 'modelo' ? (
                                            <textarea
                                                id={id}
                                                value={ficha.modelo}
                                                onChange={e => editarFicha('modelo', e.target.value.replace(/[\r\n]+/g, ' '))}
                                                placeholder={ejemplo}
                                                rows={2}
                                                className="input-field block resize-y"
                                            />
                                        ) : (
                                            <input
                                                id={id}
                                                value={ficha[campo]}
                                                onChange={e => editarFicha(campo, e.target.value)}
                                                placeholder={ejemplo}
                                                inputMode={campo === 'anio' ? 'numeric' : undefined}
                                                maxLength={campo === 'anio' ? 4 : undefined}
                                                className="input-field"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Fotos del ANTES */}
                        <div className="space-y-3 border-t border-slate-200/50 pt-4">
                            <div className="flex items-center gap-2">
                                <Camera className="w-4 h-4 text-[#F97316]" />
                                <p className="text-sm font-semibold text-[#0F172A]">
                                    Fotos del vehículo (ANTES)
                                </p>
                                <span className="ml-auto text-xs text-[rgba(11,18,32,0.40)]">
                                    {photos.length} foto{photos.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div
                                className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-150"
                                style={{ borderColor: 'rgba(15,23,42,0.12)' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = '#F97316')}
                                onMouseLeave={e =>
                                    (e.currentTarget.style.borderColor = 'rgba(15,23,42,0.12)')
                                }
                                onClick={() => fileRef.current?.click()}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={e => handleFiles(e.target.files)}
                                />
                                <Upload className="w-5 h-5 text-[rgba(15,23,42,0.40)]" />
                                <p className="text-sm text-[rgba(15,23,42,0.60)] text-center">
                                    Click o arrastra fotos del{' '}
                                    <span className="font-semibold text-[#F97316]">antes</span>
                                </p>
                                <p className="text-xs text-[rgba(11,18,32,0.30)]">
                                    Se subirán al guardar la orden
                                </p>
                            </div>
                            {photos.length > 0 && (
                                <div className="grid grid-cols-4 gap-2">
                                    <AnimatePresence>
                                        {photos.map((p, i) => (
                                            <motion.div
                                                key={p.preview}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="group relative aspect-square rounded-xl overflow-hidden bg-[rgba(15,23,42,0.04)] border border-[rgba(15,23,42,0.08)]"
                                            >
                                                <img
                                                    src={p.preview}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    onClick={() => removePhoto(i)}
                                                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    consultaPlaca.current?.abort();
                                    consultaPlaca.current = null;
                                    setBuscandoVehiculo(false);
                                    setCargandoHistorial(false);
                                    if (buscandoVehiculo) setEstadoPlaca('');
                                    setStep('cliente');
                                }}
                                className="btn-secondary flex-1"
                            >
                                ← Volver
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={continuarConVehiculo}
                                disabled={buscandoVehiculo}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                Continuar <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ── PASO 3: ORDEN ────────────────────────────────────────────── */}
                {step === 'orden' && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card space-y-5"
                        style={{ padding: '24px' }}
                    >
                        <h2 className="text-sm font-semibold text-[#0F172A]">Datos de la orden</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="form-label">Prioridad</label>
                                <select
                                    value={oPrioridad}
                                    onChange={e => setOPrioridad(e.target.value)}
                                    className="input-field"
                                >
                                    {PRIORIDADES.map(p => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Fecha estimada de entrega</label>
                                <input
                                    value={oFechaEst}
                                    onChange={e => setOFechaEst(e.target.value)}
                                    type="date"
                                    className="input-field"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="form-label">Valor total del trabajo ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[rgba(11,18,32,0.40)]">
                                        $
                                    </span>
                                    <input
                                        value={oPrecio}
                                        onChange={e => setOPrecio(e.target.value)}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="input-field pl-7"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="form-label">
                                    Monto de entrada / anticipo ($)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[rgba(11,18,32,0.40)]">
                                        $
                                    </span>
                                    <input
                                        value={oEntrada}
                                        onChange={e => setOEntrada(e.target.value)}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="input-field pl-7"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Resumen saldo */}
                        {(oPrecio || oEntrada) &&
                            (() => {
                                const total = parseFloat(oPrecio) || 0;
                                const entrada = parseFloat(oEntrada) || 0;
                                const saldo = total - entrada;
                                return (
                                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[rgba(15,23,42,0.03)] border border-[rgba(15,23,42,0.07)]">
                                        <div className="text-center">
                                            <p className="text-[10px] font-semibold text-[rgba(11,18,32,0.40)] uppercase tracking-wider mb-0.5">
                                                Total
                                            </p>
                                            <p className="text-sm font-bold text-[#0B1220]">
                                                ${total.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-center border-x border-[rgba(15,23,42,0.07)]">
                                            <p className="text-[10px] font-semibold text-[rgba(11,18,32,0.40)] uppercase tracking-wider mb-0.5">
                                                Entrada
                                            </p>
                                            <p className="text-sm font-bold text-[#16A34A]">
                                                ${entrada.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-semibold text-[rgba(11,18,32,0.40)] uppercase tracking-wider mb-0.5">
                                                Saldo
                                            </p>
                                            <p
                                                className={`text-sm font-bold ${saldo > 0 ? 'text-[#FF5100]' : 'text-[#16A34A]'}`}
                                            >
                                                ${saldo.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        <div>
                            <label className="form-label">
                                Descripción del trabajo (visible al cliente)
                            </label>
                            <textarea
                                value={oNotasPublicas}
                                onChange={e => setONotasPublicas(e.target.value)}
                                rows={3}
                                placeholder="Ej: Reparación de capó, pintura completa..."
                                className="input-field resize-none"
                            />
                        </div>
                        <div>
                            <label className="form-label">Notas internas (solo admin)</label>
                            <textarea
                                value={oNotasInternas}
                                onChange={e => setONotasInternas(e.target.value)}
                                rows={2}
                                placeholder="Observaciones del taller..."
                                className="input-field resize-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('vehiculo')}
                                disabled={saving}
                                className="btn-secondary flex-1"
                            >
                                ← Volver
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={guardarOrden}
                                disabled={saving}
                                aria-busy={saving}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                        {uploadingPhotos ? 'Subiendo fotos…' : 'Creando orden…'}
                                    </>
                                ) : (
                                    '✓ Crear Orden'
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ── CONFIRMADO ───────────────────────────────────────────────── */}
                {step === 'confirmado' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card space-y-5"
                        style={{ padding: '32px' }}
                    >
                        <div className="text-center space-y-3">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                                style={{ background: 'rgba(22,163,74,0.10)' }}
                            >
                                <CheckCircle className="w-7 h-7 text-[#16A34A]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#0F172A]">¡Orden creada!</h2>
                            <p className="text-sm text-[rgba(15,23,42,0.60)]">
                                Código de seguimiento:
                            </p>
                            <p className="font-mono-code text-4xl font-bold text-[#F97316]">
                                {nuevaOrdenCodigo}
                            </p>
                        </div>

                        {/* Estado de carga de fotos */}
                        {uploadingPhotos && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(249, 115, 22,0.06)] border border-[rgba(249, 115, 22,0.12)]">
                                <Loader2 className="w-4 h-4 text-[#F97316] animate-spin flex-shrink-0" />
                                <span className="text-sm text-[#F97316] font-medium">
                                    Subiendo fotos del antes...
                                </span>
                            </div>
                        )}
                        {!uploadingPhotos && photos.length > 0 && !photoError && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(22,163,74,0.06)] border border-[rgba(22,163,74,0.15)]">
                                <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                                <span className="text-sm text-[#16A34A] font-medium">
                                    {photos.length} foto{photos.length !== 1 ? 's' : ''} subida
                                    {photos.length !== 1 ? 's' : ''} correctamente
                                </span>
                            </div>
                        )}
                        {photoError && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)]">
                                <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                                <span className="text-sm text-[#EF4444]">{photoError}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/administracion/orders')}
                                className="btn-secondary flex-1"
                            >
                                Ir a Órdenes
                            </button>
                            {ordenId && (
                                <button
                                    onClick={() => navigate(`/administracion/orders/${ordenId}`)}
                                    className="btn-secondary flex-1"
                                >
                                    Ver Orden
                                </button>
                            )}
                            <motion.button whileTap={{ scale: 0.96 }} onClick={reset} className="btn-primary flex-1">
                                Nueva orden
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>
        </DisenoAdministracion>
    );
}
