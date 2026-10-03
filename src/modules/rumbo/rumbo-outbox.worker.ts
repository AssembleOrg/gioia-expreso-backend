import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { PrismaService } from '@prisma';
import { RumboApiClient } from './rumbo-api.client';
import { RumboSyncService } from './rumbo-sync.service';

/** Revisión periódica por si se perdió un aviso (reconexión, deploy). */
const REVISION_MS = 30_000;
/** Lote por vuelta; lo que sobra se toma en la siguiente. */
const LOTE = 25;
/** Mientras se procesa una fila nadie más la toma (por si hay réplicas). */
const RESERVA_MS = 2 * 60_000;
const MAX_INTENTOS = 10;
/** Lo procesado se borra a los 7 días. */
const RETENCION_DIAS = 7;

interface Fila {
  id: bigint;
  preorderId: string | null;
  containerId: string | null;
  reason: string;
  attempts: number;
}

/**
 * Vacía rumbo_outbox hacia Rumbo. Los disparadores de Postgres avisan por
 * NOTIFY y se procesa al instante; además se revisa cada 30 s. Si Rumbo
 * falla, la fila se reintenta con espera creciente (hasta 10 veces).
 */
@Injectable()
export class RumboOutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RumboOutboxWorker.name);
  private oyente: Client | null = null;
  private revision: NodeJS.Timeout | null = null;
  private reconexion: NodeJS.Timeout | null = null;
  private corriendo: Promise<void> | null = null;
  private otraVuelta = false;
  private apagando = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly api: RumboApiClient,
    private readonly sync: RumboSyncService,
  ) {}

  onModuleInit() {
    if (!this.api.configurado) {
      this.logger.warn('RUMBO_API_URL / RUMBO_API_KEY sin configurar: el seguimiento no se sincroniza (los cambios quedan en rumbo_outbox).');
      return;
    }
    void this.escuchar();
    this.revision = setInterval(() => this.procesar(), REVISION_MS);
    this.procesar();
  }

  async onModuleDestroy() {
    this.apagando = true;
    if (this.revision) clearInterval(this.revision);
    if (this.reconexion) clearTimeout(this.reconexion);
    await this.corriendo?.catch(() => undefined);
    await this.oyente?.end().catch(() => undefined);
  }

  /** Conexión aparte para LISTEN (el pool de Prisma no sirve para esto). */
  private async escuchar() {
    const url = this.config.get<string>('database.url') || process.env.DATABASE_URL;
    const oyente = new Client({ connectionString: url });
    // Sin estos listeners, un corte de la base tira el proceso entero.
    oyente.on('error', (e) => {
      this.logger.warn(`Se cortó la escucha de rumbo_outbox: ${e.message}`);
      this.reconectar(oyente);
    });
    oyente.on('end', () => this.reconectar(oyente));
    oyente.on('notification', () => this.procesar());
    try {
      await oyente.connect();
      await oyente.query('LISTEN rumbo_outbox');
      this.oyente = oyente;
      this.logger.log('Escuchando cambios para el seguimiento (rumbo_outbox).');
    } catch (e) {
      this.logger.warn(`No se pudo escuchar rumbo_outbox: ${e instanceof Error ? e.message : e}`);
      this.reconectar(oyente);
    }
  }

  private reconectar(viejo: Client) {
    if (this.apagando || this.reconexion) return;
    if (this.oyente === viejo) this.oyente = null;
    viejo.removeAllListeners();
    void viejo.end().catch(() => undefined);
    this.reconexion = setTimeout(() => {
      this.reconexion = null;
      void this.escuchar();
    }, 5_000);
  }

  /** Una vuelta a la vez; si llega un aviso mientras tanto, se hace otra. */
  private procesar() {
    if (this.apagando) return;
    if (this.corriendo) {
      this.otraVuelta = true;
      return;
    }
    this.corriendo = this.vaciar()
      .catch((e) => this.logger.error(`Falló el procesamiento de rumbo_outbox: ${e instanceof Error ? e.message : e}`))
      .finally(() => {
        this.corriendo = null;
        if (this.otraVuelta) {
          this.otraVuelta = false;
          this.procesar();
        }
      });
  }

  private async vaciar() {
    for (;;) {
      const filas = await this.reservar();
      if (filas.length === 0) break;
      for (const fila of filas) {
        if (this.apagando) return;
        await this.procesarFila(fila);
      }
      if (filas.length < LOTE) break;
    }
    await this.prisma.$executeRaw`
      DELETE FROM "rumbo_outbox"
      WHERE "processedAt" < now() - make_interval(days => ${RETENCION_DIAS})`;
  }

  /** Toma un lote pendiente y lo reserva un rato (SKIP LOCKED: sin pisarse). */
  private reservar(): Promise<Fila[]> {
    return this.prisma.$queryRaw<Fila[]>`
      UPDATE "rumbo_outbox" SET "nextAttemptAt" = now() + make_interval(secs => ${RESERVA_MS / 1000})
      WHERE "id" IN (
        SELECT "id" FROM "rumbo_outbox"
        WHERE "processedAt" IS NULL AND "nextAttemptAt" <= now() AND "attempts" < ${MAX_INTENTOS}
        ORDER BY "id"
        LIMIT ${LOTE}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id", "preorderId", "containerId", "reason", "attempts"`;
  }

  private async procesarFila(fila: Fila) {
    try {
      // El cambio de estado de un reparto mueve a todos sus paquetes; el
      // resto de los cambios es de una preorden.
      const ids =
        fila.reason === 'container:status' && fila.containerId
          ? await this.sync.delReparto(fila.containerId)
          : fila.preorderId
            ? [fila.preorderId]
            : [];
      for (const id of ids) await this.sync.sincronizar(id);
      await this.prisma.rumboOutbox.update({
        where: { id: fila.id },
        data: { processedAt: new Date(), lastError: null },
      });
    } catch (e) {
      const intentos = fila.attempts + 1;
      const espera = Math.min(30_000 * 2 ** fila.attempts, 60 * 60_000);
      const mensaje = e instanceof Error ? e.message : String(e);
      await this.prisma.rumboOutbox.update({
        where: { id: fila.id },
        data: { attempts: intentos, lastError: mensaje.slice(0, 500), nextAttemptAt: new Date(Date.now() + espera) },
      });
      const final = intentos >= MAX_INTENTOS ? ' (último intento)' : '';
      this.logger.warn(`Seguimiento sin sincronizar (${fila.reason}, intento ${intentos})${final}: ${mensaje}`);
    }
  }
}
