import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

class BaseEntity {
  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}

export default BaseEntity;
