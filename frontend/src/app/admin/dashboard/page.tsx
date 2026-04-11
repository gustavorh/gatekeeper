"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { apiClient } from "@/lib/api";
import { useState, useEffect } from "react";

// Admin dashboard data types
interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalShifts: number;
  activeShifts: number;
  totalRoles: number;
  totalPermissions: number;
}

interface RecentActivity {
  id: string;
  type:
    | "user_created"
    | "user_updated"
    | "shift_created"
    | "shift_completed"
    | "role_created"
    | "role_updated";
  description: string;
  userId?: string;
  userName?: string;
  timestamp: string;
}

interface AdminDashboardData {
  stats: SystemStats;
  recentActivities: RecentActivity[];
  topUsers: Array<{
    id: string;
    name: string;
    totalShifts: number;
    totalHours: number;
  }>;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  const isAdmin = user?.roles?.some((role) => role.name === "admin") || false;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch admin dashboard data
        const response = await apiClient.get("/admin/dashboard");

        if (response.success && response.data) {
          // The API response has nested data structure
          const responseData = response.data as any;
          const dashboardData = responseData.data;
          if (dashboardData && dashboardData.success) {
            setDashboardData(dashboardData.data as AdminDashboardData);
          } else {
            showError("Error al cargar datos del dashboard");
          }
        } else {
          showError("Error al cargar datos del dashboard");
        }
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        showError("Error al cargar datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin, showError]);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "--:--";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return "--/--/----";
    const date = new Date(timestamp);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_created":
        return "👤";
      case "user_updated":
        return "✏️";
      case "shift_created":
        return "⏰";
      case "shift_completed":
        return "✅";
      case "role_created":
        return "🔑";
      case "role_updated":
        return "🔧";
      default:
        return "📝";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "user_created":
        return "bg-green-100 text-green-800";
      case "user_updated":
        return "bg-blue-100 text-blue-800";
      case "shift_created":
        return "bg-yellow-100 text-yellow-800";
      case "shift_completed":
        return "bg-purple-100 text-purple-800";
      case "role_created":
        return "bg-indigo-100 text-indigo-800";
      case "role_updated":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
                  <h1 className="text-3xl font-bold text-gray-900">
                    Panel de Administración
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Gestión y monitoreo del sistema GateKeeper
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Cargando datos...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* System Statistics */}
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">
                              Estadísticas del Sistema
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                              Resumen general de la plataforma
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  Usuarios Totales
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  Registrados en el sistema
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-blue-600">
                                  {dashboardData?.stats.totalUsers || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  Usuarios Activos
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  Con sesiones recientes
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-green-600">
                                  {dashboardData?.stats.activeUsers || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  Turnos Totales
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  Registrados en el sistema
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-purple-600">
                                  {dashboardData?.stats.totalShifts || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  Turnos Activos
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  En curso actualmente
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-orange-600">
                                  {dashboardData?.stats.activeShifts || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Top Users */}
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-6">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-lg font-bold text-gray-900">
                            Usuarios Más Activos
                          </h2>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-500">
                              Este mes
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {dashboardData?.topUsers &&
                          dashboardData.topUsers.length > 0 ? (
                            dashboardData.topUsers.map((user, index) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100"
                              >
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-sm font-medium text-blue-600">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {user.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {user.totalShifts} turnos •{" "}
                                      {user.totalHours.toFixed(1)} horas
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.totalHours.toFixed(1)}h
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {user.totalShifts} turnos
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>No hay datos de usuarios disponibles</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-lg font-bold text-gray-900">
                            Actividad Reciente
                          </h2>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-500">
                              En Vivo
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {dashboardData?.recentActivities &&
                          dashboardData.recentActivities.length > 0 ? (
                            dashboardData.recentActivities.map((activity) => (
                              <div
                                key={activity.id}
                                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityColor(
                                    activity.type
                                  )}`}
                                >
                                  {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {activity.description}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatDate(activity.timestamp)} •{" "}
                                    {formatTime(activity.timestamp)}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>No hay actividad reciente</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                          Acciones Rápidas
                        </h2>

                        <div className="space-y-3">
                          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            Crear Usuario
                          </button>
                          <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                            Generar Reporte
                          </button>
                          <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                            Configurar Roles
                          </button>
                          <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors">
                            Ver Logs
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
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
