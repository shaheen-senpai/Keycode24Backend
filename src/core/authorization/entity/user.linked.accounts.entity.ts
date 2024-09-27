import BaseEntity from '../../../common/utils/base.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  ObjectLiteral,
  Index,
} from 'typeorm';
import User from './user.entity';

@Entity()
class UserLinkedAccounts extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @ManyToOne(() => User, (user) => user.userLinkedAccounts, {
    createForeignKeyConstraints: false,
  })
  public user?: User;

  @Index('user_linked_accounts_user_id_idx')
  @Column({ nullable: true })
  public userId?: string;

  @Index('user_linked_accounts_organisation_id_idx')
  @Column({ type: 'uuid', nullable: true })
  public organisationId?: string;

  // unique immutable identity provided from the platform
  @Column({ nullable: true })
  public uniqueid?: string;

  @Column({ default: false })
  public isLinkVerified?: boolean;

  @Column({ default: true })
  public isActive?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  public data?: ObjectLiteral;
}

export default UserLinkedAccounts;
