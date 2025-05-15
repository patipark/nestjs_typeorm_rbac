import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Role } from './entities/role.entity';
import { RoleHierarchy } from './entities/role-hierarchy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RoleHierarchy])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {} 