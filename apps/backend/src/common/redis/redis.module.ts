import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        console.log('DEBUG: REDIS_URL from configService is', JSON.stringify(redisUrl));
        console.log('DEBUG: REDIS_URL from process.env is', JSON.stringify(process.env.REDIS_URL));
        const client = createClient({
          url: redisUrl,
        });
        client.on('error', (err) => console.error('Redis error:', err));
        await client.connect();
        console.log('✅ Redis connected');
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
