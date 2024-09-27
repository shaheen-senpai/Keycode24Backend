import { Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import Group from './group.entity';
import User from './user.entity';
@Entity()
class UserGroup {
  @PrimaryColumn({ type: 'uuid' })
  public groupId!: string;

  @Index('user_group_user_id_idx')
  @PrimaryColumn({ type: 'uuid' })
  public userId!: string;

  @ManyToOne(() => User, (user) => user.userGroup, {
    createForeignKeyConstraints: false,
  })
  public user?: User;

  @PrimaryColumn({ type: 'uuid' })
  @Index('user_group_organisation_id_idx')
  public organisationId!: string;

  @ManyToOne(() => Group, (group) => group.userGroup, {
    createForeignKeyConstraints: false,
  })
  public group?: Group;
}

export default UserGroup;
