import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import Group from './group.entity';
import User from './user.entity';
@Entity()
class UserGroup {
  @PrimaryColumn({ type: 'uuid' })
  public groupId!: string;

  @PrimaryColumn({ type: 'uuid' })
  public userId!: string;

  @ManyToOne(() => User, (user) => user.userGroups)
  public user!: User;

  @ManyToOne(() => Group, (group) => group.userGroups)
  public group!: Group;
}

export default UserGroup;
