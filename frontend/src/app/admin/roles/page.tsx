"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function AdminRolesPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

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
                  <h1 className="text-3xl font-bold text-gray-900">
                    Gestión de Roles
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Administra roles y permisos del sistema
                  </p>
                </div>

                {/* Placeholder Content */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Gestión de Roles
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Esta funcionalidad estará disponible próximamente.
                    </p>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">
                          Funcionalidades Planificadas:
                        </h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Lista de roles con filtros</li>
                          <li>• Crear, editar y eliminar roles</li>
                          <li>• Asignar permisos a roles</li>
                          <li>• Gestionar jerarquías de roles</li>
                          <li>• Auditoría de cambios</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}
