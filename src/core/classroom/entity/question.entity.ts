import {
  Column,
  Entity,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import Assessment from './assessment.entity';

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

  @ManyToOne(() => Assessment, (assessment) => assessment.assessmentQuestions)
  public assessment?: Assessment;

  @Column({ nullable: true, type: 'uuid' })
  public assessmentId!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  public type!: string | null;

  @Column({ nullable: true, type: 'decimal', precision: 2, scale: 2 })
  public weightage!: string | null;

  @DeleteDateColumn()
  public deletedAt?: Date;
}

export default Question;
