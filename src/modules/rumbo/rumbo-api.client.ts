import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type RumboStatus =
  | 'EN_DEPOSITO'
  | 'EN_PREPARACION'
  | 'EN_DISTRIBUCION'
  | 'ENTREGADO'
  | 'NO_ENTREGADO'
  | 'CANCELADO';

export interface RumboShipment {
  id: string;
  code: string;
  externalRef: string | null;
  status: RumboStatus;
  events?: { status: RumboStatus; note: string | null }[];
}

export class RumboError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 15_000;

/** Cliente de la API de Rumbo con la clave de Transportes Gioia. */
@Injectable()
export class RumboApiClient {
  private readonly logger = new Logger(RumboApiClient.name);
  private readonly url: string;
  private readonly key: string;

  constructor(config: ConfigService) {
    this.url = (config.get<string>('RUMBO_API_URL') ?? '').replace(/\/$/, '');
    this.key = config.get<string>('RUMBO_API_KEY') ?? '';
  }

  get configurado(): boolean {
    return Boolean(this.url && this.key);
  }

  async pedir<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.url}${path}`, {
        method: init.method ?? (init.body ? 'POST' : 'GET'),
        headers: {
          Authorization: `Bearer ${this.key}`,
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: init.body ? JSON.stringify(init.body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      throw new RumboError(`Rumbo no respondió: ${e instanceof Error ? e.message : e}`, 503);
    }
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: T; error?: { message?: string } }
      | null;
    if (!res.ok || !json?.ok) {
      throw new RumboError(json?.error?.message ?? `Rumbo respondió ${res.status}`, res.status);
    }
    return json.data as T;
  }
}
