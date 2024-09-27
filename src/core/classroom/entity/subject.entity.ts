import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';
import Assessment from './assessment.entity';

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
}

export default Subject;
