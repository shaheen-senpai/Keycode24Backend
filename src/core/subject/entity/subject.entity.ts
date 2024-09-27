import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import BaseEntity from '../../../common/utils/base.entity';

@Entity()
class Subject extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'varchar', nullable: true })
  public name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  public fileUrl!: string | null;
}

export default Subject;
