import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { clearAppCache } from "../utils/cacheUtils";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_URL = `${import.meta.env.VITE_BACKEND_BASE_URI}/api`;

  // Configure axios to send cookies with requests
  axios.defaults.withCredentials = true;

  // Clear auth state
  const clearAuthState = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Refresh access token using HTTP-only cookie
  const refreshAccessToken = useCallback(async () => {
    try {
      // No need to send refresh token in body - it's in HTTP-only cookie
      // Add flag to prevent this request from triggering the interceptor
      const response = await axios.post(
        `${API_URL}/auth/refresh`,
        { portal: "admin" },
        {
          skipAuthRefresh: true, // Custom flag to skip interceptor
        },
      );

      if (response.data.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return response.data.accessToken;
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearAuthState();
      throw error;
    }
  }, [API_URL, clearAuthState]);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("🔄 Attempting to restore session...");
        await refreshAccessToken();
        console.log("✅ Session restored successfully");
      } catch (error) {
        console.log("ℹ️ No valid session found");
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshAccessToken, clearAuthState]);

  // Axios interceptor to add token to requests
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const isBackendRequest = config.url?.includes(
          import.meta.env.VITE_BACKEND_BASE_URI,
        );
        if (accessToken && isBackendRequest) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Skip auto-refresh for requests with skipAuthRefresh flag
        if (originalRequest.skipAuthRefresh) {
          return Promise.reject(error);
        }

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, API_URL, refreshAccessToken]);

  // Login function
  const login = async (identifier, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        identifier,
        password,
        portal: "admin", // Specify this is the admin portal
      });

      if (response.data.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
        // Refresh token is automatically stored in HTTP-only cookie by server

        return { success: true };
      } else {
        return {
          success: false,
          message: response.data.message || "Login failed",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);

      if (response.data.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
        // Refresh token is automatically stored in HTTP-only cookie by server

        return { success: true };
      } else {
        return {
          success: false,
          message: response.data.message || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (accessToken) {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
      }
      // Cookie is cleared by server
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthState();
      clearAppCache(); // Clear application cache on logout
    }
  };

  // Update password function
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put(
        `${API_URL}/auth/updatepassword`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (response.data.success) {
        setAccessToken(response.data.accessToken);
        // New refresh token is automatically stored in HTTP-only cookie by server

        return { success: true, message: "Password updated successfully" };
      }
    } catch (error) {
      console.error("Update password error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update password",
      };
    }
  };

  // Update profile function (email and password)
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(
        `${API_URL}/auth/updateprofile`,
        profileData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.data.success) {
        if (response.data.accessToken) {
          setAccessToken(response.data.accessToken);
        }
        if (response.data.user) {
          setUser(response.data.user);
        }
        return {
          success: true,
          message: response.data.message || "Profile updated successfully",
        };
      }
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile",
      };
    }
  };

  const value = {
    user,
    accessToken,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updatePassword,
    updateProfile,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
