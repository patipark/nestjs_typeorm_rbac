import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsNumber, IsOptional, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsArray()
  @IsOptional()
  capabilities?: string[];
  
  @IsNumber()
  @IsOptional()
  parentRoleId?: number | null;
}