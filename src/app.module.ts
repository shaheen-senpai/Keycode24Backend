import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './common/health/health.module';
import * as coreModules from './core/index';
import { CustomerModule } from './customer-interface/customer.module';
import { ScheduleModule } from '@nestjs/schedule';
import Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        PORT: Joi.number(),
        JWT_SECRET: Joi.string().required().min(10),
        GOOGLE_CLIENT_ID: Joi.string(),
        ENV: Joi.string()
          .valid('local', 'develop', 'stage', 'demo', 'production')
          .required(),
        APP_URL: Joi.string().required(),
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
    CustomerModule,
    ...Object.values(coreModules),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
