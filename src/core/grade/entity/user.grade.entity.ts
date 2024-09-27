import BaseEntity from 'src/common/utils/base.entity';
import User from 'src/core/authorization/entity/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Grade from './grade.entity';

@Entity()
class UserGrade extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @OneToOne(() => User, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  public user?: User;

  @Column({ type: 'varchar', nullable: true })
  public userId!: string | null;

  @ManyToOne(() => Grade, (grade) => grade.gradeUsers)
  public grade?: Grade;

  @Column({ nullable: true, type: 'uuid' })
  public gradeId!: string | null;
}

export default UserGrade;
