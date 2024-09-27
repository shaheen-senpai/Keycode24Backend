import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';

import Organisation from './organisation.entity';
import User from './user.entity';

@Entity()
class UserOrganisation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Index('user_organisation_user_id_idx')
  @Column()
  public userId!: string;

  @Index('user_organisation_organisation_id_idx')
  @Column()
  public organisationId!: string;

  @Column({ nullable: true })
  public role?: string;

  @ManyToOne(() => User, (user) => user.userOrganisation)
  public user!: User;

  @ManyToOne(
    () => Organisation,
    (organisation) => organisation.organisationUser,
    { cascade: true },
  )
  public organisation!: Organisation;

  @DeleteDateColumn()
  public deletedAt?: Date;
}

export default UserOrganisation;
