import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserType } from './../constants/authorization.constants';

@Entity()
class Permission {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ default: UserType.Teacher })
  public type?: string;

  @Column({ unique: true })
  public name!: string;

  @Column({ default: true })
  public active!: boolean;
}

export default Permission;
