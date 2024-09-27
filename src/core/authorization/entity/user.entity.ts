import {
  Column,
  Entity,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import UserGroup from './user.group.entity';
import UserPermission from './user.permission.entity';

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar', nullable: true })
  public firstName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  public lastName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  public email!: string | null;

  @Column({ type: 'varchar', nullable: false })
  public phone!: string;

  @Column({ default: false })
  public isPhoneVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  public password!: string | null;

  @Column({ type: 'date', nullable: true })
  public dob!: Date | null;

  @DeleteDateColumn()
  public deletedAt?: Date;

  // Relations
  @OneToMany(() => UserGroup, (userGroup) => userGroup.user)
  public userGroups!: UserGroup[];

  @OneToMany(() => UserPermission, (userPermission) => userPermission.user)
  public userPermissions!: UserPermission[];

  // Derived Fields
  public get fullName(): string {
    return `${this.firstName || ''}${this.lastName ? ` ${this.lastName}` : ''}`;
  }
}

export default User;
