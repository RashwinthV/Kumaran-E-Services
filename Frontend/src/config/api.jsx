export const API_BASE = import.meta.env.VITE_BACKEND_BASE_URI;

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE}/api/health`,
  AUTH: {
    LOGIN: `${API_BASE}/api/auth/login`,
    REFRESH: `${API_BASE}/api/auth/refresh`,
    LOGOUT: `${API_BASE}/api/auth/logout`,
    VERIFY_BRANCH: `${API_BASE}/api/auth/branches/verify`,
    REGISTER: `${API_BASE}/api/auth/register`,
  },
  SALES: {
    BASE: `${API_BASE}/api/staff`,
    REFUND: `${API_BASE}/api/staff/refund`,
  },
  BRANCH_ACCOUNTS: `${API_BASE}/api/staff/accounts/my-branch`,
  CLOSE_ACCOUNT: (id) => `${API_BASE}/api/staff/accounts/${id}/close`,

  BRANCH_INVENTORY: `${API_BASE}/api/staff/inventory/my-branch`,
  CUSTOMERS: `${API_BASE}/api/staff/customers`,
  CUSTOMER_SEARCH: `${API_BASE}/api/staff/customers/search`,
  BRANCH: `${API_BASE}/api/staff/Branch`,
};
