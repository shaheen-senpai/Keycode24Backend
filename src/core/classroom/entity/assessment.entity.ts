import {
  Column,
  Entity,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import Grade from './grade.entity';
import Subject from './subject.entity';
import Question from './question.entity';
import User from 'src/core/authorization/entity/user.entity';

@Entity()
class Assessment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar', nullable: true })
  public name!: string | null;

  @ManyToOne(() => Grade, (grade) => grade.gradeAssessments)
  public grade?: Grade;

  @Column({ nullable: true, type: 'uuid' })
  public gradeId!: string | null;

  @ManyToOne(() => Subject, (subject) => subject.subjectAssessments)
  public subject?: Subject;

  @Column({ nullable: true, type: 'uuid' })
  public subjectId!: string | null;

  @OneToMany(() => Question, (question) => question.assessment)
  public assessmentQuestions?: Question[];

  @Column({ nullable: true, type: 'varchar' })
  public level!: string | null;

  @Column({ nullable: true, type: 'uuid' })
  public createdById!: string | null;

  @Column('text', { array: true, nullable: true })
  public outcomes!: string[] | null;

  @ManyToOne(() => User, (user) => user.createdAssessments)
  public createdBy?: User;

  @DeleteDateColumn()
  public deletedAt?: Date;

  public avgScore: number | null = 0;

  public progress: number | null = 50;
}

export default Assessment;
