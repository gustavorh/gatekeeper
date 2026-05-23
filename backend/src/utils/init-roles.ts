import { eq } from 'drizzle-orm';
import { Logger } from '@nestjs/common';
import { roles } from '../infrastructure/database/schema';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('InitRoles');

export async function initializeRoles(db: any) {
  logger.log('Initializing roles…');

  const existingUserRole = await db
    .select()
    .from(roles)
    .where(eq(roles.name, 'user'))
    .limit(1);

  if (existingUserRole.length === 0) {
    await db.insert(roles).values({
      id: uuidv4(),
      name: 'user',
      description: 'Usuario regular del sistema',
      isActive: true,
    });
    logger.log('Created role "user"');
  } else {
    logger.debug('Role "user" already exists');
  }

  const existingAdminRole = await db
    .select()
    .from(roles)
    .where(eq(roles.name, 'admin'))
    .limit(1);

  if (existingAdminRole.length === 0) {
    await db.insert(roles).values({
      id: uuidv4(),
      name: 'admin',
      description: 'Administrador del sistema',
      isActive: true,
    });
    logger.log('Created role "admin"');
  } else {
    logger.debug('Role "admin" already exists');
  }

  logger.log('Roles initialized');
}
