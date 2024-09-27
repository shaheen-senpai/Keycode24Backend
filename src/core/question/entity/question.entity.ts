import {
  Column,
  Entity,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import Assessment from 'src/core/assessment/entity/assessment.entity';

@Entity()
class Question extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar', nullable: true })
  public questionText!: string | null;

  @Column('text', { array: true, nullable: true })
  public options!: string[] | null;

  @Column({ nullable: true, type: 'varchar' })
  public answer!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  public level!: string | null;

  @ManyToOne(() => Assessment, (assessment) => assessment.assessmentQuestions)
  public assessment?: Assessment;

  @Column({ nullable: true, type: 'uuid' })
  public assessmentId!: string | null;

  @DeleteDateColumn()
  public deletedAt?: Date;
}

export default Question;
