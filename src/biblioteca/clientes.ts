interface DatosCliente {
    nombres?: string | null;
    telefono?: string | null;
    email?: string | null;
    cedula?: string | null;
    notas?: string | null;
}

// Conserva clientes identificables aunque no hayan dejado teléfono.
export function esClienteRegistrado(cliente: DatosCliente): boolean {
    if ([cliente.telefono, cliente.email, cliente.cedula].some(valor => valor?.trim())) return true;
    const nombre = (cliente.nombres ?? '').trim();
    if (!nombre) return false;
    const normalizado = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/^cliente anonimo(?:\s*\((?:placa\s*:.*|no registrado)\))?$/i.test(normalizado))
        return false;
    const automatico = cliente.notas === 'Generado automáticamente por sistema al omitir cliente';
    return !(automatico && /^[a-z0-9-]+$/i.test(nombre) && /\d/.test(nombre));
}
