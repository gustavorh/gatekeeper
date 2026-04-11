"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { LoginCredentials } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState<LoginCredentials>({
    rut: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // RUT validation function
  const validateRut = (rut: string): boolean => {
    // Remove dots and dash, convert to uppercase
    const cleanRut = rut.replace(/[.-]/g, "").toUpperCase();

    // Check if it has the correct length (8-9 digits + verification digit)
    if (cleanRut.length < 8 || cleanRut.length > 9) {
      return false;
    }

    // Check if it contains only numbers and 'K'
    if (!/^[0-9]+K?$/.test(cleanRut)) {
      return false;
    }

    return true;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.rut) {
      newErrors.rut = "RUT is required";
    } else if (!validateRut(formData.rut)) {
      newErrors.rut =
        "Please enter a valid RUT format (e.g., 12345678-9 or 123456789)";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);
      showSuccess("¡Bienvenido de vuelta! Has iniciado sesión exitosamente.");
      router.push("/dashboard");
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error durante el inicio de sesión."
      );
    }
  };

  const handleInputChange =
    (field: keyof LoginCredentials) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GateKeeper</h1>
          <p className="text-gray-600 mt-2">Control de Acceso</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* RUT Input */}
          <div>
            <label
              htmlFor="rut"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              RUT
            </label>
            <input
              type="text"
              id="rut"
              value={formData.rut}
              onChange={handleInputChange("rut")}
              placeholder="12345678-9"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-gray-900 placeholder-gray-500"
              autoFocus
              disabled={isLoading}
            />
            {errors.rut && (
              <p className="mt-1 text-sm text-red-600">{errors.rut}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleInputChange("password")}
                placeholder="Ingresa tu contraseña"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors pr-12 text-gray-900 placeholder-gray-500"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L5.636 5.636m4.242 4.242L15.12 15.12m-4.242-4.242L5.636 5.636m0 0L3 3m2.636 2.636L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                Recordarme
              </label>
            </div>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          {/* Contact Support */}
          <div className="text-center text-sm text-gray-600">
            ¿No tienes una cuenta?{" "}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              Contactar Soporte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
