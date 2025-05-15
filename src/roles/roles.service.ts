import { Injectable } from '@nestjs/common';
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

  create(createRoleDto: CreateRoleDto) {
    const role = this.rolesRepository.create(createRoleDto);
    return this.rolesRepository.save(role);
  }

  findAll() {
    return this.rolesRepository.find();
  }

  findOne(id: number) {
    return this.rolesRepository.findOne({ where: { id } });
  }

  findByName(name: string) {
    return this.rolesRepository.findOne({ where: { name } });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    await this.rolesRepository.update(id, updateRoleDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    if (!role) {
      throw new Error('Role not found');
    }
    return this.rolesRepository.remove(role);
  }
} 