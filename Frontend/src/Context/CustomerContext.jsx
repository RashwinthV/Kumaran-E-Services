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
    [accessToken]
  );

  const searchCustomerByPhone = useCallback(
    async (phone) => {
      if (!accessToken || !phone) return null;

      try {
        const res = await axios.get(
          `${API_ENDPOINTS.CUSTOMER_SEARCH}/${phone}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (res.data.success) {
          return res.data.data;
        }
      } catch (error) {
        console.error("Error searching customer:", error);
        return null;
      }
    },
    [accessToken]
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
    [accessToken, fetchCustomers]
  );

  useEffect(() => {
    if (accessToken) {
      fetchCustomers();
    }
  }, [accessToken, fetchCustomers]);

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
          }
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
    [accessToken, fetchCustomers]
  );

  const fetchCustomerPaymentHistory = useCallback(
    async (customerId) => {
      if (!accessToken || !customerId) return null;

      try {
        const res = await axios.get(
          `${API_ENDPOINTS.CUSTOMERS}/${customerId}/payment-history`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (res.data.success) {
          return res.data.data;
        }
      } catch (error) {
        console.error("Error fetching payment history:", error);
        return null;
      }
    },
    [accessToken]
  );

  const value = {
    customers,
    loading,
    error,
    fetchCustomers,
    searchCustomerByPhone,
    upsertCustomer,
    settleCustomerCredit,
    fetchCustomerPaymentHistory,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};
