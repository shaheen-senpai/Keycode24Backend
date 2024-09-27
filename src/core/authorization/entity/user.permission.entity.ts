import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import User from './user.entity';

@Entity()
class UserPermission {
  @PrimaryColumn({ type: 'uuid' })
  public permissionId!: string;

  @PrimaryColumn({ type: 'uuid' })
  public userId!: string;

  @ManyToOne(() => User, (user) => user.userPermissions)
  public user!: User;
}

export default UserPermission;
