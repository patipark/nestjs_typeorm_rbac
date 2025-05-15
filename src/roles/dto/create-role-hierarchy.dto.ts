import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateRoleHierarchyDto {
  @IsNumber()
  @IsNotEmpty()
  parentRoleId: number;

  @IsNumber()
  @IsNotEmpty()
  childRoleId: number;
}
