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

export interface CreateUserDto {
  rut: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserDto {
  rut?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}
