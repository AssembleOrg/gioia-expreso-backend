/**
 * Tope de filas por consulta. El panel pide hasta 1000 de una vez
 * (paquetes y repartos); más que eso se trae paginado.
 */
export const LIMITE_MAXIMO = 1000;

/** Normaliza page/limit venidos de query string y calcula el skip. */
export function paginar(page?: number | string, limit?: number | string) {
  const p = Math.max(1, Math.floor(Number(page)) || 1);
  const l = Math.min(LIMITE_MAXIMO, Math.max(1, Math.floor(Number(limit)) || 10));
  return { page: p, limit: l, skip: (p - 1) * l };
}
