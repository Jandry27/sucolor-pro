export function sanitizarTexto(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Eliminar tags HTML
    .replace(/javascript:/gi, '')  // Eliminar javascript: URIs
    .replace(/on\w+=/gi, '')  // Eliminar event handlers
    .trim();
}

export function sanitizarPlaca(input: string): string {
  if (!input) return '';
  return input.replace(/[^A-Z0-9-]/gi, '').toUpperCase().slice(0, 10);
}

export function sanitizarEmail(input: string): string {
  if (!input) return '';
  return input.toLowerCase().trim().slice(0, 254);
}

export function sanitizarTelefono(input: string): string {
  if (!input) return '';
  return input.replace(/[^0-9+\-\s()]/g, '').slice(0, 20);
}
