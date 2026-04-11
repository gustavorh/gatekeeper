"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, AuthResponse, LoginCredentials, RegisterData } from "@/types";
import { apiClient } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (token && !isTokenExpired(token)) {
          const response = await apiClient.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data as User);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }
        } else if (token && isTokenExpired(token)) {
          // Token is expired, clear it
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await apiClient.login(credentials);

      if (response.success && response.data) {
        // The backend wraps the AuthResponse in response.data
        const authData = response.data as AuthResponse;

        // Store tokens
        localStorage.setItem("accessToken", authData.token);
        // Note: refreshToken might not be available in all responses
        if (authData.refreshToken) {
          localStorage.setItem("refreshToken", authData.refreshToken);
        }

        // Set user
        setUser(authData.user);
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await apiClient.register(data);

      if (response.success && response.data) {
        // The backend wraps the AuthResponse in response.data
        const authData = response.data as AuthResponse;

        // Store tokens
        localStorage.setItem("accessToken", authData.token);
        // Note: refreshToken might not be available in all responses
        if (authData.refreshToken) {
          localStorage.setItem("refreshToken", authData.refreshToken);
        }

        // Set user
        setUser(authData.user);
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear local state and tokens
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
