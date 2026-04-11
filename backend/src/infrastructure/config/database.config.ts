import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  // Si DATABASE_URL está definido, úsalo
  url: process.env.DATABASE_URL,

  // Si no, construye la URL con variables separadas
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gatekeeper',

  // Configuración adicional
  charset: 'utf8mb4',
  timezone: '+00:00',
}));
