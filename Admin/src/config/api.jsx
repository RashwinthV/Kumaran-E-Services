export const API_URL = import.meta.env.VITE_BACKEND_BASE_URI;

export const API_ENDPOINTS = {
  HEALTH: `${API_URL}/api/health`,
  AUTH: {
    LOGIN: `${API_URL}/api/auth/login`,
    REGISTER: `${API_URL}/api/auth/register`,
    FORGOT_PASSWORD: `${API_URL}/api/auth/forgot-password`,
    VERIFY_OTP: `${API_URL}/api/auth/verify-otp`,
    RESET_PASSWORD: `${API_URL}/api/auth/reset-password`,
  },
  BRANCH_ACCOUNTS: `${API_URL}/admin/accounts`,
  BRANCH_BY_ID_ACCOUNTS: (id) => `${API_URL}/admin/accounts/branch/${id}`,
  SALES: {
    BASE: `${API_URL}/api/staff`, // Using staff endpoint for creating sales
  },
};
