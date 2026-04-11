// Core application types
export interface User {
  id: string;
  rut: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Computed field: firstName + lastName
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles?: Role[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface AuthResponse {
  user: UserWithRoles;
  token: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  rut: string;
  password: string;
}

export interface RegisterData {
  rut: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Shift types
export interface Shift {
  id: string;
  userId: string;
  clockInTime: string;
  clockOutTime?: string;
  status: "pending" | "active" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface ShiftHistoryResponse {
  shifts: Shift[];
  total: number;
}

export interface ShiftFilters {
  startDate: string;
  endDate: string;
  status: string;
  page: number;
  limit: number;
}

// Input DTOs (for sending data to backend)
export interface CreateUserData {
  rut: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserData {
  rut?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface CreateRoleData {
  name: string;
  description: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreatePermissionData {
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionData {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
  isActive?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path?: string;
  endpoint?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: PaginatedData<T>;
  timestamp: string;
  path?: string;
}

// Admin API specific response types
export interface AdminUsersResponse {
  users: UserWithRoles[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminRolesResponse {
  roles: Role[];
  total: number;
  page: string;
  limit: string;
}

export interface AdminPermissionsResponse {
  permissions: Permission[];
  total: number;
  page: string;
  limit: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  details?: Record<string, unknown>;
}

// Client/Organization types
export interface Client {
  id: string;
  name: string;
  domain: string;
  settings: ClientSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientSettings {
  theme: {
    primaryColor: string;
    logo?: string;
  };
  features: {
    timeTracking: boolean;
    accessControl: boolean;
    reporting: boolean;
  };
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
}
