"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({
  children,
  roles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Check role-based access if roles are specified
      if (roles && roles.length > 0) {
        const userRoles = user?.roles?.map((role) => role.name) || [];
        const hasRequiredRole = roles.some((role) => userRoles.includes(role));

        if (!hasRequiredRole) {
          router.push("/dashboard");
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, user, roles, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  // Check role-based access if roles are specified
  if (roles && roles.length > 0) {
    const userRoles = user?.roles?.map((role) => role.name) || [];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return null; // Will redirect to dashboard
    }
  }

  return <>{children}</>;
}
