import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AUDITORY_KEY, AuditoryMetadata } from '../decorators/auditory.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<AuditoryMetadata>(
      AUDITORY_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const user = request.user;
    const ip = this.getRealIp(request);
    const location = this.getLocation(request);

    return next.handle().pipe(
      tap(async () => {
        try {
          // TODO: Create AuditLog model in Prisma schema and inject PrismaService
          // For now, we'll log to console
          console.log({
            action: metadata.action,
            entity: metadata.entity,
            userId: user?.id,
            ip,
            location,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Error saving audit log:', error);
        }
      }),
    );
  }

  private getRealIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private getLocation(request: Request): string {
    // TODO: Implement IP geolocation service
    return 'unknown';
  }
}

