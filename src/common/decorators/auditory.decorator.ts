import { SetMetadata } from '@nestjs/common';

export const AUDITORY_KEY = 'auditory';
export interface AuditoryMetadata {
  action: string;
  entity: string;
}

export const Auditory = (action: string, entity: string) =>
  SetMetadata(AUDITORY_KEY, { action, entity } as AuditoryMetadata);

