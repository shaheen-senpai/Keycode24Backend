import BaseEntity from 'src/common/utils/base.entity';
import Subject from 'src/core/subject/entity/subject.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Grade from './grade.entity';

@Entity()
class SubjectGrade extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @OneToOne(() => Subject, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn()
  public subject?: Subject;

  @Column({ type: 'varchar', nullable: true })
  public subjectId!: string | null;

  @ManyToOne(() => Grade, (grade) => grade.gradeSubjects)
  public grade?: Grade;

  @Column({ nullable: true, type: 'uuid' })
  public gradeId!: string | null;
}

export default SubjectGrade;
