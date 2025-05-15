import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { RolesService } from './roles/roles.service';
import { UsersService } from './users/users.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
  ) {}

  @Command({
    command: 'seed:roles',
    describe: 'Seed roles with inheritance hierarchy',
  })
  async seedRoles() {
    console.log('Seeding roles...');

    // Create base user role
    const userRole = await this.rolesService.create({
      name: 'user',
      description: 'Basic user with limited access',
    });
    console.log(`Created user role with ID: ${userRole.id}`);

    // Create editor role inheriting from user
    const editorRole = await this.rolesService.create({
      name: 'editor',
      description: 'Can edit content',
      parentRoleId: userRole.id,
    });
    console.log(`Created editor role with ID: ${editorRole.id}`);

    // Create manager role inheriting from editor
    const managerRole = await this.rolesService.create({
      name: 'manager',
      description: 'Can manage content and users',
      parentRoleId: editorRole.id,
    });
    console.log(`Created manager role with ID: ${managerRole.id}`);

    // Create admin role inheriting from manager
    const adminRole = await this.rolesService.create({
      name: 'admin',
      description: 'Full access to the system',
      parentRoleId: managerRole.id,
    });
    console.log(`Created admin role with ID: ${adminRole.id}`);

    console.log('Role seeding completed!');
  }

  @Command({
    command: 'seed:users',
    describe: 'Seed demo users with roles',
  })
  async seedUsers() {
    console.log('Seeding users...');

    // Create demo users
    const adminUser = await this.usersService.create({
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
    });
    
    const managerUser = await this.usersService.create({
      username: 'manager',
      password: 'manager123',
      email: 'manager@example.com',
    });
    
    const editorUser = await this.usersService.create({
      username: 'editor',
      password: 'editor123',
      email: 'editor@example.com',
    });
    
    const regularUser = await this.usersService.create({
      username: 'user',
      password: 'user123',
      email: 'user@example.com',
    });

    // Fetch roles
    const adminRole = await this.rolesService.findByName('admin');
    const managerRole = await this.rolesService.findByName('manager');
    const editorRole = await this.rolesService.findByName('editor');
    const userRole = await this.rolesService.findByName('user');    // Assign roles to users
    if (adminRole) {
      await this.usersService.assignRole(adminUser.id, adminRole.name);
      console.log(`Assigned admin role to ${adminUser.username}`);
    }
    
    if (managerRole) {
      await this.usersService.assignRole(managerUser.id, managerRole.name);
      console.log(`Assigned manager role to ${managerUser.username}`);
    }
    
    if (editorRole) {
      await this.usersService.assignRole(editorUser.id, editorRole.name);
      console.log(`Assigned editor role to ${editorUser.username}`);
    }
    
    if (userRole) {
      await this.usersService.assignRole(regularUser.id, userRole.name);
      console.log(`Assigned user role to ${regularUser.username}`);
    }

    console.log('User seeding completed!');
  }

  @Command({
    command: 'seed',
    describe: 'Seed all data',
  })
  async seedAll() {
    await this.seedRoles();
    await this.seedUsers();
    console.log('All seeding completed successfully!');
  }
}
