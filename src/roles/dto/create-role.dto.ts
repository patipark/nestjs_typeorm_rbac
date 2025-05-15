import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsArray()
  @IsOptional()
  capabilities?: string[];
  
  @IsNumber()
  @IsOptional()
  parentRoleId?: number | null; // We'll keep this for API compatibility but handle it differently
}