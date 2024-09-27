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

  @Column({ type: 'varchar', nullable: true })
  public password!: string | null;

  @Column({ type: 'date', nullable: true })
  public dob!: Date | null;

  @OneToMany(() => Grade, (grade) => grade.createdBy)
  public createdGrades?: Grade[];

  @OneToMany(() => Assessment, (assessment) => assessment.createdBy)
  public createdAssessments?: Assessment[];

  @DeleteDateColumn()
  public deletedAt?: Date;
}

export default User;
