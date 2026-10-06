export const FORMAS_PAGO: Record<string, string> = {
    '01': 'SIN UTILIZACIÓN DEL SISTEMA FINANCIERO',
    '15': 'COMPENSACIÓN DE DEUDAS',
    '16': 'TARJETA DE DÉBITO',
    '17': 'DINERO ELECTRÓNICO',
    '18': 'TARJETA PREPAGO',
    '19': 'TARJETA DE CRÉDITO',
    '20': 'OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO',
    '21': 'ENDOSO DE TÍTULOS',
};

export function validarConfiguracionFiscal(datos: {
    ruc?: string;
    razon_social?: string;
    direccion_matriz?: string;
    contribuyente_especial?: string | null;
    agente_retencion?: string | null;
}) {
    if (!/^\d{13}$/.test(datos.ruc || '')) throw new Error('El RUC debe contener 13 dígitos.');
    if (!datos.razon_social?.trim() || !datos.direccion_matriz?.trim())
        throw new Error('Completa la razón social y la dirección de la matriz según el RUC.');
    const resolucion = datos.contribuyente_especial?.trim();
    if (resolucion && !/^[A-Za-z0-9-]{3,13}$/.test(resolucion))
        throw new Error(
            'Contribuyente especial: ingresa la resolución del SRI (3 a 13 caracteres), no un correo. Si no aplica, deja el campo vacío.'
        );
    if (datos.agente_retencion && !/^\d{1,8}$/.test(datos.agente_retencion.trim()))
        throw new Error('Revisa el número de resolución de agente de retención.');
}

export interface ItemFacturable {
    codigo_principal: string;
    descripcion: string;
    precio_total_sin_impuestos: number;
    tarifa_iva: 0 | 15;
}

export function validarEmision(
    items: unknown,
    formaPago: unknown
): asserts items is ItemFacturable[] {
    if (
        typeof formaPago !== 'string' ||
        !Object.prototype.hasOwnProperty.call(FORMAS_PAGO, formaPago)
    )
        throw new Error('Selecciona una forma de pago válida.');
    if (!Array.isArray(items) || !items.length || items.length > 1000)
        throw new Error('La factura debe contener entre 1 y 1000 detalles.');
    for (const item of items) {
        if (
            !item ||
            typeof item.descripcion !== 'string' ||
            !item.descripcion.trim() ||
            item.descripcion.length > 300
        )
            throw new Error('Cada detalle necesita una descripción de hasta 300 caracteres.');
        if (
            typeof item.codigo_principal !== 'string' ||
            !item.codigo_principal.trim() ||
            item.codigo_principal.length > 25
        )
            throw new Error('Cada detalle necesita un código de hasta 25 caracteres.');
        const monto = Number(item.precio_total_sin_impuestos);
        if (
            !['number', 'string'].includes(typeof item.precio_total_sin_impuestos) ||
            String(item.precio_total_sin_impuestos).trim() === '' ||
            !Number.isFinite(monto) ||
            monto < 0 ||
            monto > 999999999.99 ||
            Math.abs(monto * 100 - Math.round(monto * 100)) > 0.00001
        )
            throw new Error('Los importes deben ser positivos o cero, con máximo dos decimales.');
        if (item.tarifa_iva !== 0 && item.tarifa_iva !== 15)
            throw new Error(
                'Selecciona la tarifa de IVA de cada concepto; no se asigna automáticamente.'
            );
    }
    if (!items.some(item => Number(item.precio_total_sin_impuestos) > 0))
        throw new Error('El total de la factura debe ser mayor que cero.');
}

// Sumar centavos y el IVA redondeado por línea evita discrepancias entre detalle y resumen.
export function calcularTotalesFactura(items: ItemFacturable[]) {
    let base0 = 0,
        base15 = 0,
        iva = 0;
    for (const item of items) {
        const centavos = Math.round(Number(item.precio_total_sin_impuestos) * 100);
        if (item.tarifa_iva === 15) {
            base15 += centavos;
            iva += Math.round((centavos * 15) / 100);
        } else base0 += centavos;
    }
    return {
        subtotal0: base0 / 100,
        subtotal15: base15 / 100,
        iva: iva / 100,
        total: (base0 + base15 + iva) / 100,
    };
}
