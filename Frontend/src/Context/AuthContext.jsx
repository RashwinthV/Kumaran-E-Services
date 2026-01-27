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
import {
  clearAllCache,
  getCache,
  setCache,
  removeCache,
} from "../utils/cacheUtils";
import CryptoJS from "crypto-js";

const SECRET_KEY = `${import.meta.env.VITE_ENCRYPTION_SECRET_KEY}`;
const AUTH_TTL = 365 * 24 * 60 * 60 * 1000; // 1 year

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

  // Helper for encrypted cache
  const setEncryptedCache = useCallback(async (key, data) => {
    try {
      const stringifiedData = JSON.stringify(data);
      const encryptedData = CryptoJS.AES.encrypt(
        stringifiedData,
        SECRET_KEY,
      ).toString();
      await setCache(key, encryptedData, AUTH_TTL);
    } catch (e) {
      console.error("Encryption cache error:", e);
    }
  }, []);

  const getEncryptedCache = useCallback(async (key) => {
    try {
      const encryptedData = await getCache(key);
      if (!encryptedData) return null;
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (e) {
      console.error("Decryption cache error:", e);
      return null;
    }
  }, []);

  // Clear auth state
  const clearAuthState = useCallback(async () => {
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
    await removeCache("auth_user");
    await removeCache("auth_token");
    await clearAllCache();
  }, []);

  // Refresh access token using HTTP-only cookie
  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.AUTH.REFRESH,
        { portal: "frontend" },
        {
          skipAuthRefresh: true, // Custom flag to skip interceptor
        },
      );

      if (response.data.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
        await setEncryptedCache("auth_token", response.data.accessToken);
        await setEncryptedCache("auth_user", response.data.user);
        return response.data.accessToken;
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      // Only clear auth state if it's a 401/403 or specific auth error
      // If it's a network error (no response), keep the current local state
      if (error.response?.status === 401 || error.response?.status === 403) {
        await clearAuthState();
      }
      throw error;
    }
  }, [clearAuthState, setEncryptedCache]);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First, try to load from cache
        const cachedToken = await getEncryptedCache("auth_token");
        const cachedUser = await getEncryptedCache("auth_user");

        if (cachedToken && cachedUser) {
          setAccessToken(cachedToken);
          setUser(cachedUser);
          setIsAuthenticated(true);
        }

        // Then, try to refresh
        await refreshAccessToken();
      } catch (error) {
        // Error handled in refreshAccessToken
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshAccessToken, getEncryptedCache]);

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
      (error) => Promise.reject(error),
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
      },
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
        { skipAuthRefresh: true },
      );

      if (response.data.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        setIsAuthenticated(true);
        await setEncryptedCache("auth_token", response.data.accessToken);
        await setEncryptedCache("auth_user", response.data.user);
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
        await setEncryptedCache("auth_token", response.data.accessToken);
        await setEncryptedCache("auth_user", response.data.user);
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
          },
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthState();
    }
  };

  // Update profile function (email and password)
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        profileData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.data.success) {
        if (response.data.accessToken) {
          setAccessToken(response.data.accessToken);
          await setEncryptedCache("auth_token", response.data.accessToken);
        }
        if (response.data.user) {
          setUser(response.data.user);
          await setEncryptedCache("auth_user", response.data.user);
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
    updateProfile,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
