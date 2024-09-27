import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import * as redis from 'redis';
@Injectable()
export class RedisCacheService {
  private redisClient: redis.RedisClient;
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private configService: ConfigService,
  ) {
    this.redisClient = redis.createClient({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
    });
  }

  async get<T>(key: any): Promise<T | undefined> {
    return await this.cache.get<T>(key);
  }

  async set(key: any, value: any, ttl?: number) {
    if (ttl != undefined) {
      await this.cache.set(key, value, { ttl } );
      return;
    }
    await this.cache.set(key, value);
  }

  async reset() {
    await this.cache.reset();
  }

  async del(key: any) {
    await this.cache.del(key);
  }

  async clearCacheWithPrefix(prefix: string): Promise<void> {
    const keys = await this.getKeysByPrefix(prefix);
    if (keys.length > 0) {
      const pipeline = this.redisClient.batch();
      keys.forEach((key) => {
        pipeline.del(key);
      });
      await new Promise<void>((resolve, reject) => {
        pipeline.exec((err, results) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }
  }

  private getKeysByPrefix(prefix: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.redisClient.keys(`${prefix}*`, (err, keys) => {
        if (err) {
          return reject(err);
        }
        resolve(keys);
      });
    });
  }
}
