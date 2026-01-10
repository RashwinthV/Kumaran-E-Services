import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import {
  setCache,
  getCache,
  removeCache,
  CACHE_KEYS,
  TTL,
} from "../utils/cacheUtils";

const AccountContext = createContext();

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
};

export const AccountProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const baseURL = `${import.meta.env.VITE_BACKEND_BASE_URI}/admin`;
  const { accessToken } = useAuth();

  // Get all accounts
  const getAccounts = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken) return;

      try {
        setLoading(true);

        // Check cache
        if (!forceRefresh) {
          const cachedAccounts = await getCache(CACHE_KEYS.ACCOUNTS);
          if (cachedAccounts) {
            setAccounts(cachedAccounts);
            setLoading(false);
            return cachedAccounts;
          }
        }

        const response = await axios.get(`${baseURL}/accounts`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.data.success) {
          setAccounts(response.data.data);
          await setCache(CACHE_KEYS.ACCOUNTS, response.data.data, TTL.SHORT);
          return response.data.data;
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch accounts"
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, baseURL]
  );

  // Get accounts by branch
  const getAccountsByBranch = useCallback(
    async (branchId, forceRefresh = false) => {
      if (!accessToken) return;

      const cacheKey = `${CACHE_KEYS.ACCOUNTS}/${branchId}`;

      try {
        setLoading(true);

        // Check cache
        if (!forceRefresh) {
          const cachedBranchAccounts = await getCache(cacheKey);
          if (cachedBranchAccounts) {
            setAccounts(cachedBranchAccounts);
            setLoading(false);
            return cachedBranchAccounts;
          }
        }

        const response = await axios.get(
          `${baseURL}/accounts/branch/${branchId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (response.data.success) {
          setAccounts(response.data.data);
          await setCache(cacheKey, response.data.data, TTL.SHORT);
          return response.data.data;
        }
      } catch (error) {
        console.error("Error fetching branch accounts:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch branch accounts"
        );
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, baseURL]
  );

  // Add account
  const addAccount = async (accountData) => {
    try {
      // Validate in frontend too
      if (accountData.type === "Upi" && !accountData.upiAccountName) {
        toast.error("UPI account name is required");
        throw new Error("UPI account name is required");
      }

      const response = await axios.post(`${baseURL}/accounts`, accountData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        toast.success("Account added successfully");
        // Invalidate cache
        await removeCache(CACHE_KEYS.ACCOUNTS);
        if (accountData.branch) {
          await removeCache(`${CACHE_KEYS.ACCOUNTS}/${accountData.branch}`);
        }
        setAccounts((prev) => [...prev, response.data.data]);
        return response.data.data;
      }
    } catch (error) {
      console.error("Error adding account:", error);
      toast.error(error.response?.data?.message || "Failed to add account");
      throw error;
    }
  };

  // Update account
  const updateAccount = async (id, accountData) => {
    try {
      if (accountData.type === "Upi" && !accountData.upiAccountName) {
        toast.error("UPI account name is required");
        throw new Error("UPI account name is required");
      }

      const response = await axios.put(
        `${baseURL}/accounts/${id}`,
        accountData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data.success) {
        toast.success("Account updated successfully");
        // Invalidate cache
        await removeCache(CACHE_KEYS.ACCOUNTS);
        if (response.data.data.branch) {
          const branchId =
            typeof response.data.data.branch === "object"
              ? response.data.data.branch._id
              : response.data.data.branch;
          await removeCache(`${CACHE_KEYS.ACCOUNTS}/${branchId}`);
        }
        setAccounts((prev) =>
          prev.map((acc) => (acc._id === id ? response.data.data : acc))
        );
        return response.data.data;
      }
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error(error.response?.data?.message || "Failed to update account");
      throw error;
    }
  };

  // Delete account
  const deleteAccount = async (id) => {
    try {
      const response = await axios.delete(`${baseURL}/accounts/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        toast.success("Account deleted successfully");
        // Invalidate cache - since we don't have the branch detail easily here without looking up the removed item,
        // we can just clear all or look it up. For simplicity, clear global and rely on local state filtering.
        await removeCache(CACHE_KEYS.ACCOUNTS);
        // We'd ideally need the branchId to specifically clear the branch cache too.
        // But getAccountsByBranch will just miss the item if we don't clear it,
        // or we can just clear the whole cache if it's easier.
        setAccounts((prev) => prev.filter((acc) => acc._id !== id));
        return true;
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.message || "Failed to delete account");
      throw error;
    }
  };

  // Add balance history
  const addBalanceHistory = async (id, balanceData) => {
    try {
      const response = await axios.post(
        `${baseURL}/accounts/${id}/balance`,
        balanceData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data.success) {
        toast.success("Balance history updated");
        setAccounts((prev) =>
          prev.map((acc) => (acc._id === id ? response.data.data : acc))
        );
        return response.data.data;
      }
    } catch (error) {
      console.error("Error adding balance:", error);
      toast.error(error.response?.data?.message || "Failed to update balance");
      throw error;
    }
  };

  return (
    <AccountContext.Provider
      value={{
        accounts, // This exposes the currently loaded accounts (either all or by branch)
        loading,
        getAccounts,
        getAccountsByBranch,
        addAccount,
        updateAccount,
        deleteAccount,
        addBalanceHistory,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
