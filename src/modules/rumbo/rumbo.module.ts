import { Module } from '@nestjs/common';
import { RumboApiClient } from './rumbo-api.client';
import { RumboSyncService } from './rumbo-sync.service';
import { RumboOutboxWorker } from './rumbo-outbox.worker';

/**
 * Seguimiento con Rumbo. No expone rutas ni lo llaman los demás módulos:
 * los cambios llegan por disparadores de Postgres (rumbo_outbox).
 */
@Module({
  providers: [RumboApiClient, RumboSyncService, RumboOutboxWorker],
})
export class RumboModule {}
