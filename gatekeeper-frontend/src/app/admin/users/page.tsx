"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import UserList from "@/components/admin/UserList";
import UserForm from "@/components/admin/UserForm";
import { UserWithRoles } from "@/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | undefined>(
    undefined
  );

  const handleCreateUser = () => {
    setEditingUser(undefined);
    setShowForm(true);
  };

  const handleEditUser = (user: UserWithRoles) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = (user: UserWithRoles) => {
    // This is handled in the UserList component
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUser(undefined);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingUser(undefined);
  };

  return (
    <ProtectedRoute>
      <RoleProtectedRoute roles={["admin"]}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />

          <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <Sidebar />
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Gestión de Usuarios
                      </h1>
                      <p className="mt-2 text-sm text-gray-600">
                        Administra usuarios, roles y permisos del sistema
                      </p>
                    </div>
                    <button
                      onClick={handleCreateUser}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <svg
                        className="w-5 h-5 inline mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Nuevo Usuario
                    </button>
                  </div>
                </div>

                {/* Content */}
                {showForm ? (
                  <UserForm
                    user={editingUser}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                  />
                ) : (
                  <UserList
                    onEditUser={handleEditUser}
                    onDeleteUser={handleDeleteUser}
                  />
                )}
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}
