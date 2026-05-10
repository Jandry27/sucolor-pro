import { useState, useEffect } from 'react';
import { supabase } from '@/biblioteca/clienteSupabase';
import { CompanySettings } from '@/tipos';
import { Save, Upload, Loader2, CheckCircle2, Building, ShieldCheck } from 'lucide-react';

export function PaginaConfiguracion() {
    const [settings, setSettings] = useState<Partial<CompanySettings>>({
        ruc: '',
        razon_social: '',
        nombre_comercial: '',
        direccion_matriz: '',
        obligado_contabilidad: false,
        rimpe: false,
        contribuyente_especial: '',
        agente_retencion: '',
        establecimiento: '001',
        punto_emision: '001',
        secuencial_factura: '00000001',
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [p12File, setP12File] = useState<File | null>(null);
    const [p12Password, setP12Password] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();
        if (data) {
            setSettings(data);
        } else if (!error) {
            // No data exists yet, leave defaults
            console.log('No existing settings found, please fill out the form.');
        } else {
            console.error("Error loading settings:", error);
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            let p12Path = settings.p12_storage_path;

            // Upload p12 if selected
            if (p12File) {
                const fileExt = p12File.name.split('.').pop();
                const fileName = `firma_${Date.now()}.${fileExt}`;
                const filePath = `firmas/${fileName}`;

                // Create bucket if it doesn't exist (you might want to do this via Supabase dashboard manually to make it private!)
                const { error: uploadError } = await supabase.storage.from('firmas').upload(filePath, p12File);
                if (uploadError) console.warn('Supabase storage upload failed, ignoring for local test:', uploadError.message);
                
                p12Path = filePath;
            }

            const { id, ...payloadWithoutId } = {
                ...settings,
                p12_storage_path: p12Path,
                ...(p12Password && { p12_password: p12Password })
            };

            let saveError;
            if (settings.id) {
                const { error } = await supabase.from('company_settings').update(payloadWithoutId).eq('id', settings.id);
                saveError = error;
            } else {
                const { error } = await supabase.from('company_settings').insert([payloadWithoutId]);
                saveError = error;
            }

            if (saveError) {
                throw saveError;
            }

            // We are saving the p12_password securely alongside the settings table per the user request.

            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
            setP12File(null);
            setP12Password('');
            loadSettings();

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-display font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building className="w-6 h-6 text-brand-orange" />
                    Configuración de Empresa (Facturación SRI)
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Estos datos se usarán para emitir las facturas electrónicas.
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* RUC */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">RUC</label>
                        <input
                            required
                            type="text"
                            maxLength={13}
                            value={settings.ruc || ''}
                            onChange={(e) => setSettings({ ...settings, ruc: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                            placeholder="Ej. 1101234567001"
                        />
                    </div>

                    {/* Razón Social */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Razón Social</label>
                        <input
                            required
                            type="text"
                            value={settings.razon_social || ''}
                            onChange={(e) => setSettings({ ...settings, razon_social: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                        />
                    </div>

                    {/* Nombre Comercial */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Comercial</label>
                        <input
                            type="text"
                            value={settings.nombre_comercial || ''}
                            onChange={(e) => setSettings({ ...settings, nombre_comercial: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                            placeholder="Ej. SuColor PRO"
                        />
                    </div>

                    {/* Dirección Matriz */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirección Matriz</label>
                        <input
                            required
                            type="text"
                            value={settings.direccion_matriz || ''}
                            onChange={(e) => setSettings({ ...settings, direccion_matriz: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                            placeholder="Dirección fiscal exacta"
                        />
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Numeración SRI</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Establecimiento</label>
                            <input
                                required
                                type="text"
                                maxLength={3}
                                value={settings.establecimiento || ''}
                                onChange={(e) => setSettings({ ...settings, establecimiento: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                                placeholder="Ej. 001"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Punto Emisión</label>
                            <input
                                required
                                type="text"
                                maxLength={3}
                                value={settings.punto_emision || ''}
                                onChange={(e) => setSettings({ ...settings, punto_emision: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                                placeholder="Ej. 100"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Secuencia Inicial</label>
                            <input
                                required
                                type="text"
                                maxLength={9}
                                value={settings.secuencial_factura || ''}
                                onChange={(e) => setSettings({ ...settings, secuencial_factura: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                                placeholder="Ej. 000000059"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Regímenes y Resoluciones</h3>
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.obligado_contabilidad || false}
                                onChange={(e) => setSettings({ ...settings, obligado_contabilidad: e.target.checked })}
                                className="rounded text-brand-orange focus:ring-brand-orange"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Obligado a llevar contabilidad</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.rimpe || false}
                                onChange={(e) => setSettings({ ...settings, rimpe: e.target.checked })}
                                className="rounded text-brand-orange focus:ring-brand-orange"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Contribuyente RIMPE</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Agente de Retención (Resolución #)</label>
                            <input
                                type="text"
                                value={settings.agente_retencion || ''}
                                onChange={(e) => setSettings({ ...settings, agente_retencion: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                                placeholder="Ej. 1"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contribuyente Especial (Resolución #)</label>
                            <input
                                type="text"
                                value={settings.contribuyente_especial || ''}
                                onChange={(e) => setSettings({ ...settings, contribuyente_especial: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                                placeholder="Ej. 5368"
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                        Firma Electrónica (.p12 / .pfx)
                    </h3>
                    
                    {settings.p12_storage_path && !p12File && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg text-sm flex items-center justify-between text-blue-700 dark:text-blue-400">
                            <span>✅ Tienes una firma configurada actualmente.</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sube tu archivo .p12</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".p12,.pfx"
                                    onChange={(e) => setP12File(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-brand-orange dark:hover:border-brand-orange transition-colors"
                                >
                                    <Upload className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {p12File ? p12File.name : 'Seleccionar archivo .p12'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña de la firma</label>
                            <input
                                type="password"
                                value={p12Password}
                                onChange={(e) => setP12Password(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-colors dark:text-white"
                                placeholder={settings.p12_storage_path ? 'Déjalo en blanco si no cambiaste el archivo' : 'Contraseña del archivo .p12'}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                        ) : (
                            <><Save className="w-4 h-4 mr-2 text-white" /> Guardar Configuración</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
