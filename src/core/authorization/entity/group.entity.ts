import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserType } from './../constants/authorization.constants';
import UserGroup from './userGroup.entity';

@Entity()
class Group {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ unique: true })
  public name!: string;

  @Column({ default: UserType.Teacher })
  public type?: string;

  @Column({ default: true })
  public active!: boolean;

  @OneToMany(() => UserGroup, (userGroup) => userGroup.group, { cascade: true })
  public userGroup!: UserGroup[];
}

export default Group;
