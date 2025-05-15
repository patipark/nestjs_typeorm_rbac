import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '../../roles/roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.roles || user.roles.length === 0) {
      return false;
    }

    // Check each required role
    for (const requiredRole of requiredRoles) {
      // Check direct role assignment first (faster)
      const directMatch = user.roles.some(role => 
        typeof role === 'string' ? role === requiredRole : role.name === requiredRole
      );
      
      if (directMatch) return true;
      
      // Check inherited roles
      for (const userRole of user.roles) {
        const roleId = typeof userRole === 'string' ? 
          (await this.rolesService.findByName(userRole))?.id : 
          userRole.id;
        
        if (roleId && await this.rolesService.hasCapability(roleId, requiredRole)) {
          return true;
        }
      }
    }
    
    return false;
  }
}