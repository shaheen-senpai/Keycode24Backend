import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MLService } from './service/ml.service';

@Module({
  imports: [],
  providers: [ConfigService, MLService],
  exports: [MLService],
})
export class MLModule {}
