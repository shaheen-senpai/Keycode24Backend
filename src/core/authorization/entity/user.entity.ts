import {
  Column,
  Entity,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import Grade from 'src/core/classroom/entity/grade.entity';
import Assessment from 'src/core/classroom/entity/assessment.entity';
import ChatMessage from './../../classroom/entity/chat.message.entity';
import Chat from 'src/core/classroom/entity/chat.entity';
import LessonPlan from 'src/core/classroom/entity/lesson.plan.entity';
import Subject from 'src/core/classroom/entity/subject.entity';

@Entity()
class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar', nullable: true })
  public name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  public email!: string | null;

  @Column({ type: 'varchar', nullable: true })
  public phone!: string | null;

  @Column({ type: 'varchar', nullable: true })
  public type!: string | null;

  @Column({ type: 'varchar', nullable: true, select: false })
  public password!: string | null;

  @Column({ type: 'varchar', nullable: true })
  public gender!: string | null;

  @Column({ type: 'date', nullable: true })
  public dob!: Date | null;

  @OneToMany(() => Grade, (grade) => grade.createdBy)
  public createdGrades?: Grade[];

  @OneToMany(() => Assessment, (assessment) => assessment.createdBy)
  public createdAssessments?: Assessment[];

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.sender)
  public messages!: ChatMessage[];

  @OneToMany(() => LessonPlan, (lessonPlan) => lessonPlan.createdBy)
  public createdLessonPlans?: LessonPlan[];

  @OneToMany(() => Chat, (chat) => chat.createdBy)
  public createdChats!: Chat[];

  @OneToMany(() => Subject, (subject) => subject.createdBy)
  public createdSubjects?: Subject[];

  @DeleteDateColumn()
  public deletedAt?: Date;

  public avgScore: number | null = 0;
}

export default User;
