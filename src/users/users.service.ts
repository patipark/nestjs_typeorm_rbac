import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find({ relations: ['roles'] });
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByUsername(username: string) {
    const user = await this.usersRepository.findOne({
      where: { username },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }

  async assignRole(userId: number, roleName: string) {
    const user = await this.findOne(userId);
    const role = await this.rolesService.findByName(roleName);
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }
    user.roles = [...user.roles, role];
    return this.usersRepository.save(user);
  }

  async removeRole(userId: number, roleName: string) {
    const user = await this.findOne(userId);
    user.roles = user.roles.filter(role => role.name !== roleName);
    return this.usersRepository.save(user);
  }
} 