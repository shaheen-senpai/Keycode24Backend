import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Subject from './entity/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject])],
  providers: [],
  exports: [],
})
export class SubjectModule {}
