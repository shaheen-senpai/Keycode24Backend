import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Assessment from './entity/assessment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment])],
  providers: [],
  exports: [],
})
export class AssessmentModule {}
