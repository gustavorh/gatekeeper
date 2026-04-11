import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';
import { initializeRoles } from '../../utils/init-roles';

@Module({
  providers: [
    {
      provide: 'DATABASE',
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');

        // Si DATABASE_URL está definido, úsalo
        if (dbConfig.url) {
          const connection = mysql.createPool({
            uri: dbConfig.url,
          });
          return drizzle(connection, { schema, mode: 'default' });
        }

        // Si no, construye la conexión con variables separadas
        const connection = mysql.createPool({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          charset: dbConfig.charset,
          timezone: dbConfig.timezone,
        });

        return drizzle(connection, { schema, mode: 'default' });
      },
      inject: [ConfigService],
    },
    {
      provide: 'CONNECTION',
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');

        // Si DATABASE_URL está definido, úsalo
        if (dbConfig.url) {
          return mysql.createPool({
            uri: dbConfig.url,
          });
        }

        // Si no, construye la conexión con variables separadas
        return mysql.createPool({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          charset: dbConfig.charset,
          timezone: dbConfig.timezone,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DATABASE', 'CONNECTION'],
})
export class DatabaseModule implements OnModuleInit {
  constructor(@Inject('DATABASE') private readonly db: any) {}

  async onModuleInit() {
    // Inicializar roles al arrancar la aplicación
    //await initializeRoles(this.db);
  }
}
