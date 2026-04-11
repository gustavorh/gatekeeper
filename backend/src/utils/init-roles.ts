import { eq } from 'drizzle-orm';
import { roles } from '../infrastructure/database/schema';
import { v4 as uuidv4 } from 'uuid';

export async function initializeRoles(db: any) {
  console.log('Inicializando roles...');

  // Verificar si existe el rol "user"
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
    console.log('✓ Rol "user" creado');
  } else {
    console.log('- Rol "user" ya existe');
  }

  // Verificar si existe el rol "admin"
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
    console.log('✓ Rol "admin" creado');
  } else {
    console.log('- Rol "admin" ya existe');
  }

  console.log('Roles inicializados correctamente');
}
