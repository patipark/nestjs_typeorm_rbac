import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsNumber()
  @IsOptional()
  parentRoleId?: number | null;
}