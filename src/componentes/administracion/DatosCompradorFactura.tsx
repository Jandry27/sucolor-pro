import { CheckCircle2, Loader2, Search } from 'lucide-react';

interface DatosCompradorFacturaProps {
    tipo: string;
    documento: string;
    nombre: string;
    direccion: string;
    email: string;
    telefono: string;
    buscando: boolean;
    encontrado: boolean | null;
    mensaje: string;
    bloqueado: boolean;
    onDocumento: (valor: string) => void;
    onTipo: (valor: string) => void;
    onNombre: (valor: string) => void;
    onDireccion: (valor: string) => void;
    onEmail: (valor: string) => void;
    onTelefono: (valor: string) => void;
}

const estiloCampo = 'w-full min-h-12 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const estiloEtiqueta = 'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300';

export function DatosCompradorFactura(props: DatosCompradorFacturaProps) {
    const campos = [
        { id: 'nombre', etiqueta: 'Nombre o razón social', valor: props.nombre, cambiar: props.onNombre, tipo: 'text', completar: 'name', ancho: true, requerido: true },
        { id: 'email', etiqueta: 'Correo para recibir la factura', valor: props.email, cambiar: props.onEmail, tipo: 'email', completar: 'email', requerido: true },
        { id: 'telefono', etiqueta: 'Teléfono · opcional', valor: props.telefono, cambiar: props.onTelefono, tipo: 'tel', completar: 'tel', requerido: false },
        { id: 'direccion', etiqueta: 'Dirección', valor: props.direccion, cambiar: props.onDireccion, tipo: 'text', completar: 'street-address', ancho: true, requerido: true },
    ];
    return (
        <section aria-labelledby="comprador-titulo">
            <h3 id="comprador-titulo" className="text-base font-semibold text-slate-900 dark:text-white">¿A nombre de quién?</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Ingresa su identificación para recuperar los datos guardados en SuColor.</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
                <div>
                    <label htmlFor="factura-tipo" className={estiloEtiqueta}>Documento</label>
                    <select id="factura-tipo" value={props.tipo} onChange={e => props.onTipo(e.target.value)} disabled={props.bloqueado} className={estiloCampo}>
                        <option value="05">Cédula</option><option value="04">RUC</option><option value="06">Pasaporte</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="factura-documento" className={estiloEtiqueta}>Número de identificación</label>
                    <div className="relative">
                        <input id="factura-documento" value={props.documento} onChange={e => props.onDocumento(e.target.value)} disabled={props.bloqueado} autoComplete="off" inputMode={props.tipo === '06' ? 'text' : 'numeric'} maxLength={props.tipo === '05' ? 10 : props.tipo === '04' ? 13 : 20} placeholder={props.tipo === '05' ? '10 dígitos' : props.tipo === '04' ? '13 dígitos' : 'Número de pasaporte'} aria-describedby="factura-busqueda" className={`${estiloCampo} pr-11`} />
                        <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                            {props.buscando ? <Loader2 className="h-4 w-4 animate-spin text-orange-600" /> : props.encontrado ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Search className="h-4 w-4 text-slate-400" />}
                        </span>
                    </div>
                </div>
            </div>
            <p id="factura-busqueda" role="status" aria-live="polite" className={`mt-2 min-h-5 text-xs leading-5 ${props.encontrado ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                {props.buscando ? 'Buscando cliente…' : props.mensaje || 'Puedes revisar y completar los datos antes de emitir.'}
            </p>
            <fieldset disabled={props.buscando || props.bloqueado} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <legend className="sr-only">Datos del comprador</legend>
                {campos.map(campo => (
                    <div key={campo.id} className={campo.ancho ? 'sm:col-span-2' : ''}>
                        <label htmlFor={`factura-${campo.id}`} className={estiloEtiqueta}>{campo.etiqueta}</label>
                        <input id={`factura-${campo.id}`} type={campo.tipo} autoComplete={campo.completar} required={campo.requerido} value={campo.valor} onChange={e => campo.cambiar(e.target.value)} className={estiloCampo} />
                    </div>
                ))}
            </fieldset>
        </section>
    );
}
