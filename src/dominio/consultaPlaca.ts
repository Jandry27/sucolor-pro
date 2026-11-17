export const URL_CONSULTAS_ECUADOR =
    'https://consultasecuador.com/en-linea/transito/consulta-vehiculo';

export const normalizarPlaca = (placa: string) => placa.replace(/[\s-]/g, '').toUpperCase();

export interface DatosConsultaPlaca {
    marca?: string;
    modelo?: string;
    anio?: string;
    placa?: string;
}

export function extraerResultadoPlaca(texto: string): DatosConsultaPlaca {
    const resultado: DatosConsultaPlaca = {};
    const etiquetas = {
        marca: 'marca',
        modelo: 'modelo',
        año: 'anio',
        anio: 'anio',
        placa: 'placa',
    } as const;
    const patron = /^(marca|modelo|año|anio|placa)(?: *[:：]\s*|\t+| +|$)(.*)$/i;
    const otraEtiqueta =
        /^(?:placa anterior|año última revisión|número de motor|cantidad de propietarios|ramv\/cpn|color|tipo(?: de vehículo| de uso)?|clase|cilindraje|país(?: de fabricación)?|servicio|chasis|motor|combustible)(?:\s*[:：]\s*|\t+|$)/i;
    const lineas = texto
        .split(/[\r\n\t]+/)
        .map(linea => linea.trim())
        .filter(Boolean);

    lineas.forEach((linea, indice) => {
        if (otraEtiqueta.test(linea)) return;
        const coincidencia = linea.match(patron);
        if (!coincidencia) return;

        const etiqueta = coincidencia[1].toLowerCase() as keyof typeof etiquetas;
        const campo = etiquetas[etiqueta];
        const siguiente = lineas[indice + 1];
        const valor =
            coincidencia[2].trim() ||
            (siguiente && !patron.test(siguiente) && !otraEtiqueta.test(siguiente)
                ? siguiente
                : '');
        if (!valor || valor.length > 150 || /^(?:[-–—]+|n\/?a|no disponible)$/i.test(valor)) return;
        if (campo === 'anio' && !/^\d{4}$/.test(valor)) return;
        if (campo === 'placa' && !/^[A-Z0-9]{2,10}$/.test(normalizarPlaca(valor))) return;
        resultado[campo] ??= valor;
    });
    return resultado;
}
