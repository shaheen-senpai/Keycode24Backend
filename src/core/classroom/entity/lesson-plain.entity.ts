import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import User from 'src/core/authorization/entity/user.entity';
import Subject from './subject.entity';

@Entity()
class LessonPlan extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar', nullable: true })
  public name!: string | null;

  @Column({ nullable: true, type: 'uuid' })
  public createdById!: string | null;

  @ManyToOne(() => User, (user) => user.createdLessonPlans)
  public createdBy?: User;

  @ManyToOne(() => Subject, (Subject) => Subject.lessonPlans)
  public subject?: Subject;

  @Column({ type: 'jsonb', nullable: true })
  public data!: object | null;
}

export default LessonPlan;
