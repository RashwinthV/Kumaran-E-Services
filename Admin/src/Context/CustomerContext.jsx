import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import { API_ENDPOINTS } from "../config/api";

const CustomerContext = createContext();

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URI}/admin`;
  const { accessToken } = useAuth();
  const [investors, setInvestors] = useState([]);

  // Fetch all customers (which includes investors)
  const fetchCustomers = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${baseURL}/customers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        setCustomers(response.data.customers);
      } else {
        setError(response.data.message || "Failed to fetch customers");
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      // Fallback for demo if API fails? No, better to show error.
      // But for development, if no endpoint exists, we might see 404.
      // Assuming endpoint exists or will exist.
      // Using generic message if error object structure varies
      setError(err.response?.data?.message || "Failed to connect to server");
      // If we want to support mock data on failure for dev:
      // setCustomers(MOCK_CUSTOMERS);
    } finally {
      setLoading(false);
    }
  }, [accessToken, baseURL]);

  const fetchInvestors = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${baseURL}/investors`, {
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

  const upsertCustomer = async (data) => {
    try {
      setLoading(true);
      let response;
      if (data.id || data._id) {
        // Update
        const id = data.id || data._id;
        response = await axios.put(`${baseURL}/customers/${id}`, data, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } else {
        // Create
        response = await axios.post(`${baseURL}/customers`, data, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }

      if (response.data.success) {
        toast.success(
          data.id || data._id
            ? "Customer updated successfully"
            : "Customer created successfully",
        );
        fetchCustomers(); // Refresh list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error saving customer:", err);
      toast.error(err.response?.data?.message || "Failed to save customer");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const settleCustomerCredit = async (customerId, settlementData) => {
    try {
      const response = await axios.post(
        `${baseURL}/customers/${customerId}/settle`,
        settlementData,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (response.data.success) {
        toast.success("Credit settled successfully");
        fetchCustomers();
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      console.error("Error settling credit:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Failed to settle credit",
      };
    }
  };

  // Investor specific actions
  const checkMaturity = useCallback(() => {
    // This might trigger a calculation or check on the backend?
    // Or just be a client side helper?
    // For now, doing nothing or refreshing data
    // fetchCustomers();
  }, []);

  const closeInvestment = async (customerId, investmentId) => {
    try {
      // Assuming endpoint
      const response = await axios.post(
        `${baseURL}/investors/${customerId}/close/${investmentId}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (response.data.success) {
        fetchCustomers();
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const deleteInvestment = async (customerId, investmentId) => {
    try {
      const response = await axios.delete(
        `${baseURL}/investors/${customerId}/investment/${investmentId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (response.data.success) {
        fetchCustomers();
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const processPrincipalTransaction = async (data) => {
    // data contains type, amount, etc.
    try {
      const response = await axios.post(
        `${baseURL}/investors/transaction`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (response.data.success) {
        fetchCustomers();
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const fetchCustomerPaymentHistory = async (customerId) => {
    // Stub
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        investors,
        loading,
        error,
        fetchCustomers,
        upsertCustomer,
        settleCustomerCredit,
        checkMaturity,
        closeInvestment,
        fetchInvestors,
        deleteInvestment,
        processPrincipalTransaction,
        fetchCustomerPaymentHistory,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};
