// import { createNamespace, Namespace } from 'cls-hooked';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { CustomExceptionsFilter } from './common/exception/exception.filter';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { LoggerService } from './common/logger/logger.service';
// import { requestIdBinder } from './core/authorization/logging.middleware';
// import { Logging } from './core/authorization/constants/logging.constants';
import { configureHandlebars } from './common/config/handlebars.config';
import { getCORSOrigin } from './common/utils/general.utils';

async function bootstrap() {
  initializeTransactionalContext(); // Initialize cls-hooked
  const appOptions: NestApplicationOptions = {
    cors: {
      credentials: true,
      origin: getCORSOrigin(),
    },
    logger: new LoggerService('bootstrap()'),
    bufferLogs: true,
  };
  const app = await NestFactory.create(AppModule, appOptions);
  // const applicationNamespace: Namespace = createNamespace(Logging.LogNameSpace);
  // app.use(requestIdBinder(applicationNamespace));
  const configService = app.get(ConfigService);
  const logger = LoggerService.getInstance('bootstrap()');
  app.setGlobalPrefix('ums/api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new CustomExceptionsFilter());
  app.use(cookieParser(configService.get('COOKIE_SECRET')));
  // app.useLogger(app.get(LoggerService));
  await app.listen(configService.get('PORT') || 4000);
  configureHandlebars();

  logger.info(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
