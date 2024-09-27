import { Module } from '@nestjs/common';
import * as coreModules from '../core/index';
@Module({
  imports: [...Object.values(coreModules)],
  providers: [],
  controllers: [],
  exports: [],
})
export class CustomerModule {}
