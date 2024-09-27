import { TypeOrmModule } from '@nestjs/typeorm';
import Grade from './entity/grade.entity';
import { Module } from '@nestjs/common';
import SubjectGrade from './entity/subject.grade.entity';
import UserGrade from './entity/user.grade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, SubjectGrade, UserGrade])],
  providers: [],
  exports: [],
})
export class GradeModule {}
