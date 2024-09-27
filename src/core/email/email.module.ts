import { Module } from '@nestjs/common';
import { SesMailService } from './service/ses.mail.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SesMailService],
  exports: [SesMailService],
})
export class EmailModule {}
