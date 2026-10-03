import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, ROLES_KEY } from './roles.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Role } from '../enums';

// Arma un ExecutionContext falso con la metadata y el usuario que pidamos.
function contexto(
  metadata: Record<string, unknown>,
  user?: { role?: string },
): { ctx: ExecutionContext; reflector: Reflector } {
  const handler = () => undefined;
  const clase = class {};
  const reflector = {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
  const ctx = {
    getHandler: () => handler,
    getClass: () => clase,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return { ctx, reflector };
}

describe('RolesGuard', () => {
  it('deja pasar rutas @Public aunque pidan roles y no haya usuario', () => {
    const { ctx, reflector } = contexto({
      [IS_PUBLIC_KEY]: true,
      [ROLES_KEY]: [Role.ADMIN],
    });
    expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
  });

  it('deja pasar rutas sin @Roles a cualquier usuario logueado', () => {
    const { ctx, reflector } = contexto({}, { role: Role.USER });
    expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
  });

  it('deja pasar si el rol está en la lista', () => {
    const { ctx, reflector } = contexto(
      { [ROLES_KEY]: [Role.ADMIN, Role.SUBADMIN] },
      { role: Role.SUBADMIN },
    );
    expect(new RolesGuard(reflector).canActivate(ctx)).toBe(true);
  });

  it('tira 403 si el rol no está en la lista', () => {
    const { ctx, reflector } = contexto(
      { [ROLES_KEY]: [Role.ADMIN, Role.SUBADMIN] },
      { role: Role.USER },
    );
    expect(() => new RolesGuard(reflector).canActivate(ctx)).toThrow(
      ForbiddenException,
    );
  });

  it('tira 403 si la ruta pide roles y no hay usuario', () => {
    const { ctx, reflector } = contexto({ [ROLES_KEY]: [Role.ADMIN] });
    expect(() => new RolesGuard(reflector).canActivate(ctx)).toThrow(
      ForbiddenException,
    );
  });
});
