import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import UserGroup from './user.group.entity';

@Entity()
class Group {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ unique: true })
  public name!: string;

  @Column({ default: true })
  public active!: boolean;

  @OneToMany(() => UserGroup, (userGroup) => userGroup.group)
  public userGroups!: UserGroup[];
}

export default Group;
