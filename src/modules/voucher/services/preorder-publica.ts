/*
 * Lo que se muestra de una preorden en las consultas públicas (seguimiento
 * por id o por número de voucher). Quien tiene la guía no ve datos de
 * contacto: del cliente sólo nombre y ciudad, y las notas no van porque
 * llevan DNI y teléfono del destinatario. El personal (ADMIN/SUBADMIN) con
 * sesión ve todo.
 */

const PERSONAL = new Set(['ADMIN', 'SUBADMIN']);

export function esPersonal(user: { role?: string } | undefined | null): boolean {
  return Boolean(user?.role && PERSONAL.has(user.role));
}

/** "Mitre 100, Lanús, Buenos Aires" → "Lanús"; "Calle 1, CABA" → "CABA". */
export function ciudadDe(direccion: string | null | undefined): string | null {
  const partes = (direccion ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  if (partes.length >= 3) return partes[partes.length - 2];
  if (partes.length === 2) return partes[1];
  return null;
}

export function preordenPublica<T extends { notes?: unknown; client?: { fullname?: string; address?: string | null } | null }>(
  p: T,
) {
  const { client, notes: _notas, ...resto } = p;
  void _notas;
  return {
    ...resto,
    notes: null,
    client: client ? { fullname: client.fullname, city: ciudadDe(client.address) } : null,
  };
}
