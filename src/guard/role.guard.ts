import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.get<number>('role', context.getHandler());
    if (!role) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user.role >= role;
  }
}
