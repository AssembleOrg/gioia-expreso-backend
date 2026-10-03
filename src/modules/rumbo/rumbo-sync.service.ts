import { Injectable } from '@nestjs/common';
import { ContainerStatus, PreorderStatus } from '@prisma/client';
import { PrismaService } from '@prisma';
import { RumboApiClient, RumboError, type RumboShipment, type RumboStatus } from './rumbo-api.client';

/*
 * Gioia → Rumbo. Gioia es dueño de los datos; Rumbo es lo que ve el
 * comprador. Para cada preorden se calcula el estado que corresponde con lo
 * que hay en la base y se lleva a Rumbo.
 *
 *   preorden creada / pendiente / confirmada → EN_DEPOSITO
 *   en un reparto en carga (ON_LOAD)         → EN_PREPARACION
 *   reparto viajando (TRAVELLING)            → EN_DISTRIBUCION ("En camino")
 *   reparto llegó (ARRIVED)                  → EN_DISTRIBUCION + "Llegó a la sucursal de destino"
 *   preorden completada                      → ENTREGADO
 *   preorden cancelada o borrada             → CANCELADO
 */

const ORDEN: Record<RumboStatus, number> = {
  EN_DEPOSITO: 0,
  EN_PREPARACION: 1,
  EN_DISTRIBUCION: 2,
  NO_ENTREGADO: 2,
  ENTREGADO: 3,
  CANCELADO: 4,
};
const FINAL = new Set<RumboStatus>(['ENTREGADO', 'CANCELADO']);
const NOTA_LLEGO = 'Llegó a la sucursal de destino.';

const DE_REPARTO: Record<ContainerStatus, RumboStatus> = {
  ON_LOAD: 'EN_PREPARACION',
  TRAVELLING: 'EN_DISTRIBUCION',
  ARRIVED: 'EN_DISTRIBUCION',
};

function dePreorden(status: PreorderStatus): RumboStatus {
  if (status === 'COMPLETED') return 'ENTREGADO';
  if (status === 'CANCELLED') return 'CANCELADO';
  return 'EN_DEPOSITO';
}

interface Objetivo {
  status: RumboStatus;
  nota?: string;
}

type PreordenCompleta = NonNullable<Awaited<ReturnType<RumboSyncService['leer']>>>;

/** "Destinatario: Laura Pérez - DNI: 123 - Tel: 11 4444 5555" → nombre y tel. */
function destinatarioDeNotas(notes: string | null) {
  const m = notes?.match(/Destinatario:\s*([^|]+?)\s*-\s*DNI:[^|]*?-\s*Tel:\s*([^|]+)/i);
  return m ? { nombre: m[1].trim(), tel: m[2].trim() } : {};
}

function campoDeNotas(notes: string | null, campo: string): string | undefined {
  return notes?.match(new RegExp(`${campo}:\\s*([^|]+)`, 'i'))?.[1].trim() || undefined;
}

/** "Mitre 100, Lanús, Buenos Aires" → localidad y provincia. */
function lugar(direccion: string): { ciudad: string; provincia: string | null } {
  const partes = direccion.split(',').map((p) => p.trim()).filter(Boolean);
  if (partes.length >= 3) return { ciudad: partes[partes.length - 2], provincia: partes[partes.length - 1] };
  if (partes.length === 2) return { ciudad: partes[1], provincia: null };
  return { ciudad: partes[0] || 'A confirmar', provincia: null };
}

@Injectable()
export class RumboSyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly api: RumboApiClient,
  ) {}

  leer(id: string) {
    return this.prisma.preorder.findUnique({
      where: { id },
      include: {
        client: true,
        packages: { include: { packageType: true } },
        // El reparto vigente: el último al que se sumó, si no se borró.
        containers: {
          where: { container: { deletedAt: null } },
          include: { container: true },
          orderBy: { addedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /** Preórdenes de un reparto (al cambiar su estado). */
  async delReparto(containerId: string): Promise<string[]> {
    const filas = await this.prisma.containerPreorder.findMany({
      where: { containerId },
      select: { preorderId: true },
    });
    return filas.map((f) => f.preorderId);
  }

  /** Lleva a Rumbo el estado que corresponde hoy a la preorden. */
  async sincronizar(id: string): Promise<RumboStatus | null> {
    const p = await this.leer(id);
    if (!p || p.deletedAt) return (await this.cancelarSiExiste(id))?.status ?? null;
    const s = await this.reconciliar(p, this.objetivo(p));
    return s.status;
  }

  private objetivo(p: PreordenCompleta): Objetivo {
    const propio = dePreorden(p.status);
    // Completada o cancelada manda siempre.
    if (propio !== 'EN_DEPOSITO') return { status: propio };
    const reparto = p.containers[0]?.container;
    if (!reparto) return { status: 'EN_DEPOSITO' };
    return {
      status: DE_REPARTO[reparto.status],
      nota: reparto.status === 'ARRIVED' ? NOTA_LLEGO : undefined,
    };
  }

  private alta(p: PreordenCompleta, estado: RumboStatus) {
    const dest = destinatarioDeNotas(p.notes);
    const { ciudad, provincia } = lugar(p.destination);
    const bultos = p.packages.reduce((n, pk) => n + (pk.quantity || 0), 0) || 1;
    const tipos = [...new Set(p.packages.map((pk) => pk.packageType?.name).filter(Boolean))];
    const origen = campoDeNotas(p.notes, 'Sucursal origen');
    return {
      externalRef: p.id,
      senderName: p.client?.fullname ?? null,
      recipientName: dest.nombre || p.client?.fullname || 'Destinatario',
      recipientPhone: dest.tel || p.client?.phone || null,
      addressLine: p.destination,
      city: ciudad,
      province: provincia,
      postalCode: p.destinationPostal && p.destinationPostal !== '0000' ? p.destinationPostal : null,
      itemsSummary: [`Guía ${p.voucherNumber}`, tipos.length ? tipos.join(', ') : null].filter(Boolean).join(' · '),
      packages: Math.min(Math.max(bultos, 1), 999),
      // Un envío nuevo arranca en depósito, preparación o distribución.
      status: estado === 'EN_PREPARACION' || estado === 'EN_DISTRIBUCION' ? estado : 'EN_DEPOSITO',
      location: origen ?? null,
      note: origen ? `Ingresó a ${origen}.` : 'Ingresó al depósito de Transportes Gioia.',
    };
  }

  private async buscar(ref: string): Promise<RumboShipment | null> {
    try {
      return await this.api.pedir<RumboShipment>(`/api/envios/${encodeURIComponent(ref)}`);
    } catch (e) {
      if (e instanceof RumboError && e.status === 404) return null;
      throw e;
    }
  }

  private mover(ref: string, status: RumboStatus, note?: string) {
    return this.api.pedir<RumboShipment>(`/api/envios/${encodeURIComponent(ref)}/eventos`, { body: { status, note } });
  }

  private deshacer(ref: string) {
    return this.api.pedir<RumboShipment>(`/api/envios/${encodeURIComponent(ref)}/eventos/deshacer`, { method: 'POST' });
  }

  /** Lleva el envío de Rumbo justo al objetivo; lo crea si no existe. */
  private async reconciliar(p: PreordenCompleta, obj: Objetivo): Promise<RumboShipment> {
    let s = await this.buscar(p.id);
    if (!s) {
      await this.api.pedir('/api/envios', { body: this.alta(p, obj.status) });
      s = await this.buscar(p.id);
      if (!s) throw new RumboError('Rumbo no devolvió el envío recién creado.', 502);
    }

    // Gioia lo tiene activo pero Rumbo terminado (se reabrió o se corrigió).
    let vueltas = 0;
    while (FINAL.has(s.status) && s.status !== obj.status && vueltas++ < 4) {
      s = await this.deshacer(p.id);
    }

    if (obj.status === 'CANCELADO') {
      return s.status === 'CANCELADO' ? s : this.mover(p.id, 'CANCELADO', 'El envío se canceló.');
    }

    const meta = ORDEN[obj.status];
    if (meta > ORDEN[s.status]) {
      s = await this.mover(p.id, obj.status, obj.status === 'ENTREGADO' ? undefined : obj.nota);
    } else if (meta < ORDEN[s.status]) {
      // Gioia volvió atrás (lo sacaron del reparto, se corrigió un estado).
      while (ORDEN[s.status] > meta && vueltas++ < 8) {
        try {
          s = await this.deshacer(p.id);
        } catch {
          break;
        }
      }
      if (s.status !== obj.status && ORDEN[s.status] < meta) s = await this.mover(p.id, obj.status);
    }
    if (obj.nota && s.status === obj.status) {
      const ultima = s.events?.[s.events.length - 1];
      if (ultima?.note !== obj.nota) s = await this.mover(p.id, obj.status, obj.nota);
    }
    return s;
  }

  /** La preorden se borró en Gioia: si llegó a Rumbo, se cancela ahí. */
  private async cancelarSiExiste(ref: string): Promise<RumboShipment | null> {
    const s = await this.buscar(ref);
    if (!s || s.status === 'CANCELADO') return s;
    return this.mover(ref, 'CANCELADO', 'El envío se canceló.');
  }
}
