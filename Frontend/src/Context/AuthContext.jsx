import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

import { API_BASE, API_ENDPOINTS } from "../config/api.jsx";
import { clearAllCache } from "../utils/cacheUtils";

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

  // Configure axios to send cookies with requests
  axios.defaults.withCredentials = true;

  // Clear auth state
  const clearAuthState = useCallback(async () => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    await clearAllCache();
  }, []);

  // Refresh access token using HTTP-only cookie
  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.AUTH.REFRESH,
        {},
        {
          skipAuthRefresh: true, // Custom flag to skip interceptor
        }
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
      clearAuthState();
      throw error;
    }
  }, [clearAuthState]);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshAccessToken();
      } catch (error) {
        // Error handled in refreshAccessToken
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshAccessToken]);

  // Handle Authorization header
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

  // Axios interceptor to add token to requests as a backup/refinement
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // If for some reason the default header is missing, add it here
        // or if the request is specifically to our API and the token is available.
        // The default header should handle most cases, this is a fallback/refinement.
        const isApiRequest =
          config.url?.startsWith(API_BASE) ||
          config.url?.startsWith("/api") ||
          config.url?.startsWith("/admin") ||
          (API_BASE &&
            config.url?.includes(API_BASE.replace(/^https?:\/\//, "")));

        if (accessToken && isApiRequest && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (originalRequest && originalRequest.skipAuthRefresh) {
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
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshAccessToken]);

  // Login function
  const login = async (identifier, password, branchCode) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          identifier,
          password,
          branchCode,
          portal: "frontend",
        },
        { skipAuthRefresh: true }
      );

      if (response.data.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
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
      const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, userData, {
        skipAuthRefresh: true,
      });

      if (response.data.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
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
          API_ENDPOINTS.AUTH.LOGOUT,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            skipAuthRefresh: true,
          }
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthState();
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
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
