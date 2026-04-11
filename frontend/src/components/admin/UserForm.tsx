"use client";

import { useState, useEffect } from "react";
import { Role, CreateUserData, UpdateUserData, UserWithRoles } from "@/types";
import { adminService } from "@/lib/adminService";
import { useNotification } from "@/contexts/NotificationContext";

interface UserFormProps {
  user?: UserWithRoles;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { showSuccess, showError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<
    CreateUserData & { roleIds: string[] }
  >({
    rut: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    roleIds: [],
  });

  const isEditing = !!user;

  useEffect(() => {
    loadRoles();
    if (user) {
      setFormData({
        rut: user.rut,
        email: user.email,
        password: "",
        firstName: user.firstName,
        lastName: user.lastName,
        roleIds: user.roles?.map((role) => role.id) || [],
      });
    }
  }, [user]);

  const loadRoles = async () => {
    try {
      const response = await adminService.getRoles(1, 100);
      if (response.success && response.data) {
        setRoles(response.data.roles || []);
      }
    } catch (error: unknown) {
      console.error("Error loading roles:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      roleIds: checked
        ? [...prev.roleIds, roleId]
        : prev.roleIds.filter((id) => id !== roleId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing) {
        const updateData: UpdateUserData & {
          roleIds?: string[];
          password?: string;
        } = {
          rut: formData.rut,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          roleIds: formData.roleIds,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await adminService.updateUser(user.id, updateData);
        showSuccess("Usuario actualizado exitosamente");
      } else {
        await adminService.createUser(formData);
        showSuccess("Usuario creado exitosamente");
      }

      onSuccess();
    } catch (error: any) {
      showError(error.message || "Error al procesar la solicitud");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RUT */}
          <div>
            <label
              htmlFor="rut"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              RUT *
            </label>
            <input
              type="text"
              id="rut"
              name="rut"
              value={formData.rut}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nombre *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Apellido *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Contraseña {isEditing ? "(dejar vacío para no cambiar)" : "*"}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={!isEditing}
              minLength={6}
            />
          </div>
        </div>

        {/* Roles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Roles
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.roleIds.includes(role.id)}
                  onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{role.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : isEditing ? "Actualizar" : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}
