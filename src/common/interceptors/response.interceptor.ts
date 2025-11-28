import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateTime } from 'luxon';
import { PaginatedResponse, StandardResponse } from '../types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T> | PaginatedResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T> | PaginatedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const timestamp = DateTime.now().setZone('America/Argentina/Buenos_Aires').toISO();

        // Check if response already has pagination meta
        if (data && typeof data === 'object' && 'meta' in data) {
          return {
            data: data.data,
            success: true,
            message: 'Operación exitosa',
            timestamp,
            meta: data.meta,
          } as PaginatedResponse<T>;
        }

        // Standard response
        return {
          data: Array.isArray(data) ? data : data,
          success: true,
          message: 'Operación exitosa',
          timestamp,
        } as StandardResponse<T>;
      }),
    );
  }
}

