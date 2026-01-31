export const API_BASE = import.meta.env.VITE_BACKEND_BASE_URI;

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE}/api/health`,
  AUTH: {
    LOGIN: `${API_BASE}/api/auth/login`,
    REFRESH: `${API_BASE}/api/auth/refresh`,
    LOGOUT: `${API_BASE}/api/auth/logout`,
    VERIFY_BRANCH: `${API_BASE}/api/auth/branches/verify`,
    REGISTER: `${API_BASE}/api/auth/register`,
    FORGOT_PASSWORD: `${API_BASE}/api/auth/forgot-password`,
    VERIFY_OTP: `${API_BASE}/api/auth/verify-otp`,
    RESET_PASSWORD: `${API_BASE}/api/auth/reset-password`,
    UPDATE_PROFILE: `${API_BASE}/api/auth/updateprofile`,
  },
  SALES: {
    BASE: `${API_BASE}/api/staff`,
    SERVICES: `${API_BASE}/api/staff/services`,
    REFUND: `${API_BASE}/api/staff/refund`,
  },
  BRANCH_ACCOUNTS: `${API_BASE}/api/staff/accounts/my-branch`,
  CLOSE_ACCOUNT: (id) => `${API_BASE}/api/staff/accounts/${id}/close`,

  BRANCH_INVENTORY: `${API_BASE}/api/staff/inventory/my-branch`,
  CUSTOMERS: `${API_BASE}/api/staff/customers`,
  INVESTORS: `${API_BASE}/api/staff/customers/investors`,
  CUSTOMER_SEARCH: `${API_BASE}/api/staff/customers/search`,
  BRANCH: `${API_BASE}/api/staff/Branch`,
  MY_BRANCH_PRINT_INFO: `${API_BASE}/api/staff/my-branch-print-info`,
  EMPLOYEES: (code) => `${API_BASE}/api/staff/employees/${code}`,
  EXPENSES: `${API_BASE}/api/staff/expenses`,
  EMPLOYEE_EXPENSE_SUMMARY: (name) =>
    `${API_BASE}/api/staff/expenses/employee/${name}/summary`,
  COMPLAINTS: {
    BASE: `${API_BASE}/api/complaints`,
    BY_ID: (id) => `${API_BASE}/api/complaints/${id}`,
    HISTORY: `${API_BASE}/api/complaints/history`,
    UPDATE_STATUS: (id) => `${API_BASE}/api/complaints/${id}/status`,
  },
};
