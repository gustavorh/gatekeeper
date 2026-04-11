"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { Shift, ShiftHistoryResponse, ShiftFilters } from "@/types";
import { formatDate, formatTime, formatTimeOnly } from "@/lib/utils";

export default function TurnosPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalShifts, setTotalShifts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Omit<ShiftFilters, "page">>({
    startDate: "",
    endDate: "",
    status: "",
    limit: 10,
  });

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("limit", filters.limit.toString());
      params.append("offset", ((currentPage - 1) * filters.limit).toString());

      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }

      const response = await apiClient.get<ShiftHistoryResponse>(
        `/shifts/history?${params.toString()}`
      );

      if (response.success && response.data) {
        setShifts(response.data.shifts);
        setTotalShifts(response.data.total);
      } else {
        setError("Error al cargar los turnos");
      }
    } catch (err) {
      console.error("Error fetching shifts:", err);
      setError("Error al cargar los turnos");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleFilterChange = (
    key: keyof Omit<ShiftFilters, "page">,
    value: string | number
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "",
      limit: 10,
    });
    setCurrentPage(1);
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return "En curso";

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: "Pendiente",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      active: {
        label: "Activo",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      completed: {
        label: "Completado",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const totalPages = Math.ceil(totalShifts / filters.limit);
  const hasActiveFilters =
    filters.startDate || filters.endDate || filters.status;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex gap-8">
              <div className="flex-shrink-0">
                <Sidebar />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            <div className="flex-shrink-0">
              <Sidebar />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-xl shadow-lg">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Mis Turnos
                      </h1>
                      <p className="text-sm text-gray-600 mt-1">
                        Historial de tus registros de entrada y salida
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {totalShifts}
                      </div>
                      <div className="text-sm text-gray-500">turnos</div>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Range Filters */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desde
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                          handleFilterChange("startDate", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hasta
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                          handleFilterChange("endDate", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) =>
                          handleFilterChange("status", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Todos</option>
                        <option value="pending">Pendiente</option>
                        <option value="active">Activo</option>
                        <option value="completed">Completado</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Limpiar Filtros
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-400 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-red-800">{error}</span>
                    </div>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entrada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Salida
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duración
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {shifts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <svg
                                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <p className="text-lg font-medium">
                                {hasActiveFilters
                                  ? "No se encontraron turnos"
                                  : "No hay turnos registrados"}
                              </p>
                              <p className="text-sm">
                                {hasActiveFilters
                                  ? "No hay turnos que coincidan con los filtros aplicados."
                                  : "Aún no has registrado ningún turno de trabajo."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        shifts.map((shift) => (
                          <tr key={shift.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(shift.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatTimeOnly(shift.clockInTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {shift.clockOutTime
                                ? formatTimeOnly(shift.clockOutTime)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDuration(
                                shift.clockInTime,
                                shift.clockOutTime
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(shift.status)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Mostrando {(currentPage - 1) * filters.limit + 1} a{" "}
                        {Math.min(currentPage * filters.limit, totalShifts)} de{" "}
                        {totalShifts} resultados
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        <span className="px-3 py-2 text-sm text-gray-700">
                          Página {currentPage} de {totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
