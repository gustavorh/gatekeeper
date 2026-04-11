import { apiClient } from "./api";
import {
  User,
  Role,
  Permission,
  PaginatedResponse,
  AdminUsersResponse,
  AdminRolesResponse,
  AdminPermissionsResponse,
  CreateUserData,
  UpdateUserData,
  CreateRoleData,
  UpdateRoleData,
  CreatePermissionData,
  UpdatePermissionData,
} from "@/types";

// Admin API endpoints
const ADMIN_ENDPOINTS = {
  // Dashboard
  DASHBOARD: "/admin/dashboard",

  // Users
  USERS: "/admin/users",
  USER_BY_ID: (id: string) => `/admin/users/${id}`,
  USER_WITH_ROLES: (id: string) => `/admin/users/${id}/with-roles`,

  // Roles
  ROLES: "/admin/roles",
  ROLE_BY_ID: (id: string) => `/admin/roles/${id}`,
  ROLE_WITH_PERMISSIONS: (id: string) => `/admin/roles/${id}/with-permissions`,

  // Permissions
  PERMISSIONS: "/admin/permissions",
  PERMISSION_BY_ID: (id: string) => `/admin/permissions/${id}`,
};

export class AdminService {
  // Dashboard
  async getDashboardData() {
    return apiClient.get(ADMIN_ENDPOINTS.DASHBOARD);
  }

  // User Management
  async getUsers(page = 1, limit = 10, search = "") {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${ADMIN_ENDPOINTS.USERS}?${queryString}`
      : ADMIN_ENDPOINTS.USERS;

    const response = await apiClient.get<{ data: AdminUsersResponse }>(
      endpoint
    );
    return response;
  }

  async getUserById(id: string) {
    return apiClient.get<User>(ADMIN_ENDPOINTS.USER_BY_ID(id));
  }

  async getUserWithRoles(id: string) {
    return apiClient.get<User & { roles: Role[] }>(
      ADMIN_ENDPOINTS.USER_WITH_ROLES(id)
    );
  }

  async createUser(userData: CreateUserData & { roleIds?: string[] }) {
    return apiClient.post<User>(
      ADMIN_ENDPOINTS.USERS,
      userData as unknown as Record<string, unknown>
    );
  }

  async updateUser(
    id: string,
    userData: UpdateUserData & { roleIds?: string[] }
  ) {
    return apiClient.put<User>(
      ADMIN_ENDPOINTS.USER_BY_ID(id),
      userData as unknown as Record<string, unknown>
    );
  }

  async deleteUser(id: string) {
    return apiClient.delete(ADMIN_ENDPOINTS.USER_BY_ID(id));
  }

  // Role Management
  async getRoles(page = 1, limit = 10, search = "") {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${ADMIN_ENDPOINTS.ROLES}?${queryString}`
      : ADMIN_ENDPOINTS.ROLES;

    return apiClient.get<AdminRolesResponse>(endpoint);
  }

  async getRoleById(id: string) {
    return apiClient.get<Role>(ADMIN_ENDPOINTS.ROLE_BY_ID(id));
  }

  async getRoleWithPermissions(id: string) {
    return apiClient.get<Role & { permissions: Permission[] }>(
      ADMIN_ENDPOINTS.ROLE_WITH_PERMISSIONS(id)
    );
  }

  async createRole(roleData: CreateRoleData & { permissionIds?: string[] }) {
    return apiClient.post<Role>(
      ADMIN_ENDPOINTS.ROLES,
      roleData as unknown as Record<string, unknown>
    );
  }

  async updateRole(
    id: string,
    roleData: UpdateRoleData & { permissionIds?: string[] }
  ) {
    return apiClient.put<Role>(
      ADMIN_ENDPOINTS.ROLE_BY_ID(id),
      roleData as unknown as Record<string, unknown>
    );
  }

  async deleteRole(id: string) {
    return apiClient.delete(ADMIN_ENDPOINTS.ROLE_BY_ID(id));
  }

  // Permission Management
  async getPermissions(page = 1, limit = 10, search = "") {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${ADMIN_ENDPOINTS.PERMISSIONS}?${queryString}`
      : ADMIN_ENDPOINTS.PERMISSIONS;

    return apiClient.get<AdminPermissionsResponse>(endpoint);
  }

  async getPermissionById(id: string) {
    return apiClient.get<Permission>(ADMIN_ENDPOINTS.PERMISSION_BY_ID(id));
  }

  async createPermission(permissionData: CreatePermissionData) {
    return apiClient.post<Permission>(
      ADMIN_ENDPOINTS.PERMISSIONS,
      permissionData as unknown as Record<string, unknown>
    );
  }

  async updatePermission(id: string, permissionData: UpdatePermissionData) {
    return apiClient.put<Permission>(
      ADMIN_ENDPOINTS.PERMISSION_BY_ID(id),
      permissionData as unknown as Record<string, unknown>
    );
  }

  async deletePermission(id: string) {
    return apiClient.delete(ADMIN_ENDPOINTS.PERMISSION_BY_ID(id));
  }
}

export const adminService = new AdminService();
