"use client";

import { useState, useEffect } from "react";
import { UserWithRoles } from "@/types";
import { adminService } from "@/lib/adminService";
import { useNotification } from "@/contexts/NotificationContext";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface UserListProps {
  onEditUser: (user: UserWithRoles) => void;
  onDeleteUser?: (user: UserWithRoles) => void;
}

export default function UserList({ onEditUser, onDeleteUser }: UserListProps) {
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [itemsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    user: UserWithRoles | null;
  }>({
    isOpen: false,
    user: null,
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getUsers(
        currentPage,
        itemsPerPage,
        searchTerm
      );
      console.log("Full response:", response);
      if (response.success && response.data) {
        console.log("Response.data:", response.data);
        console.log("Response.data.data:", response.data.data);
        console.log("Response.data.users:", (response.data as any).users);

        // Try different possible structures
        const users =
          response.data.data?.users || (response.data as any).users || [];
        const total =
          response.data.data?.total || (response.data as any).total || 0;

        setUsers(users);
        setTotalUsers(total);
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al cargar usuarios";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (user: UserWithRoles) => {
    setDeleteDialog({ isOpen: true, user });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.user) return;

    try {
      await adminService.deleteUser(deleteDialog.user.id);
      showSuccess("Usuario eliminado exitosamente");
      loadUsers();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al eliminar usuario";
      showError(errorMessage);
    } finally {
      setDeleteDialog({ isOpen: false, user: null });
    }
  };

  const cancelDelete = () => {
    setDeleteDialog({ isOpen: false, user: null });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleNames = (user: UserWithRoles) => {
    if (!user.roles || user.roles.length === 0) {
      return "Sin roles";
    }

    return user.roles.map((role) => role.name).join(", ");
  };

  const getRoleDetails = (user: UserWithRoles) => {
    if (!user.roles || user.roles.length === 0) {
      return null;
    }

    return user.roles.map((role) => ({
      name: role.name,
      permissions: role.permissions.map((p) => p.name).join(", "),
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Usuarios ({totalUsers})
          </h3>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-4 sm:mt-0">
            <div className="flex">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-6">
          <LoadingSpinner size="lg" text="Cargando usuarios..." />
        </div>
      )}

      {/* Users Table */}
      {!isLoading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RUT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.rut}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      {getRoleNames(user)}
                      {getRoleDetails(user) && (
                        <div className="text-xs text-gray-500">
                          {getRoleDetails(user)?.map((roleDetail, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-1"
                            >
                              <span className="font-medium">
                                {roleDetail.name}:
                              </span>
                              <span>
                                {roleDetail.permissions || "Sin permisos"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEditUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <div className="p-6 text-center">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay usuarios
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "No se encontraron usuarios con ese término de búsqueda."
                : "Comienza creando un nuevo usuario."}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
              {Math.min(currentPage * itemsPerPage, totalUsers)} de {totalUsers}{" "}
              usuarios
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que quieres eliminar al usuario ${deleteDialog.user?.firstName} ${deleteDialog.user?.lastName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />
    </div>
  );
}
