import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import yargs from 'yargs';
import Joi from 'joi';

import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './common/health/health.module';
import * as coreModules from './core/index';
import { CustomerModule } from './customer-interface/customer.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './common/cron/cron.module';
import { HeaderMiddleware } from './header.middleware';

const additionalModules = [];
const { argv }: any = yargs(process.argv.slice(2))
  .option('additionalModules', {
    default: '',
    description: 'Additional modules to be added in comma separated string',
  })
  .fail((message: string | undefined, err: any) => {
    if (err) throw err;
    throw new Error(message);
  })
  .version('1.0.0')
  .help();
if (argv.additionalModules) {
  const additionalModulesArr = argv.additionalModules.split(',');
  additionalModulesArr.includes('cron') && additionalModules.push(CronModule);
}
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
    ...additionalModules,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeaderMiddleware).forRoutes('*');
  }
}
