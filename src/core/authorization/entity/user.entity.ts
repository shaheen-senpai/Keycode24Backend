import {
  Column,
  Entity,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import UserOrganisation from './user.organisation.entity';
import Notification from '../../notification/entity/notification.entity';
import UserGroup from './userGroup.entity';
import UserLinkedAccounts from './user.linked.accounts.entity';
import Organisation from './organisation.entity';

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ nullable: true })
  public email!: string;

  @Column({ default: false })
  public isEmailVerified?: boolean;

  @Column({ nullable: true })
  public phone?: string;

  @Column({ nullable: true, type: 'varchar' })
  public password!: string | null;

  @Column({ nullable: true })
  public firstName?: string;

  @Column({ nullable: true })
  public middleName?: string;

  @Column({ nullable: true })
  public lastName?: string;

  @Column({ type: 'date', nullable: true })
  public dob?: Date;

  @Column({ nullable: true })
  public address?: string;

  @Column({ nullable: true })
  public gender?: string;

  @Column({ nullable: true, type: 'uuid' })
  public countryId?: string;

  @Column({ default: true })
  public isActive?: boolean;

  @Column({ default: true })
  public isTeacher!: boolean;

  @Column({ default: false })
  public isParent!: boolean;

  @Column({ nullable: true })
  public refreshToken?: string;

  @Column({ nullable: true })
  public defaultOrganisationId?: string;

  @OneToMany(
    () => UserOrganisation,
    (userOrganisation) => userOrganisation.user,
    { cascade: true },
  )
  public userOrganisation!: UserOrganisation[];

  @OneToMany(() => Notification, (notification) => notification.user)
  public notifications!: Notification[];

  @OneToMany(() => UserGroup, (userGroup) => userGroup.user, { cascade: true })
  public userGroup!: UserGroup[];

  @OneToMany(
    () => UserLinkedAccounts,
    (userLinkedAccounts) => userLinkedAccounts.user,
  )
  public userLinkedAccounts!: UserLinkedAccounts[];

  @Column({ type: 'uuid', nullable: true })
  public createdBy!: string;

  //Organisations created by user
  @OneToMany(() => Organisation, (organisation) => organisation.createdBy)
  public createdOrganisations?: Organisation[];

  @DeleteDateColumn()
  public deletedAt?: Date;

  public get fullName(): string {
    return `${this.firstName || ''}${this.lastName ? ` ${this.lastName}` : ''}`;
  }
}

export default User;
