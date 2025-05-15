import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateRoleHierarchyDto } from './dto/create-role-hierarchy.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Post('hierarchy')
  @Roles('admin')
  createHierarchy(@Body() createHierarchyDto: CreateRoleHierarchyDto) {
    return this.rolesService.createHierarchyRelationship(
      createHierarchyDto.parentRoleId,
      createHierarchyDto.childRoleId
    );
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Get(':id/children')
  @Roles('admin')
  findChildren(@Param('id') id: string) {
    return this.rolesService.findChildren(+id);
  }

  @Get(':id/parent')
  @Roles('admin')
  findParent(@Param('id') id: string) {
    return this.rolesService.findParent(+id);
  }

  @Get(':id/ancestors')
  @Roles('admin')
  findAncestors(@Param('id') id: string) {
    return this.rolesService.findAllAncestors(+id);
  }
  
  @Get(':id/check-capability')
  @Roles('admin')
  checkCapability(@Param('id') id: string, @Query('roleName') roleName: string) {
    return this.rolesService.hasCapability(+id, roleName);
  }

  @Get('hierarchy/visualization')
  @Roles('admin')
  getHierarchyVisualization() {
    return this.rolesService.generateHierarchyVisualization();
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }
}
