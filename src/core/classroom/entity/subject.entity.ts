import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import Assessment from './assessment.entity';
import LessonPlan from './lesson-plain.entity';
import User from 'src/core/authorization/entity/user.entity';

@Entity()
class Subject extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar', nullable: true })
  public name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  public fileUrl!: string | null;

  @OneToMany(() => Assessment, (assessment) => assessment.subject)
  public subjectAssessments?: Assessment[];

  @OneToMany(() => LessonPlan, (lessonPlan) => lessonPlan.subject)
  public lessonPlans?: LessonPlan[];

  @Column({ nullable: true, type: 'uuid' })
  public createdById!: string | null;

  @ManyToOne(() => User, (user) => user.createdSubjects)
  public createdBy?: User;
}

export default Subject;
