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
import Assessment from './assessment.entity';

@Entity()
class StudentAssessment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @OneToOne(() => User, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  public user?: User;

  @Column({ type: 'varchar', nullable: true })
  public userId!: string | null;

  @ManyToOne(() => Assessment, (assessment) => assessment.assessmentQuestions)
  public assessment?: Assessment;

  @Column({ nullable: true, type: 'uuid' })
  public assessmentId!: string | null;

  @Column({ nullable: true, type: 'smallint' })
  public score!: number | null;
}

export default StudentAssessment;
