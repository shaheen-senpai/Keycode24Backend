import {
  Column,
  Entity,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import Grade from 'src/core/grade/entity/grade.entity';
import Subject from 'src/core/subject/entity/subject.entity';
import Question from 'src/core/question/entity/question.entity';

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

  @DeleteDateColumn()
  public deletedAt?: Date;
}

export default Assessment;
