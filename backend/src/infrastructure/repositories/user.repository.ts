import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
} from '../../domain/entities/user.entity';
import { users } from '../database/schema';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@Inject('DATABASE') private readonly db: any) {}

  async create(user: CreateUserDto): Promise<User> {
    const userId = uuidv4();

    await this.db.insert(users).values({
      id: userId,
      rut: user.rut,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // Obtener el usuario creado
    const [newUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    return newUser;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async findByRut(rut: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.rut, rut));
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || null;
  }

  async findAll(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async update(id: string, user: UpdateUserDto): Promise<User> {
    await this.db
      .update(users)
      .set({
        ...user,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    // Obtener el usuario actualizado
    const [updatedUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async existsByRut(rut: string): Promise<boolean> {
    const [user] = await this.db.select().from(users).where(eq(users.rut, rut));
    return !!user;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return !!user;
  }
}
