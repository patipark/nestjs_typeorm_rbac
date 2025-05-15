import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, OneToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => User, user => user.roles)
  users: User[];
    @ManyToOne(() => Role, role => role.childRoles, { nullable: true })
  parentRole: Role | null;
  
  @OneToMany(() => Role, role => role.parentRole)  childRoles: Role[];
}