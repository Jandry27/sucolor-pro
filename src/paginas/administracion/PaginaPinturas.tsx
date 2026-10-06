import { useState } from 'react';
import { DisenoAdministracion } from '@/componentes/administracion/DisenoAdministracion';
import { ControlPinturas } from '@/componentes/administracion/pinturas/ControlPinturas';
import { InventarioPinturas } from '@/componentes/administracion/pinturas/InventarioPinturas';

export function PaginaPinturas() {
    const [seccion, setSeccion] = useState('solicitudes');
    return (
        <DisenoAdministracion>
            <div className="max-w-6xl mx-auto text-slate-800 dark:text-slate-100">
                <h1 className="text-2xl font-bold mb-2">Pinturas</h1>
                <p className="text-sm text-slate-500 mb-6">
                    Pedidos por vehículo, muestras en los locales y pinturas disponibles en el
                    taller.
                </p>
                <div
                    role="tablist"
                    aria-label="Secciones de pinturas"
                    className="flex gap-2 mb-6 border-b dark:border-slate-700 pb-3"
                >
                    {[
                        ['solicitudes', 'Pedidos y muestras'],
                        ['inventario', 'Pinturas sobrantes'],
                    ].map(([id, titulo]) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={seccion === id}
                            aria-controls="contenido-pinturas"
                            onClick={() => setSeccion(id)}
                            className={`rounded-xl px-4 py-3 text-sm font-semibold ${seccion === id ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
                        >
                            {titulo}
                        </button>
                    ))}
                </div>
                <div id="contenido-pinturas" role="tabpanel">
                    {seccion === 'solicitudes' ? <ControlPinturas /> : <InventarioPinturas />}
                </div>
            </div>
        </DisenoAdministracion>
    );
}
