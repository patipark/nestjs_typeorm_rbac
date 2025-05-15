import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('role_hierarchy')
export class RoleHierarchy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  parentRoleId: number;

  @Column()
  childRoleId: number;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  parentRole: Role;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  childRole: Role;

  @CreateDateColumn()
  createdAt: Date;
}
