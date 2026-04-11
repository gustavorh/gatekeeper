"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function AdminReportsPage() {
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
                    Reportes y Análisis
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Genera reportes y análisis del sistema
                  </p>
                </div>

                {/* Placeholder Content */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Reportes y Análisis
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
                          <li>• Reportes de asistencia</li>
                          <li>• Análisis de productividad</li>
                          <li>• Estadísticas de usuarios</li>
                          <li>• Exportación de datos</li>
                          <li>• Gráficos y visualizaciones</li>
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
