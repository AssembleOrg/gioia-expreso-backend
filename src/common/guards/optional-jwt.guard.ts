import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Para rutas públicas que muestran más a quien tiene sesión: si viene un
 * token válido carga request.user; si no viene o no sirve, sigue sin user
 * (nunca rechaza).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // Sin token o vencido: la ruta es pública igual.
    }
    return true;
  }

  handleRequest<TUser>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
