import User from '../../authorization/entity/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  ObjectLiteral,
  PrimaryGeneratedColumn,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';

@Entity()
class Notification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @ManyToOne(() => User, (user) => user.notifications, { cascade: false })
  @JoinColumn()
  public user?: User;

  @Index('notification_user_id_idx')
  @Column('uuid')
  public userId!: string;

  @Index('notification_organisation_id_idx')
  @Column('uuid')
  public organisationId!: string;

  @Column()
  public message!: string;

  @Column({ nullable: true, type: 'text' })
  public htmlMessage!: string | null;

  @Column()
  public type!: string;

  @Index('notification_read_at_idx')
  @Column({ nullable: true })
  public readAt?: Date;

  @Column('jsonb')
  public data?: ObjectLiteral;
}

export default Notification;
