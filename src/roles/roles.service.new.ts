import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RoleHierarchy } from './entities/role-hierarchy.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateRoleHierarchyDto } from './dto/create-role-hierarchy.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(RoleHierarchy)
    private roleHierarchyRepository: Repository<RoleHierarchy>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    // Create the new role
    const role = this.rolesRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
      capabilities: createRoleDto.capabilities || [],
    });
    
    // Save the role first
    const savedRole = await this.rolesRepository.save(role);
    
    // If a parent role is specified, create the hierarchy relationship
    if (createRoleDto.parentRoleId) {
      const parentRole = await this.findOne(createRoleDto.parentRoleId);
      if (!parentRole) {
        throw new NotFoundException(`Parent role with ID ${createRoleDto.parentRoleId} not found`);
      }
      
      // Check for circular dependencies
      if (await this.wouldCreateCircularDependency(createRoleDto.parentRoleId, savedRole.id)) {
        throw new BadRequestException('This would create a circular role dependency');
      }
      
      // Create the hierarchy relationship
      await this.createHierarchyRelationship(createRoleDto.parentRoleId, savedRole.id);
    }
    
    return savedRole;
  }
  
  async createHierarchyRelationship(parentRoleId: number, childRoleId: number) {
    // Check if both roles exist
    const [parentRole, childRole] = await Promise.all([
      this.findOne(parentRoleId),
      this.findOne(childRoleId)
    ]);
    
    if (!parentRole || !childRole) {
      throw new NotFoundException('Parent or child role not found');
    }
    
    // Check for circular dependencies
    if (await this.wouldCreateCircularDependency(parentRoleId, childRoleId)) {
      throw new BadRequestException('This would create a circular role dependency');
    }
    
    const hierarchy = this.roleHierarchyRepository.create({
      parentRoleId,
      childRoleId,
      parentRole,
      childRole
    });
    
    return this.roleHierarchyRepository.save(hierarchy);
  }

  async findAll() {
    return this.rolesRepository.find();
  }

  async findOne(id: number) {
    const role = await this.rolesRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }
  
  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);
    
    if (updateRoleDto.name !== undefined) {
      role.name = updateRoleDto.name;
    }
    
    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }
    
    if (updateRoleDto.capabilities !== undefined) {
      role.capabilities = updateRoleDto.capabilities;
    }
    
    const updatedRole = await this.rolesRepository.save(role);
    
    // Handle parent role changes if specified
    if (updateRoleDto.parentRoleId !== undefined) {
      // Remove existing parent relationships
      await this.roleHierarchyRepository.delete({ childRoleId: id });
      
      // Add new parent relationship if specified
      if (updateRoleDto.parentRoleId !== null) {
        await this.createHierarchyRelationship(updateRoleDto.parentRoleId, id);
      }
    }
    
    return updatedRole;
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    
    // Delete any hierarchy relationships involving this role
    await this.roleHierarchyRepository.delete([
      { parentRoleId: id },
      { childRoleId: id }
    ]);
    
    return this.rolesRepository.remove(role);
  }
  
  async findChildren(roleId: number): Promise<Role[]> {
    const hierarchies = await this.roleHierarchyRepository.find({
      where: { parentRoleId: roleId },
      relations: ['childRole']
    });
    
    return hierarchies.map(h => h.childRole);
  }
  
  async findParent(roleId: number): Promise<Role | null> {
    const hierarchy = await this.roleHierarchyRepository.findOne({
      where: { childRoleId: roleId },
      relations: ['parentRole']
    });
    
    return hierarchy ? hierarchy.parentRole : null;
  }
  
  /**
   * Checks if assigning a parent role would create a circular dependency
   */
  private async wouldCreateCircularDependency(parentId: number, childId: number): Promise<boolean> {
    // If parent and child are the same, it's a direct circular dependency
    if (parentId === childId) {
      return true;
    }
    
    // Check if the child is already a parent (direct or indirect) of the parent
    let currentId = parentId;
    const visited = new Set<number>();
    
    while (currentId) {
      // If we've already visited this node, we have a cycle
      if (visited.has(currentId)) {
        return true;
      }
      
      visited.add(currentId);
      
      // Find the parent of the current role
      const hierarchy = await this.roleHierarchyRepository.findOne({
        where: { childRoleId: currentId }
      });
      
      // No parent means we've reached the top of the hierarchy
      if (!hierarchy) {
        break;
      }
      
      // If we find the child as a parent, there's a circular dependency
      if (hierarchy.parentRoleId === childId) {
        return true;
      }
      
      // Move up the hierarchy
      currentId = hierarchy.parentRoleId;
    }
    
    return false;
  }
  
  /**
   * Checks if a role has a specific capability through inheritance
   */
  async hasCapability(roleId: number, targetRoleName: string): Promise<boolean> {
    const role = await this.findOne(roleId);
    
    // Direct match
    if (role.name === targetRoleName) {
      return true;
    }
    
    // Find all ancestors in the role hierarchy
    const ancestors = await this.findAllAncestors(roleId);
    
    // Check if any ancestor matches the target role name
    for (const ancestor of ancestors) {
      if (ancestor.name === targetRoleName) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Find all ancestors of a role in the hierarchy
   */
  async findAllAncestors(roleId: number): Promise<Role[]> {
    const ancestors: Role[] = [];
    let currentId = roleId;
    const visited = new Set<number>();
    
    while (true) {
      // Find the parent of the current role
      const hierarchy = await this.roleHierarchyRepository.findOne({
        where: { childRoleId: currentId },
        relations: ['parentRole']
      });
      
      // No parent means we've reached the top of the hierarchy
      if (!hierarchy) {
        break;
      }
      
      // If we've already visited this node, we have a cycle (should not happen due to checks)
      if (visited.has(hierarchy.parentRoleId)) {
        break;
      }
      
      visited.add(hierarchy.parentRoleId);
      ancestors.push(hierarchy.parentRole);
      
      // Move up the hierarchy
      currentId = hierarchy.parentRoleId;
    }
    
    return ancestors;
  }
  
  /**
   * Generates a visualization of the role hierarchy
   */
  async generateHierarchyVisualization(): Promise<string> {
    const roles = await this.findAll();
    const hierarchies = await this.roleHierarchyRepository.find();
    
    // Map roles by ID for easy lookup
    const roleMap = new Map<number, Role>();
    roles.forEach(role => roleMap.set(role.id, role));
    
    // Build hierarchy tree
    const tree = new Map<number, number[]>();
    roles.forEach(role => tree.set(role.id, []));
    
    hierarchies.forEach(h => {
      const children = tree.get(h.parentRoleId) || [];
      children.push(h.childRoleId);
      tree.set(h.parentRoleId, children);
    });
    
    // Find root nodes (roles with no parents)
    const parentRoleIds = new Set(hierarchies.map(h => h.parentRoleId));
    const childRoleIds = new Set(hierarchies.map(h => h.childRoleId));
    const rootRoleIds = [...parentRoleIds].filter(id => !childRoleIds.has(id));
    
    // Generate visualization
    let visualization = 'Role Hierarchy:\n';
    
    const printHierarchy = (roleId: number, level: number) => {
      const role = roleMap.get(roleId);
      if (!role) return;
      
      visualization += `${' '.repeat(level * 2)}${role.name} (ID: ${role.id})\n`;
      
      const children = tree.get(roleId) || [];
      children.forEach(childId => {
        printHierarchy(childId, level + 1);
      });
    };
    
    rootRoleIds.forEach(rootId => {
      printHierarchy(rootId, 0);
    });
    
    return visualization;
  }
}
