import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import { useAuth } from "./AuthContext";
import { getCache, setCache, CACHE_KEYS, TTL } from "../utils/cacheUtils";

const CustomerContext = createContext();

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  const { accessToken } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(
    async (force = false) => {
      if (!accessToken) return;

      try {
        setLoading(true);
        setError(null);

        // Serve from cache while fetching fresh data
        if (!force) {
          const cached = await getCache(CACHE_KEYS.CUSTOMERS);
          if (cached) {
            setCustomers(cached);
          }
        }

        const res = await axios.get(API_ENDPOINTS.CUSTOMERS + "/my-branch", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.data.success) {
          setCustomers(res.data.data);
          await setCache(CACHE_KEYS.CUSTOMERS, res.data.data, TTL.SHORT);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
        setError(error.response?.data?.message || "Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const fetchInvestors = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(API_ENDPOINTS.INVESTORS + "/my-branch", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.data.success) {
        setInvestors(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching investors:", error);
      setError(error.response?.data?.message || "Failed to fetch investors");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const searchCustomerByPhone = useCallback(
    async (phone) => {
      if (!accessToken || !phone) return null;

      try {
        const res = await axios.get(
          `${API_ENDPOINTS.CUSTOMER_SEARCH}/${phone}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (res.data.success) {
          return res.data.data;
        }
      } catch (error) {
        console.error("Error searching customer:", error);
        return null;
      }
    },
    [accessToken],
  );

  const upsertCustomer = useCallback(
    async (customerData) => {
      if (!accessToken) return null;

      try {
        setLoading(true);
        const res = await axios.post(API_ENDPOINTS.CUSTOMERS, customerData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.data.success) {
          await fetchCustomers(); // Refresh list
          await fetchInvestors(); // Refresh investors list too
          return res.data.data;
        }
      } catch (error) {
        console.error("Error upserting customer:", error);
        setError(error.response?.data?.message || "Failed to save customer");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, fetchCustomers, fetchInvestors],
  );

  useEffect(() => {
    if (accessToken) {
      fetchCustomers();
      fetchInvestors();
    }
  }, [accessToken, fetchCustomers, fetchInvestors]);

  const settleCustomerCredit = useCallback(
    async (customerId, settlementData) => {
      if (!accessToken) return;

      try {
        setLoading(true);
        const res = await axios.post(
          `${API_ENDPOINTS.CUSTOMERS}/${customerId}/settle-credit`,
          settlementData,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (res.data.success) {
          // Refresh customer list to reflect updated credits
          await fetchCustomers();
          return { success: true, data: res.data.data };
        }
        return { success: false, message: res.data.message };
      } catch (err) {
        console.error("Error settling customer credit:", err);
        const message =
          err.response?.data?.message || "Failed to settle credit";
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [accessToken, fetchCustomers],
  );

  const fetchCustomerPaymentHistory = useCallback(
    async (customerId) => {
      if (!accessToken || !customerId) return null;

      try {
        const res = await axios.get(
          `${API_ENDPOINTS.CUSTOMERS}/${customerId}/payment-history`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (res.data.success) {
          return res.data.data;
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
        return null;
      }
    },
    [accessToken],
  );

  const checkMaturity = useCallback(async () => {
    if (!accessToken) return;

    try {
      const res = await axios.post(
        `${API_ENDPOINTS.CUSTOMERS}/check-maturity`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (res.data.success) {
        await fetchInvestors(); // Refresh investors after check
        return res.data;
      }
    } catch (error) {
      console.error("Error checking maturity:", error);
    }
  }, [accessToken, fetchInvestors]);

  const closeInvestment = useCallback(
    async (customerId, investmentId) => {
      if (!accessToken) return;

      try {
        const res = await axios.post(
          `${API_ENDPOINTS.CUSTOMERS}/${customerId}/investment/${investmentId}/close`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (res.data.success) {
          await fetchInvestors();
          return { success: true, message: res.data.message };
        }
      } catch (error) {
        console.error("Error closing investment:", error);
        return {
          success: false,
          message:
            error.response?.data?.message || "Failed to close investment",
        };
      }
    },
    [accessToken, fetchInvestors],
  );

  const value = {
    customers,
    investors,
    loading,
    error,
    fetchCustomers,
    fetchInvestors,
    searchCustomerByPhone,
    upsertCustomer,
    settleCustomerCredit,
    fetchCustomerPaymentHistory,
    checkMaturity,
    closeInvestment,
    deleteInvestment: useCallback(
      async (customerId, investmentId) => {
        if (!accessToken) return;

        try {
          const res = await axios.delete(
            `${API_ENDPOINTS.CUSTOMERS}/${customerId}/investment/${investmentId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          );
          if (res.data.success) {
            await fetchInvestors();
            return { success: true, message: res.data.message };
          }
        } catch (error) {
          console.error("Error deleting investment:", error);
          return {
            success: false,
            message:
              error.response?.data?.message || "Failed to delete investment",
          };
        }
      },
      [accessToken, fetchInvestors],
    ),
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};
