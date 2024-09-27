import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { RedisCacheService } from './redis-cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => [
        {
          store: redisStore,
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          ttl: configService.get('REDIS_CACHE_TTL'),
          max: configService.get('REDIS_MAX_ITEM_IN_CACHE'),
        },
      ],
    }),
    ConfigModule,
  ],
  providers: [RedisCacheService],
  exports: [CacheModule, RedisCacheService],
})
export class RedisCacheModule {}
