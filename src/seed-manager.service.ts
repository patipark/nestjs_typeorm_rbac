import { Injectable, Logger } from '@nestjs/common';
import { RolesService } from './roles/roles.service';
import { UsersService } from './users/users.service';

/**
 * For manual database seeding without the CLI
 */
@Injectable()
export class SeedManager {
  private readonly logger = new Logger(SeedManager.name);

  constructor(
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
  ) {}

  async seedRoles() {
    this.logger.log('Seeding roles...');

    try {
      // Create base user role
      const userRole = await this.rolesService.create({
        name: 'user',
        description: 'Basic user with limited access',
      });
      this.logger.log(`Created user role with ID: ${userRole.id}`);

      // Create editor role inheriting from user
      const editorRole = await this.rolesService.create({
        name: 'editor',
        description: 'Can edit content',
        parentRoleId: userRole.id,
      });
      this.logger.log(`Created editor role with ID: ${editorRole.id}`);

      // Create manager role inheriting from editor
      const managerRole = await this.rolesService.create({
        name: 'manager',
        description: 'Can manage content and users',
        parentRoleId: editorRole.id,
      });
      this.logger.log(`Created manager role with ID: ${managerRole.id}`);

      // Create admin role inheriting from manager
      const adminRole = await this.rolesService.create({
        name: 'admin',
        description: 'Full access to the system',
        parentRoleId: managerRole.id,
      });
      this.logger.log(`Created admin role with ID: ${adminRole.id}`);

      this.logger.log('Role seeding completed!');
      
      return { userRole, editorRole, managerRole, adminRole };
    } catch (error) {
      this.logger.error(`Error seeding roles: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }
  async seedUsers(roles: any) {
    this.logger.log('Seeding users...');

    try {
      // Create demo users
      this.logger.log('Creating admin user...');
      const adminUser = await this.usersService.create({
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com',
      });
      
      this.logger.log('Creating manager user...');
      const managerUser = await this.usersService.create({
        username: 'manager',
        password: 'manager123',
        email: 'manager@example.com',
      });
      
      this.logger.log('Creating editor user...');
      const editorUser = await this.usersService.create({
        username: 'editor',
        password: 'editor123',
        email: 'editor@example.com',
      });
      
      this.logger.log('Creating regular user...');
      const regularUser = await this.usersService.create({
        username: 'user',
        password: 'user123',
        email: 'user@example.com',
      });      // Assign roles to users
      this.logger.log('Assigning roles to users...');
      
      await this.usersService.assignRole(adminUser.id, roles.adminRole.name);
      this.logger.log(`Assigned admin role to ${adminUser.username}`);
      
      await this.usersService.assignRole(managerUser.id, roles.managerRole.name);
      this.logger.log(`Assigned manager role to ${managerUser.username}`);
      
      await this.usersService.assignRole(editorUser.id, roles.editorRole.name);
      this.logger.log(`Assigned editor role to ${editorUser.username}`);
      
      await this.usersService.assignRole(regularUser.id, roles.userRole.name);
      this.logger.log(`Assigned user role to ${regularUser.username}`);

      this.logger.log('User seeding completed!');
      
      return { adminUser, managerUser, editorUser, regularUser };
    } catch (error) {
      this.logger.error(`Error seeding users: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }

  async seedAll() {
    this.logger.log('Starting complete seeding process...');
    try {
      const roles = await this.seedRoles();
      this.logger.log('Roles seeded successfully, proceeding to seed users...');
      await this.seedUsers(roles);
      this.logger.log('All seeding completed successfully!');
    } catch (error) {
      this.logger.error(`Error seeding database: ${error.message}`);
      this.logger.error(error.stack);
    }
  }
}
