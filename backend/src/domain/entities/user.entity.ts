import { RegisterDto } from '../../application/dto/auth.dto';

export interface User {
  id: string;
  rut: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserDto = RegisterDto;

export interface UpdateUserDto {
  rut?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}
