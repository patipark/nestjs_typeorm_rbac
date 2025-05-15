import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = this.rolesRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
    });
    
    if (createRoleDto.parentRoleId) {
      const parentRole = await this.findOne(createRoleDto.parentRoleId);
      if (!parentRole) {
        throw new NotFoundException(`Parent role with ID ${createRoleDto.parentRoleId} not found`);
      }
      
      // Check for circular dependencies
      if (await this.wouldCreateCircularDependency(createRoleDto.parentRoleId, null)) {
        throw new BadRequestException('This would create a circular role dependency');
      }
      
      role.parentRole = parentRole;
    }
    
    return this.rolesRepository.save(role);
  }

  findAll() {
    return this.rolesRepository.find({
      relations: ['parentRole', 'childRoles']
    });
  }

  findOne(id: number) {
    return this.rolesRepository.findOne({ 
      where: { id },
      relations: ['parentRole', 'childRoles']
    });
  }
  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOne({ 
      where: { name },
      relations: ['parentRole', 'childRoles']
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    if (updateRoleDto.name) role.name = updateRoleDto.name;
    if (updateRoleDto.description) role.description = updateRoleDto.description;
    
    if (updateRoleDto.parentRoleId !== undefined) {
      if (updateRoleDto.parentRoleId === null) {
        role.parentRole = null;
      } else {
        const parentRole = await this.findOne(updateRoleDto.parentRoleId);
        if (!parentRole) {
          throw new NotFoundException(`Parent role with ID ${updateRoleDto.parentRoleId} not found`);
        }
        
        // Check if this would create a circular dependency
        if (await this.wouldCreateCircularDependency(updateRoleDto.parentRoleId, id)) {
          throw new BadRequestException('This would create a circular role dependency');
        }
        
        role.parentRole = parentRole;
      }
    }
    
    return this.rolesRepository.save(role);
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    // Update child roles to remove the parent reference
    if (role.childRoles && role.childRoles.length > 0) {
      for (const childRole of role.childRoles) {
        childRole.parentRole = null;
        await this.rolesRepository.save(childRole);
      }
    }
    
    return this.rolesRepository.remove(role);
  }
  
  /**
   * Checks if assigning a parent role would create a circular dependency
   * @param parentId The ID of the potential parent role
   * @param childId The ID of the child role (null for new roles)
   */
  private async wouldCreateCircularDependency(parentId: number, childId: number | null): Promise<boolean> {
    // If we're checking a new role, there's no circular dependency
    if (childId === null) return false;
    
    // If parent and child are the same, it's a direct circular dependency
    if (parentId === childId) return true;
    
    const parent = await this.findOne(parentId);
    if (!parent) return false;
    
    // Recursively check if any ancestor is the child
    let currentRole = parent.parentRole;
    while (currentRole) {
      if (currentRole.id === childId) {
        return true;
      }
      const parentRole = await this.findOne(currentRole.id);
      if (!parentRole) break;
      currentRole = parentRole.parentRole;
    }
    
    return false;
  }
  
  /**
   * Checks if a role has a specific capability through inheritance
   * @param roleId ID of the role to check
   * @param targetRoleName The name of the capability/role to check for
   */
  async hasCapability(roleId: number, targetRoleName: string): Promise<boolean> {
    const role = await this.findOne(roleId);
    if (!role) return false;
    
    // Direct match
    if (role.name === targetRoleName) return true;
    
    // Check parent roles recursively
    let currentRole = role.parentRole;
    while (currentRole) {
      if (currentRole.name === targetRoleName) {
        return true;
      }
      const parentRole = await this.findOne(currentRole.id);
      if (!parentRole) break;
      currentRole = parentRole.parentRole;
    }
    
    return false;
  }
}