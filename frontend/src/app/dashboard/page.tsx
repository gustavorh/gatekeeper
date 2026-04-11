"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { apiClient } from "@/lib/api";
import { useState, useEffect } from "react";

// Analytics data types
interface WorkHoursSummary {
  totalWorkedHours: number;
  totalLunchTime: number;
  totalBreakTime: number;
  daysWorked: number;
  averageWorkedHoursPerDay: number;
  averageLunchTimePerDay: number;
  period: "week" | "month";
  startDate: string;
  endDate: string;
  dailyBreakdown: DailyWorkHours[];
}

interface DailyWorkHours {
  date: string;
  workedHours: number;
  lunchTime: number;
  breakTime: number;
  clockInTime: string;
  clockOutTime?: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockOutLoading, setClockOutLoading] = useState(false);
  const [clockInError, setClockInError] = useState<string | null>(null);
  const [clockOutError, setClockOutError] = useState<string | null>(null);

  // Button states
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnLunch, setIsOnLunch] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [loadingShift, setLoadingShift] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Analytics states
  const [weeklyAnalytics, setWeeklyAnalytics] =
    useState<WorkHoursSummary | null>(null);
  const [monthlyAnalytics, setMonthlyAnalytics] =
    useState<WorkHoursSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Fetch current shift status on component mount
  useEffect(() => {
    const fetchCurrentShift = async () => {
      try {
        setLoadingShift(true);
        const response = await apiClient.get("/shifts/current");
        const shiftData = response.data;

        if (
          shiftData &&
          typeof shiftData === "object" &&
          "status" in shiftData
        ) {
          setCurrentShift(shiftData);
          setIsClockedIn(
            shiftData.status === "active" || shiftData.status === "on_lunch"
          );
          setIsOnLunch(shiftData.status === "on_lunch");
        } else {
          // No active shift found
          setIsClockedIn(false);
          setIsOnLunch(false);
          setCurrentShift(null);
        }
      } catch (error) {
        console.error("Error fetching current shift:", error);
        // Default to not clocked in if there's an error
        setIsClockedIn(false);
        setIsOnLunch(false);
        setCurrentShift(null);
      } finally {
        setLoadingShift(false);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        setLoadingActivities(true);
        const response = await apiClient.get("/shifts/history");
        console.log("Full API response:", response.data);
        const responseData = response.data as any;
        const shifts = responseData?.shifts || [];
        console.log("Extracted shifts:", shifts);
        console.log("Shifts array length:", shifts.length);

        if (Array.isArray(shifts) && shifts.length > 0) {
          console.log("Fetched shifts:", shifts);
          // Sort by createdAt in descending order (most recent first)
          const sortedShifts = shifts.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          // Get only the latest shift
          const latestShift = sortedShifts[0];
          console.log("Latest shift to display:", latestShift);
          setRecentActivities([latestShift]);
        } else {
          console.log(
            "No shifts found or shifts is not an array:",
            typeof shifts
          );
          setRecentActivities([]);
        }
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        setRecentActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true);

        // Fetch weekly analytics
        const weeklyResponse = await apiClient.get(
          "/analytics/work-hours/current-week"
        );
        setWeeklyAnalytics(weeklyResponse.data as WorkHoursSummary);

        // Fetch monthly analytics
        const monthlyResponse = await apiClient.get(
          "/analytics/work-hours/current-month"
        );
        setMonthlyAnalytics(monthlyResponse.data as WorkHoursSummary);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        showError("Error al cargar estadísticas");
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchCurrentShift();
    fetchRecentActivities();
    fetchAnalytics();
  }, []);

  // Helper function to get shift display information
  const getShiftDisplayInfo = (shift: any) => {
    const status = shift.status;
    const clockInTime = shift.clockInTime;
    const clockOutTime = shift.clockOutTime;
    const createdAt = shift.createdAt;

    let statusText = "";
    let statusColor = "";
    let icon = "";
    let timeToShow = "";

    if (status === "active" || status === "on_lunch") {
      statusText = status === "active" ? "Turno Activo" : "En Almuerzo";
      statusColor = status === "active" ? "bg-green-100" : "bg-orange-100";
      icon = status === "active" ? "🟢" : "🍽️";
      timeToShow = clockInTime || createdAt;
    } else if (status === "completed") {
      statusText = "Turno Completado";
      statusColor = "bg-gray-100";
      icon = "✅";
      timeToShow = clockOutTime || createdAt;
    } else {
      // Default case for any other status
      statusText = `Turno ${status || "Desconocido"}`;
      statusColor = "bg-blue-100";
      icon = "📝";
      timeToShow = createdAt;
    }

    return {
      statusText,
      statusColor,
      icon,
      time: timeToShow,
      clockInTime: clockInTime,
      clockOutTime: clockOutTime,
      createdAt: createdAt,
    };
  };

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

  // Helper function to format delay time in "00h 00m 00s" format
  const formatDelayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Helper function to calculate average clock-in time
  const getAverageClockInTime = (analytics: WorkHoursSummary | null) => {
    if (
      !analytics ||
      !analytics.dailyBreakdown ||
      analytics.dailyBreakdown.length === 0
    ) {
      return "--:--";
    }

    const clockInTimes = analytics.dailyBreakdown
      .filter((day) => day.clockInTime)
      .map(
        (day) =>
          new Date(day.clockInTime).getHours() * 60 +
          new Date(day.clockInTime).getMinutes()
      );

    if (clockInTimes.length === 0) {
      return "--:--";
    }

    const averageMinutes =
      clockInTimes.reduce((sum, minutes) => sum + minutes, 0) /
      clockInTimes.length;
    const hours = Math.floor(averageMinutes / 60);
    const minutes = Math.floor(averageMinutes % 60);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const refreshActivities = async () => {
    try {
      const response = await apiClient.get("/shifts/history");
      const responseData = response.data as any;
      const shifts = responseData?.shifts || [];
      if (Array.isArray(shifts) && shifts.length > 0) {
        // Sort by createdAt in descending order (most recent first)
        const sortedShifts = shifts.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        // Get only the latest shift
        const latestShift = sortedShifts[0];
        setRecentActivities([latestShift]);
      } else {
        setRecentActivities([]);
      }
    } catch (error) {
      console.error("Error refreshing activities:", error);
    }
  };

  const refreshAnalytics = async () => {
    try {
      setLoadingAnalytics(true);

      // Fetch weekly analytics
      const weeklyResponse = await apiClient.get(
        "/analytics/work-hours/current-week"
      );
      setWeeklyAnalytics(weeklyResponse.data as WorkHoursSummary);

      // Fetch monthly analytics
      const monthlyResponse = await apiClient.get(
        "/analytics/work-hours/current-month"
      );
      setMonthlyAnalytics(monthlyResponse.data as WorkHoursSummary);
    } catch (error) {
      console.error("Error refreshing analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleClockIn = async () => {
    setClockInLoading(true);
    setClockInError(null);

    try {
      const response = await apiClient.post("/shifts/clock-in", {});
      setIsClockedIn(true);
      setCurrentShift(response.data);
      showSuccess("Entrada registrada exitosamente");
      await refreshActivities(); // Refresh activities after successful clock in
      await refreshAnalytics(); // Refresh analytics after successful clock in
    } catch (error) {
      setClockInError(
        error instanceof Error ? error.message : "Error al registrar entrada"
      );
      showError("Error al registrar entrada");
    } finally {
      setClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockOutLoading(true);
    setClockOutError(null);

    try {
      const response = await apiClient.post("/shifts/clock-out", {});
      setIsClockedIn(false);
      setIsOnLunch(false);
      setCurrentShift(null);
      showSuccess("Salida registrada exitosamente");
      await refreshActivities(); // Refresh activities after successful clock out
      await refreshAnalytics(); // Refresh analytics after successful clock out
    } catch (error) {
      setClockOutError(
        error instanceof Error ? error.message : "Error al registrar salida"
      );
      showError("Error al registrar salida");
    } finally {
      setClockOutLoading(false);
    }
  };

  const handleStartLunch = async () => {
    try {
      const response = await apiClient.post("/shifts/start-lunch", {});
      setIsOnLunch(true);
      setCurrentShift(response.data);
      showSuccess("Almuerzo iniciado exitosamente");
      await refreshActivities(); // Refresh activities after successful lunch start
      await refreshAnalytics(); // Refresh analytics after successful lunch start
    } catch (error) {
      showError("Error al iniciar almuerzo");
    }
  };

  const handleResumeShift = async () => {
    try {
      const response = await apiClient.post("/shifts/resume-shift", {});
      setIsOnLunch(false);
      setCurrentShift(response.data);
      showSuccess("Turno reanudado exitosamente");
      await refreshActivities(); // Refresh activities after successful resume
      await refreshAnalytics(); // Refresh analytics after successful resume
    } catch (error) {
      showError("Error al reanudar turno");
    }
  };

  // Determine button states
  const getButtonState = (
    buttonType: "clockIn" | "clockOut" | "lunch" | "resume"
  ) => {
    // If still loading shift status, disable all buttons
    if (loadingShift) {
      return {
        enabled: false,
        loading: false,
        className:
          "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed",
      };
    }

    switch (buttonType) {
      case "clockIn":
        return {
          enabled: !isClockedIn && !clockInLoading,
          loading: clockInLoading,
          className:
            !isClockedIn && !clockInLoading
              ? "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed",
        };
      case "clockOut":
        return {
          enabled: isClockedIn && !isOnLunch && !clockOutLoading,
          loading: clockOutLoading,
          className:
            isClockedIn && !isOnLunch && !clockOutLoading
              ? "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed",
        };
      case "lunch":
        return {
          enabled: isClockedIn && !isOnLunch,
          loading: false,
          className:
            isClockedIn && !isOnLunch
              ? "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed",
        };
      case "resume":
        return {
          enabled: isClockedIn && isOnLunch,
          loading: false,
          className:
            isClockedIn && isOnLunch
              ? "border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed",
        };
      default:
        return { enabled: false, loading: false, className: "" };
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            <div className="flex-shrink-0">
              <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Welcome Section */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Gestión de Horarios
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Administra tu jornada laboral y descansos
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <button
                        onClick={handleClockIn}
                        disabled={!getButtonState("clockIn").enabled}
                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                          getButtonState("clockIn").className
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white bg-opacity-70 flex items-center justify-center">
                            <svg
                              className="w-6 h-6"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="font-semibold text-sm">
                            {getButtonState("clockIn").loading
                              ? "Registrando..."
                              : "Entrada"}
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            Comienza tu jornada
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleClockOut}
                        disabled={!getButtonState("clockOut").enabled}
                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                          getButtonState("clockOut").className
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white bg-opacity-70 flex items-center justify-center">
                            <svg
                              className="w-6 h-6"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="font-semibold text-sm">
                            {getButtonState("clockOut").loading
                              ? "Registrando..."
                              : "Salida"}
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            Termina tu jornada
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleStartLunch}
                        disabled={!getButtonState("lunch").enabled}
                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                          getButtonState("lunch").className
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white bg-opacity-70 flex items-center justify-center">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                              />
                            </svg>
                          </div>
                          <div className="font-semibold text-sm">
                            Iniciar Almuerzo
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            Tómate un descanso
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleResumeShift}
                        disabled={!getButtonState("resume").enabled}
                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                          getButtonState("resume").className
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white bg-opacity-70 flex items-center justify-center">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-7 4h6m3-11V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-1"
                              />
                            </svg>
                          </div>
                          <div className="font-semibold text-sm">
                            Reanudar Turno
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            Vuelve al trabajo
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-gray-900">
                        Actividad Reciente
                      </h2>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-gray-500">En Vivo</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {loadingActivities ? (
                        <p className="text-gray-500 text-center py-8">
                          Cargando actividad...
                        </p>
                      ) : recentActivities.length === 0 ? (
                        <div className="text-gray-500 text-center py-8">
                          <p>No hay actividad reciente para mostrar</p>
                          <p className="text-xs mt-2">
                            Debug: recentActivities.length ={" "}
                            {recentActivities.length}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentActivities.map((shift, shiftIndex) => {
                            console.log(
                              `Processing shift ${shiftIndex}:`,
                              shift
                            );
                            const shiftInfo = getShiftDisplayInfo(shift);
                            console.log(`Shift ${shiftIndex} info:`, shiftInfo);

                            return (
                              <div
                                key={`shift-${shiftIndex}`}
                                className="flex items-center justify-between p-4 rounded-lg bg-white shadow-sm border border-gray-100"
                              >
                                <div className="flex items-center">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${shiftInfo.statusColor}`}
                                  >
                                    <span className="text-lg">
                                      {shiftInfo.icon}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {shiftInfo.statusText}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(shiftInfo.time)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatTime(shiftInfo.time)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatTime(shiftInfo.time)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(shiftInfo.time)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-gray-900">
                        Estadísticas
                      </h2>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-500">Resumen</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              Horas esta semana
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Tiempo total trabajado
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-blue-600">
                              {loadingAnalytics
                                ? "Cargando..."
                                : `${
                                    weeklyAnalytics?.totalWorkedHours?.toFixed(
                                      1
                                    ) || 0.0
                                  }`}
                            </span>
                            <div className="text-xs text-gray-500">hrs</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              Turnos este mes
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Días trabajados
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-gray-900">
                              {loadingAnalytics
                                ? "Cargando..."
                                : `${monthlyAnalytics?.daysWorked || 0}`}
                            </span>
                            <div className="text-xs text-gray-500">días</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              Promedio de entrada
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Hora típica de inicio
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-green-600">
                              {loadingAnalytics
                                ? "Cargando..."
                                : getAverageClockInTime(weeklyAnalytics)}
                            </span>
                            <div className="text-xs text-gray-500">AM</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              Tiempo de descanso
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Descansos acumulados
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-red-600">
                              {loadingAnalytics
                                ? "Cargando..."
                                : `${
                                    weeklyAnalytics?.totalBreakTime?.toFixed(
                                      1
                                    ) || 0.0
                                  }`}
                            </span>
                            <div className="text-xs text-gray-500">hrs</div>
                          </div>
                        </div>
                      </div>
                    </div>
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
