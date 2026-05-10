import { useState, useEffect } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import type { AdminOrder } from '@/tipos';

interface EditUpdates {
    nombres: string;
    telefono: string;
    placa: string;
    marca: string;
    modelo: string;
}

interface FormularioEdicionDetalleOrdenProps {
    order: AdminOrder;
    saving: boolean;
    onSave: (updates: EditUpdates) => Promise<void>;
    onCancel: () => void;
}

export function FormularioEdicionDetalleOrden({ order, saving, onSave, onCancel }: FormularioEdicionDetalleOrdenProps) {
    const [nombres, setNombres] = useState('');
    const [telefono, setTelefono] = useState('');
    const [placa, setPlaca] = useState('');
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');

    // Inicializar campos desde la orden al montar
    useEffect(() => {
        const clienteNombre = (order.cliente as any).nombres;
        setNombres(
            clienteNombre === 'Cliente anónimo (No registrado)' || clienteNombre === '—'
                ? ''
                : clienteNombre
        );
        setTelefono((order.cliente as any).telefono || '');
        setPlaca(order.vehiculo.placa === '—' ? '' : order.vehiculo.placa);
        setMarca(order.vehiculo.marca === '—' ? '' : order.vehiculo.marca);
        setModelo(order.vehiculo.modelo || '');
    }, [order]);

    const handleSave = async () => {
        await onSave({ nombres, telefono, placa, marca, modelo });
    };

    return (
        <div className="w-full space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <span className="font-mono-code text-xs text-[#FF5100] font-bold">
                    {order.codigo}
                </span>
                <span className="text-xs text-[rgba(11,18,32,0.40)] font-medium bg-[rgba(15,23,42,0.04)] px-2 py-0.5 rounded-md">
                    Modo Edición
                </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">
                        Cliente
                    </label>
                    <input
                        value={nombres}
                        onChange={e => setNombres(e.target.value)}
                        placeholder="Nombre del cliente"
                        className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA]"
                        disabled={!order.cliente_id}
                    />
                    {!order.cliente_id && (
                        <p className="text-[10px] text-orange-500 mt-1">
                            Orden registrada sin cliente (Anónimo)
                        </p>
                    )}
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">
                        Teléfono
                    </label>
                    <input
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                        placeholder="0999999999"
                        className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA]"
                        disabled={!order.cliente_id}
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">
                        Placa
                    </label>
                    <input
                        value={placa}
                        onChange={e => setPlaca(e.target.value)}
                        placeholder="ABC-1234"
                        className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA] font-mono uppercase"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">
                        Marca
                    </label>
                    <input
                        value={marca}
                        onChange={e => setMarca(e.target.value)}
                        placeholder="Marca"
                        className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA]"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-[rgba(11,18,32,0.40)] tracking-wider mb-1 block">
                        Modelo
                    </label>
                    <input
                        value={modelo}
                        onChange={e => setModelo(e.target.value)}
                        placeholder="Modelo"
                        className="w-full text-sm px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA]"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[rgba(15,23,42,0.06)]">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                    {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Save className="w-3.5 h-3.5" />
                    )}{' '}
                    Guardar
                </button>
                <button
                    onClick={onCancel}
                    disabled={saving}
                    className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs border-transparent hover:bg-[rgba(15,23,42,0.06)]"
                >
                    <X className="w-3.5 h-3.5" /> Cancelar
                </button>
            </div>
        </div>
    );
}
