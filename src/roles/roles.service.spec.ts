import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  let mockRepository;
  // Mock data with capabilities for role inheritance testing
  const roleUser = { 
    id: 1, 
    name: 'user', 
    description: 'Basic user',
    capabilities: ['read:own', 'user:access'],
    parentRole: null,
    childRoles: []
  };
  
  const roleEditor = { 
    id: 2, 
    name: 'editor', 
    description: 'Content editor',
    capabilities: ['create:content', 'edit:content', 'editor:access'],
    parentRole: roleUser,
    childRoles: []
  };
  
  const roleManager = {
    id: 3,
    name: 'manager',
    description: 'Content manager',
    capabilities: ['approve:content', 'manage:users', 'manager:access'],
    parentRole: roleEditor,
    childRoles: []
  };
  
  const roleAdmin = { 
    id: 4, 
    name: 'admin', 
    description: 'Administrator',
    capabilities: ['delete:any', 'admin:access'],
    parentRole: roleManager,
    childRoles: []
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation(dto => dto),
      save: jest.fn().mockImplementation(role => Promise.resolve({
        id: Date.now(),
        ...role
      })),      find: jest.fn().mockResolvedValue([roleUser, roleEditor, roleManager, roleAdmin]),
      findOne: jest.fn().mockImplementation(({ where: { id } }) => {
        if (id === 1) return Promise.resolve({ ...roleUser });
        if (id === 2) return Promise.resolve({ ...roleEditor });
        if (id === 3) return Promise.resolve({ ...roleManager });
        if (id === 4) return Promise.resolve({ ...roleAdmin });
        return Promise.resolve(null);
      }),
      remove: jest.fn().mockImplementation(role => Promise.resolve(role)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a role without a parent', async () => {
      const createRoleDto = { name: 'new-role', description: 'New role' };
      const result = await service.create(createRoleDto);
      
      expect(result).toHaveProperty('name', 'new-role');
      expect(result).toHaveProperty('description', 'New role');
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'new-role',
        description: 'New role',
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create a role with a parent', async () => {
      const createRoleDto = { 
        name: 'sub-role', 
        description: 'Sub role', 
        parentRoleId: 1 
      };
      
      const result = await service.create(createRoleDto);
      
      expect(result).toHaveProperty('name', 'sub-role');
      expect(result).toHaveProperty('parentRole');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when parent role is not found', async () => {
      const createRoleDto = { 
        name: 'sub-role', 
        description: 'Sub role', 
        parentRoleId: 999 // non-existent role ID
      };
      
      await expect(service.create(createRoleDto)).rejects.toThrow(NotFoundException);
    });
  });  describe('hasCapability', () => {
    it('should return true for direct capability match', async () => {
      mockRepository.findOne = jest.fn().mockImplementation(({ where: { id } }) => {
        if (id === 1) return Promise.resolve({ ...roleUser });
        if (id === 2) return Promise.resolve({ ...roleEditor });
        if (id === 3) return Promise.resolve({ ...roleManager });
        if (id === 4) return Promise.resolve({ ...roleAdmin });
        return Promise.resolve(null);
      });
      
      const result = await service.hasCapability(1, 'user');
      expect(result).toBeTruthy();
    });

    it('should return true for inherited capability', async () => {
      mockRepository.findOne = jest.fn().mockImplementation(({ where: { id } }) => {
        if (id === 1) return Promise.resolve({ ...roleUser, name: 'user' });
        if (id === 2) return Promise.resolve({ ...roleEditor, name: 'editor', parentRole: { ...roleUser, name: 'user' } });
        if (id === 3) return Promise.resolve({ ...roleManager, name: 'manager', parentRole: { ...roleEditor, name: 'editor' } });
        if (id === 4) return Promise.resolve({ ...roleAdmin, name: 'admin', parentRole: { ...roleManager, name: 'manager' } });
        return Promise.resolve(null);
      });
      
      // Admin should inherit user capability
      const result = await service.hasCapability(4, 'user');
      expect(result).toBeTruthy();
    });

    it('should return false when role does not have the capability', async () => {
      mockRepository.findOne = jest.fn().mockImplementation(({ where: { id, name } }) => {
        if (id === 1) return Promise.resolve({ ...roleUser, name: 'user' });
        return Promise.resolve(null);
      });
      
      const result = await service.hasCapability(1, 'unknown-role');
      expect(result).toBeFalsy();
    });

    it('should handle multi-level inheritance', async () => {
      // Setup a four-level inheritance chain: user -> editor -> manager -> admin
      mockRepository.findOne = jest.fn().mockImplementation(({ where: { id } }) => {
        if (id === 1) return Promise.resolve({ 
          ...roleUser, 
          name: 'user' 
        });
        if (id === 2) return Promise.resolve({ 
          ...roleEditor, 
          name: 'editor', 
          parentRole: { id: 1, name: 'user' } 
        });
        if (id === 3) return Promise.resolve({ 
          ...roleManager, 
          name: 'manager', 
          parentRole: { id: 2, name: 'editor' } 
        });
        if (id === 4) return Promise.resolve({ 
          ...roleAdmin, 
          name: 'admin', 
          parentRole: { id: 3, name: 'manager' } 
        });
        return Promise.resolve(null);
      });
      
      // Test that admin inherits from user (three levels down)
      const result = await service.hasCapability(4, 'user');
      expect(result).toBeTruthy();
    });
  });

  describe('update', () => {
    it('should update a role without changing parent', async () => {
      const updateRoleDto = { name: 'updated-role' };
      const result = await service.update(1, updateRoleDto);
      
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('name', 'updated-role');
    });

    it('should update a role and add a parent', async () => {
      const updateRoleDto = { parentRoleId: 2 };
      const result = await service.update(1, updateRoleDto);
      
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update a role and remove parent', async () => {
      const updateRoleDto = { parentRoleId: null };
      const result = await service.update(2, updateRoleDto);
      
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role is not found', async () => {
      const updateRoleDto = { name: 'updated-role' };
      
      await expect(service.update(999, updateRoleDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when parent role is not found', async () => {
      const updateRoleDto = { parentRoleId: 999 };
      
      await expect(service.update(1, updateRoleDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a role and update child roles', async () => {
      // Mock child roles
      mockRepository.findOne = jest.fn().mockImplementation(({ where: { id } }) => {
        if (id === 1) return Promise.resolve({ 
          ...roleUser, 
          childRoles: [{ ...roleEditor, parentRole: roleUser }]
        });
        return Promise.resolve(null);
      });
      
      const result = await service.remove(1);
      
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role is not found', async () => {
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
