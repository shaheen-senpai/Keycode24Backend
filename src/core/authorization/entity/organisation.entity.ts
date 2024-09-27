import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import UserOrganisation from './user.organisation.entity';
import User from './user.entity';

@Entity()
class Organisation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ nullable: true })
  public name?: string;

  @Column({ nullable: true })
  public email?: string;

  @Column({ nullable: true, type: 'uuid' })
  public countryId?: string;

  @Column({ nullable: true })
  public logo?: string;

  @OneToMany(
    () => UserOrganisation,
    (userOrganisation) => userOrganisation.organisation,
  )
  public organisationUser!: UserOrganisation[];

  @Column({ nullable: true, type: 'uuid' })
  public createdById!: string;

  @ManyToOne(() => User, (user) => user.createdOrganisations)
  public createdBy!: User;
}

export default Organisation;
