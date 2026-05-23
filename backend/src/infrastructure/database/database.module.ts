import {
  Module,
  OnApplicationShutdown,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';

type MySqlPool = mysql.Pool;

function buildPool(configService: ConfigService): MySqlPool {
  const dbConfig = configService.get<{
    url?: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    charset: string;
    timezone: string;
  }>('database');

  if (!dbConfig) {
    throw new Error('database config namespace missing');
  }

  if (dbConfig.url) {
    return mysql.createPool({ uri: dbConfig.url });
  }

  return mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    charset: dbConfig.charset,
    timezone: dbConfig.timezone,
  });
}

@Module({
  providers: [
    {
      provide: 'CONNECTION',
      useFactory: (configService: ConfigService) => buildPool(configService),
      inject: [ConfigService],
    },
    {
      provide: 'DATABASE',
      useFactory: (pool: MySqlPool) =>
        drizzle(pool, { schema, mode: 'default' }),
      inject: ['CONNECTION'],
    },
  ],
  exports: ['DATABASE', 'CONNECTION'],
})
export class DatabaseModule implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject('CONNECTION') private readonly pool: MySqlPool) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Closing MySQL pool (signal: ${signal ?? 'unknown'})`);
    try {
      await this.pool.end();
    } catch (err) {
      this.logger.error(
        `Error closing MySQL pool: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
