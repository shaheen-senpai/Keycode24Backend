import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import User from 'src/core/authorization/entity/user.entity';
import UserGrade from './user.grade.entity';
import SubjectGrade from './subject.grade.entity';

@Entity()
class Grade extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar', nullable: true })
  public name!: string | null;

  @Column({ nullable: true, type: 'uuid' })
  public createdById!: string | null;

  @ManyToOne(() => User, (user) => user.createdGrades)
  public createdBy?: User;

  @OneToMany(() => UserGrade, (userGrade) => userGrade.grade)
  public gradeUsers?: UserGrade[];

  @OneToMany(() => SubjectGrade, (subjectGrade) => subjectGrade.grade)
  public gradeSubjects?: SubjectGrade[];
}

export default Grade;
