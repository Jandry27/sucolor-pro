import { useState, useEffect } from 'react';
import { supabase } from '@/biblioteca/clienteSupabase';
import type { CompanySettings } from '@/tipos';

interface Props {
    titulo: string;
    subtitulo?: string;
    /** Extra info lines below the subtitle (e.g., vehicle info, date range) */
    infoExtra?: string[];
}

/**
 * Encabezado profesional de impresión con datos del taller.
 * Carga automáticamente company_settings de Supabase.
 * Solo se muestra al imprimir (hidden en pantalla).
 */
export function EncabezadoImpresion({ titulo, subtitulo, infoExtra }: Props) {
    const [empresa, setEmpresa] = useState<Partial<CompanySettings> | null>(null);

    useEffect(() => {
        supabase
            .from('company_settings')
            .select('ruc, razon_social, nombre_comercial, direccion_matriz')
            .limit(1)
            .maybeSingle()
            .then(({ data }) => {
                if (data) setEmpresa(data);
            });
    }, []);

    return (
        <div className="hidden print:block mb-4">
            {/* Línea decorativa superior */}
            <div style={{ height: '4px', background: '#F97316', borderRadius: '2px', marginBottom: '14px' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                {/* Lado izquierdo: Logo + datos del taller */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <img
                        src="/logo.png"
                        alt="Logo"
                        style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                    />
                    <div>
                        <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
                            {empresa?.nombre_comercial || empresa?.razon_social || 'SuColor'}
                        </h1>
                        {empresa?.razon_social && empresa?.nombre_comercial && (
                            <p style={{ fontSize: '10px', color: '#64748B', margin: '1px 0 0 0' }}>
                                {empresa.razon_social}
                            </p>
                        )}
                        {empresa?.ruc && (
                            <p style={{ fontSize: '11px', color: '#334155', margin: '2px 0 0 0', fontWeight: 600 }}>
                                RUC: {empresa.ruc}
                            </p>
                        )}
                        {empresa?.direccion_matriz && (
                            <p style={{ fontSize: '10px', color: '#64748B', margin: '1px 0 0 0' }}>
                                📍 {empresa.direccion_matriz}
                            </p>
                        )}
                    </div>
                </div>

                {/* Lado derecho: Info del reporte */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#F97316', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {titulo}
                    </h2>
                    {subtitulo && (
                        <p style={{ fontSize: '11px', color: '#334155', margin: '3px 0 0 0', fontWeight: 600 }}>
                            {subtitulo}
                        </p>
                    )}
                    {infoExtra?.map((line, i) => (
                        <p key={i} style={{ fontSize: '10px', color: '#64748B', margin: '1px 0 0 0' }}>
                            {line}
                        </p>
                    ))}
                    <p style={{ fontSize: '10px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                        Generado: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Línea divisora */}
            <div style={{ height: '1px', background: '#E2E8F0', margin: '12px 0 0 0' }} />
        </div>
    );
}
