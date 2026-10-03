import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export const ROLES_KEY = 'roles';

/*
 * Guard global de roles. Corre después de JwtAuthGuard (ver el orden de
 * APP_GUARD en AppModule), así que req.user ya viene cargado por la estrategia JWT.
 * - Rutas @Public(): pasan sin mirar roles.
 * - Rutas sin @Roles(): alcanza con estar logueado (eso ya lo validó JwtAuthGuard).
 * - Rutas con @Roles(...): el rol del usuario tiene que estar en la lista, si no 403.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.role || !requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException('No tenés permisos para esta operación');
    }

    return true;
  }
}
