import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, User, Car, FileText, CheckCircle,
    Loader2, AlertTriangle, Search, Upload, X, Camera, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';

type Step = 'cliente' | 'vehiculo' | 'orden' | 'confirmado';
const PRIORIDADES = ['NORMAL', 'URGENTE'];
const PASOS = [
    { id: 'cliente', label: 'Cliente', icon: User },
    { id: 'vehiculo', label: 'Vehículo', icon: Car },
    { id: 'orden', label: 'Orden', icon: FileText },
];

interface ClienteResult { id: string; nombres: string; telefono?: string; }
interface VehiculoResult { id: string; placa: string; marca: string; modelo?: string; anio?: number; color?: string; cliente_id?: string; }
interface PhotoPreview { file: File; preview: string; }

export function NuevaOrdenPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('cliente');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // IDs guardados
    const [clienteId, setClienteId] = useState<string | null>(null);
    const [vehiculoId, setVehiculoId] = useState<string | null>(null);
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
    const [placaBusqueda, setPlacaBusqueda] = useState('');
    const [buscandoVehiculo, setBuscandoVehiculo] = useState(false);
    const [vehiculoExistente, setVehiculoExistente] = useState<VehiculoResult | null>(null);
    const [vPlaca, setVPlaca] = useState('');
    const [vMarca, setVMarca] = useState('');
    const [vModelo, setVModelo] = useState('');
    const [vAnio, setVAnio] = useState('');
    const [vColor, setVColor] = useState('');

    // ── Paso 3: Orden ────────────────────────────────────────────────────────
    const [oPrioridad, setOPrioridad] = useState('NORMAL');
    const [oFechaEst, setOFechaEst] = useState('');
    const [oNotasPublicas, setONotasPublicas] = useState('');
    const [oNotasInternas, setONotasInternas] = useState('');
    const [oPrecio, setOPrecio] = useState('');
    const [oEntrada, setOEntrada] = useState('');

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
            .select('id, nombres, telefono')
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
                    .select('id, nombres, telefono')
                    .in('id', ids);
                extra = clientesPorPlaca ?? [];
            }
        }

        // Unir y deduplicar
        const todos = [...(byNombre ?? []), ...extra];
        const uniq = todos.filter((c, i) => todos.findIndex(x => x.id === c.id) === i);
        setClientesEncontrados(uniq);
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
        if (!cNombres.trim()) { setErrorMsg('El nombre completo es obligatorio.'); return; }
        setSaving(true);
        const { data, error } = await supabase.from('clientes')
            .insert({ nombres: cNombres.trim(), telefono: cTel || null })
            .select('id, nombres, telefono').single();
        setSaving(false);
        if (error) { setErrorMsg('Error al guardar el cliente: ' + error.message); return; }
        setClienteSeleccionado(data);
        setClienteId(data.id);
        setStep('vehiculo');
    };

    const saltarCliente = () => {
        setClienteSeleccionado(null);
        setClienteId(null);
        setStep('vehiculo');
    };

    // ── Buscar vehículo existente por placa ───────────────────────────────────
    const buscarVehiculo = async () => {
        const q = placaBusqueda.trim();
        if (q.length < 2) return;
        setBuscandoVehiculo(true);
        setVehiculoExistente(null);
        const { data } = await supabase
            .from('vehiculos')
            .select('id, placa, marca, modelo, anio, color, cliente_id')
            .ilike('placa', `%${q}%`)
            .limit(1)
            .single();
        if (data) {
            setVehiculoExistente(data);
            setVPlaca(data.placa ?? '');
            setVMarca(data.marca ?? '');
            setVModelo(data.modelo ?? '');
            setVAnio(data.anio ? String(data.anio) : '');
            setVColor(data.color ?? '');
        }
        setBuscandoVehiculo(false);
    };

    // ── Guardar vehículo (nuevo o usar existente) ─────────────────────────────
    const guardarVehiculo = async () => {
        setErrorMsg(null);
        if (vehiculoExistente) {
            setVehiculoId(vehiculoExistente.id);
            setStep('orden');
            return;
        }
        if (!vPlaca.trim() || !vMarca.trim()) { setErrorMsg('Placa y marca son obligatorios.'); return; }

        setSaving(true);
        let currentClienteId = clienteId;

        // Si no se asignó cliente, creamos uno temporal/anónimo para satisfacer la DB
        if (!currentClienteId) {
            const { data: anonCliente, error: errAnon } = await supabase.from('clientes')
                .insert({ nombres: 'Cliente Anónimo (Placa: ' + vPlaca.trim().toUpperCase() + ')', notas: 'Generado automáticamente por sistema al omitir cliente' })
                .select('id').single();
            if (errAnon) {
                setSaving(false);
                setErrorMsg('Error al generar cliente anónimo: ' + errAnon.message);
                return;
            }
            currentClienteId = anonCliente.id;
            // Opcional: seteamos en estado por si se usa en la orden
            setClienteId(currentClienteId);
        }

        const { data, error } = await supabase.from('vehiculos')
            .insert({
                placa: vPlaca.trim().toUpperCase(),
                marca: vMarca.trim(),
                modelo: vModelo.trim() || null,
                anio: vAnio ? parseInt(vAnio) : null,
                color: vColor || null,
                cliente_id: currentClienteId,
            })
            .select('id').single();
        setSaving(false);
        if (error) { setErrorMsg('Error al guardar el vehículo: ' + error.message); return; }
        setVehiculoId(data.id);
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
            setPhotoError("Faltan credenciales de Cloudinary en el entorno.");
            setUploadingPhotos(false);
            return;
        }

        for (const photo of photos) {
            try {
                const formData = new FormData();
                formData.append('file', photo.file);
                formData.append('upload_preset', uploadPreset);
                formData.append('folder', `sucolor/ordenes/${oid}`);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const errTxt = await res.text();
                    throw new Error(`Cloudinary HTTP error ${res.status}: ${errTxt}`);
                }

                const data = await res.json();
                const secureUrl = data.secure_url;

                if (!secureUrl) throw new Error("Cloudinary no devolvió una secure_url");

                // Guardar la URL optimizada en la base de datos (anulando bucket y path de supabase)
                await supabase.from('media').insert({
                    orden_id: oid,
                    tipo: 'FOTO',
                    categoria: 'ANTES',
                    storage_bucket: null,
                    storage_path: null,
                    url: secureUrl
                });
            } catch (err: any) {
                setPhotoError(`Error al subir foto: ${err.message}`);
                console.error("Cloudinary upload error:", err);
            }
        }
        setUploadingPhotos(false);
    };

    // ── Guardar orden ─────────────────────────────────────────────────────────
    const guardarOrden = async () => {
        setErrorMsg(null);
        setSaving(true);
        const { data, error } = await supabase.from('ordenes')
            .insert({
                cliente_id: clienteId,
                vehiculo_id: vehiculoId,
                prioridad: oPrioridad,
                fecha_estimada: oFechaEst || null,
                notas_publicas: oNotasPublicas || null,
                notas_internas: oNotasInternas || null,
                precio_total: oPrecio ? parseFloat(oPrecio) : null,
                monto_entrada: oEntrada ? parseFloat(oEntrada) : null,
                monto_pagado: oEntrada ? parseFloat(oEntrada) : null,
                share_enabled: true,
            })
            .select('codigo, id').single();
        setSaving(false);
        if (error) { setErrorMsg('Error al crear la orden: ' + error.message); return; }
        setOrdenId(data.id);
        setNuevaOrdenCodigo(data.codigo);
        // Subir fotos ya seleccionadas
        await uploadPhotos(data.id);
        setStep('confirmado');
    };

    // ── Reset completo ────────────────────────────────────────────────────────
    const reset = () => {
        setStep('cliente'); setClienteId(null); setVehiculoId(null); setOrdenId(null);
        setClienteSeleccionado(null); setVehiculoExistente(null);
        setCNombres(''); setCTel(''); setClienteBusqueda('');
        setVPlaca(''); setVMarca(''); setVModelo(''); setVAnio(''); setVColor(''); setPlacaBusqueda('');
        setOPrioridad('NORMAL'); setOFechaEst(''); setONotasPublicas(''); setONotasInternas(''); setOPrecio('');
        photos.forEach(p => URL.revokeObjectURL(p.preview));
        setPhotos([]);
    };

    return (
        <AdminLayout>
            <div className="max-w-xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Nueva Orden</h1>
                    <p className="text-sm text-[rgba(15,23,42,0.60)] mt-0.5">Ingresa un vehículo al taller</p>
                </div>

                {/* Stepper */}
                {step !== 'confirmado' && (
                    <div className="flex items-center gap-2">
                        {PASOS.map((p, i) => {
                            const done = (step === 'vehiculo' && i === 0) || (step === 'orden' && i <= 1);
                            const active = p.id === step;
                            return (
                                <div key={p.id} className="flex items-center gap-2 flex-1">
                                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${active ? 'text-white' : done ? 'text-[#F97316]' : 'text-[rgba(15,23,42,0.50)] bg-[rgba(15,23,42,0.05)]'}`}
                                        style={active ? { background: '#F97316' } : done ? { background: 'rgba(249, 115, 22,0.10)' } : {}}>
                                        <p.icon className="w-3 h-3" />
                                        {p.label}
                                    </div>
                                    {i < PASOS.length - 1 && <ChevronRight className="w-3 h-3 text-[rgba(11,18,32,0.25)] flex-shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                )}

                {errorMsg && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-[#EF4444]"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />{errorMsg}
                    </div>
                )}

                {/* ── PASO 1: CLIENTE ──────────────────────────────────────────── */}
                {step === 'cliente' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-5" style={{ padding: '24px' }}>
                        <h2 className="text-sm font-semibold text-[#0F172A]">Datos del cliente</h2>

                        {/* Búsqueda por nombre, teléfono o placa */}
                        <div className="space-y-2">
                            <label className="form-label">¿Cliente existente?</label>
                            <p className="text-[11px] text-[rgba(15,23,42,0.60)] -mt-1">Búsqueda por nombre, teléfono <span className="font-semibold text-[#F97316]">o número de placa</span></p>
                            <div className="flex gap-2">
                                <input
                                    value={clienteBusqueda}
                                    onChange={e => setClienteBusqueda(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && buscarCliente()}
                                    placeholder="Ej: Juan Pérez, 0989..., ABC-1234"
                                    className="input-field flex-1"
                                />
                                <button onClick={buscarCliente} disabled={buscandoCliente} className="btn-secondary text-sm px-4 flex items-center gap-1.5">
                                    {buscandoCliente ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-3.5 h-3.5" /> Buscar</>}
                                </button>
                            </div>
                            <AnimatePresence>
                                {clientesEncontrados.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="border border-[rgba(15,23,42,0.08)] rounded-xl overflow-hidden bg-white shadow-sm">
                                        {clientesEncontrados.map(c => (
                                            <button key={c.id} onClick={() => seleccionarCliente(c)}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-[rgba(255,81,0,0.04)] transition-colors flex items-center justify-between border-b border-[rgba(15,23,42,0.06)] last:border-0">
                                                <span className="font-medium text-[#0B1220]">{c.nombres}</span>
                                                <span className="text-[rgba(11,18,32,0.40)] text-xs">{c.telefono}</span>
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
                                <input value={cNombres} onChange={e => setCNombres(e.target.value)} placeholder="Jandry Saritama" className="input-field" />
                            </div>
                            <div>
                                <label className="form-label">Teléfono</label>
                                <input value={cTel} onChange={e => setCTel(e.target.value)} placeholder="0989575378" className="input-field" />
                            </div>
                            <button onClick={guardarCliente} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Registrar y continuar <ChevronRight className="w-4 h-4" /></>}
                            </button>
                            <button onClick={saltarCliente} disabled={saving} className="btn-secondary w-full text-sm">
                                Omitir este paso / Registro Rápido
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── PASO 2: VEHÍCULO ─────────────────────────────────────────── */}
                {step === 'vehiculo' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-5" style={{ padding: '24px' }}>
                        {clienteSeleccionado ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(249, 115, 22,0.06)] border border-[rgba(249, 115, 22,0.12)]">
                                <User className="w-3.5 h-3.5 text-[#F97316] flex-shrink-0" />
                                <span className="text-xs font-medium text-[#F97316]">{clienteSeleccionado.nombres}</span>
                                {clienteSeleccionado.telefono && <span className="text-xs text-[rgba(11,18,32,0.40)] ml-auto">{clienteSeleccionado.telefono}</span>}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.04)] border border-[rgba(15,23,42,0.08)]">
                                <User className="w-3.5 h-3.5 text-[rgba(11,18,32,0.40)] flex-shrink-0" />
                                <span className="text-xs font-medium text-[rgba(11,18,32,0.50)]">Cliente anónimo (No registrado)</span>
                            </div>
                        )}

                        <h2 className="text-sm font-semibold text-[#0B1220]">Datos del vehículo</h2>

                        {/* Búsqueda por placa existente */}
                        <div className="space-y-2">
                            <label className="form-label">¿Vehículo ya registrado? Busca por placa</label>
                            <div className="flex gap-2">
                                <input value={placaBusqueda} onChange={e => setPlacaBusqueda(e.target.value.toUpperCase())}
                                    onKeyDown={e => e.key === 'Enter' && buscarVehiculo()}
                                    placeholder="Ej: ABC-1234" className="input-field flex-1 font-mono uppercase" />
                                <button onClick={buscarVehiculo} disabled={buscandoVehiculo} className="btn-secondary text-sm px-4 flex items-center gap-1.5">
                                    {buscandoVehiculo ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-3.5 h-3.5" /> Buscar</>}
                                </button>
                            </div>
                            {vehiculoExistente && (
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(22,163,74,0.25)] bg-[rgba(22,163,74,0.05)]">
                                    <Car className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-[#0B1220]">{vehiculoExistente.placa} · {vehiculoExistente.marca} {vehiculoExistente.modelo}</p>
                                        <p className="text-xs text-[rgba(11,18,32,0.45)]">{vehiculoExistente.anio} · {vehiculoExistente.color}</p>
                                    </div>
                                    <button onClick={() => { setVehiculoExistente(null); setPlacaBusqueda(''); }}
                                        className="text-[rgba(11,18,32,0.35)] hover:text-[#EF4444] transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* Formulario de vehículo — oculto si ya hay uno existente */}
                        {!vehiculoExistente && (
                            <div className="space-y-3">
                                <p className="text-[11px] font-semibold text-[rgba(11,18,32,0.40)] uppercase tracking-wider">O ingresa uno nuevo</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="form-label">Placa *</label>
                                        <input value={vPlaca} onChange={e => setVPlaca(e.target.value)} placeholder="ABC-1234" className="input-field font-mono uppercase" />
                                    </div>
                                    <div>
                                        <label className="form-label">Marca *</label>
                                        <input value={vMarca} onChange={e => setVMarca(e.target.value)} placeholder="Toyota" className="input-field" />
                                    </div>
                                    <div>
                                        <label className="form-label">Modelo</label>
                                        <input value={vModelo} onChange={e => setVModelo(e.target.value)} placeholder="Corolla" className="input-field" />
                                    </div>
                                    <div>
                                        <label className="form-label">Año</label>
                                        <input value={vAnio} onChange={e => setVAnio(e.target.value)} placeholder="2020" className="input-field" maxLength={4} />
                                    </div>
                                    <div>
                                        <label className="form-label">Color</label>
                                        <input value={vColor} onChange={e => setVColor(e.target.value)} placeholder="Rojo" className="input-field" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fotos del ANTES */}
                        <div className="space-y-3 border-t border-slate-200/50 pt-4">
                            <div className="flex items-center gap-2">
                                <Camera className="w-4 h-4 text-[#F97316]" />
                                <p className="text-sm font-semibold text-[#0F172A]">Fotos del vehículo (ANTES)</p>
                                <span className="ml-auto text-xs text-[rgba(11,18,32,0.40)]">{photos.length} foto{photos.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div
                                className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all duration-150"
                                style={{ borderColor: 'rgba(15,23,42,0.12)' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = '#F97316')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(15,23,42,0.12)')}
                                onClick={() => fileRef.current?.click()}
                            >
                                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                                <Upload className="w-5 h-5 text-[rgba(15,23,42,0.40)]" />
                                <p className="text-sm text-[rgba(15,23,42,0.60)] text-center">
                                    Click o arrastra fotos del <span className="font-semibold text-[#F97316]">antes</span>
                                </p>
                                <p className="text-xs text-[rgba(11,18,32,0.30)]">Se subirán al guardar la orden</p>
                            </div>
                            {photos.length > 0 && (
                                <div className="grid grid-cols-4 gap-2">
                                    <AnimatePresence>
                                        {photos.map((p, i) => (
                                            <motion.div key={p.preview} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                                className="group relative aspect-square rounded-xl overflow-hidden bg-[rgba(15,23,42,0.04)] border border-[rgba(15,23,42,0.08)]">
                                                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                                                <button onClick={() => removePhoto(i)}
                                                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep('cliente')} className="btn-secondary flex-1">← Volver</button>
                            <button onClick={guardarVehiculo} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continuar <ChevronRight className="w-4 h-4" /></>}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── PASO 3: ORDEN ────────────────────────────────────────────── */}
                {step === 'orden' && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-5" style={{ padding: '24px' }}>
                        <h2 className="text-sm font-semibold text-[#0F172A]">Datos de la orden</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="form-label">Prioridad</label>
                                <select value={oPrioridad} onChange={e => setOPrioridad(e.target.value)} className="input-field">
                                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Fecha estimada de entrega</label>
                                <input value={oFechaEst} onChange={e => setOFechaEst(e.target.value)} type="date" className="input-field" />
                            </div>
                            <div className="col-span-2">
                                <label className="form-label">Valor total del trabajo ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[rgba(11,18,32,0.40)]">$</span>
                                    <input value={oPrecio} onChange={e => setOPrecio(e.target.value)}
                                        type="number" min="0" step="0.01" placeholder="0.00"
                                        className="input-field pl-7" />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="form-label">Monto de entrada / anticipo ($)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[rgba(11,18,32,0.40)]">$</span>
                                    <input value={oEntrada} onChange={e => setOEntrada(e.target.value)}
                                        type="number" min="0" step="0.01" placeholder="0.00"
                                        className="input-field pl-7" />
                                </div>
                            </div>
                        </div>
                        {/* Resumen saldo */}
                        {(oPrecio || oEntrada) && (() => {
                            const total = parseFloat(oPrecio) || 0;
                            const entrada = parseFloat(oEntrada) || 0;
                            const saldo = total - entrada;
                            return (
                                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[rgba(15,23,42,0.03)] border border-[rgba(15,23,42,0.07)]">
                                    <div className="text-center">
                                        <p className="text-[10px] font-semibold text-[rgba(11,18,32,0.40)] uppercase tracking-wider mb-0.5">Total</p>
                                        <p className="text-sm font-bold text-[#0B1220]">${total.toFixed(2)}</p>
                                    </div>
                                    <div className="text-center border-x border-[rgba(15,23,42,0.07)]">
                                        <p className="text-[10px] font-semibold text-[rgba(11,18,32,0.40)] uppercase tracking-wider mb-0.5">Entrada</p>
                                        <p className="text-sm font-bold text-[#16A34A]">${entrada.toFixed(2)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-semibold text-[rgba(11,18,32,0.40)] uppercase tracking-wider mb-0.5">Saldo</p>
                                        <p className={`text-sm font-bold ${saldo > 0 ? 'text-[#FF5100]' : 'text-[#16A34A]'}`}>${saldo.toFixed(2)}</p>
                                    </div>
                                </div>
                            );
                        })()}
                        <div>
                            <label className="form-label">Descripción del trabajo (visible al cliente)</label>
                            <textarea value={oNotasPublicas} onChange={e => setONotasPublicas(e.target.value)} rows={3}
                                placeholder="Ej: Reparación de capó, pintura completa..." className="input-field resize-none" />
                        </div>
                        <div>
                            <label className="form-label">Notas internas (solo admin)</label>
                            <textarea value={oNotasInternas} onChange={e => setONotasInternas(e.target.value)} rows={2}
                                placeholder="Observaciones del taller..." className="input-field resize-none" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep('vehiculo')} className="btn-secondary flex-1">← Volver</button>
                            <button onClick={guardarOrden} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Crear Orden'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── CONFIRMADO ───────────────────────────────────────────────── */}
                {step === 'confirmado' && (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-card space-y-5" style={{ padding: '32px' }}>
                        <div className="text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(22,163,74,0.10)' }}>
                                <CheckCircle className="w-7 h-7 text-[#16A34A]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#0F172A]">¡Orden creada!</h2>
                            <p className="text-sm text-[rgba(15,23,42,0.60)]">Código de seguimiento:</p>
                            <p className="font-mono-code text-4xl font-bold text-[#F97316]">{nuevaOrdenCodigo}</p>
                        </div>

                        {/* Estado de carga de fotos */}
                        {uploadingPhotos && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(249, 115, 22,0.06)] border border-[rgba(249, 115, 22,0.12)]">
                                <Loader2 className="w-4 h-4 text-[#F97316] animate-spin flex-shrink-0" />
                                <span className="text-sm text-[#F97316] font-medium">Subiendo fotos del antes...</span>
                            </div>
                        )}
                        {!uploadingPhotos && photos.length > 0 && !photoError && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(22,163,74,0.06)] border border-[rgba(22,163,74,0.15)]">
                                <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                                <span className="text-sm text-[#16A34A] font-medium">{photos.length} foto{photos.length !== 1 ? 's' : ''} subida{photos.length !== 1 ? 's' : ''} correctamente</span>
                            </div>
                        )}
                        {photoError && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)]">
                                <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                                <span className="text-sm text-[#EF4444]">{photoError}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => navigate('/admin/orders')} className="btn-secondary flex-1">Ir a Órdenes</button>
                            {ordenId && (
                                <button onClick={() => navigate(`/admin/orders/${ordenId}`)} className="btn-secondary flex-1">Ver Orden</button>
                            )}
                            <button onClick={reset} className="btn-primary flex-1">Nueva orden</button>
                        </div>
                    </motion.div>
                )}
            </div>
        </AdminLayout>
    );
}
